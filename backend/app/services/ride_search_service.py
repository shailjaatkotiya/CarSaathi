"""Ride search filtering, ranking, sorting, and caching."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, time

from sqlalchemy.orm import Session

from app.core import cache
from app.models import Ride
from app.repositories.ride_repository import RideRepository
from app.schemas import RideOut
from app.services.ride_time import ride_departure_has_passed
from app.utils.serializers import ride_to_out

DEPARTURE_WINDOWS = {
    "before_0600": (time.min, time(5, 59, 59)),
    "morning": (time(6, 0), time(12, 0)),
    "afternoon": (time(12, 1), time(18, 0)),
    "after_1800": (time(18, 0, 1), time.max),
}

SORT_ALIASES = {
    "date_time": "earliest_departure",
    "time": "earliest_departure",
    "price": "lowest_price",
}


@dataclass(frozen=True)
class RideSearchFilters:
    source: str | None = None
    destination: str | None = None
    journey_date: str | None = None
    min_price: int | None = None
    max_price: int | None = None
    seats: int = 1
    departure_after: str | None = None
    departure_before: str | None = None
    pickup_point: str | None = None
    drop_point: str | None = None
    source_area: str | None = None
    destination_area: str | None = None
    driver_rating: float | None = None
    car_type: str | None = None
    fuel_type: str | None = None
    departure_window: str | None = None
    sort_by: str = "date_time"
    ac_available: bool | None = None
    verified_profile: bool | None = None
    instant_booking: bool | None = None
    smoking_allowed: bool | None = None
    pets_allowed: bool | None = None


def parse_csv_filter(value: str | None) -> set[str]:
    if not value:
        return set()
    return {item.strip() for item in value.split(",") if item.strip()}


def normalize_sort(sort_by: str) -> str:
    normalized = sort_by.strip().lower()
    return SORT_ALIASES.get(normalized, normalized)


def matches_departure_window(departure_time: time, selected_windows: set[str]) -> bool:
    if not selected_windows:
        return True
    return any(
        start <= departure_time <= end
        for key, (start, end) in DEPARTURE_WINDOWS.items()
        if key in selected_windows
    )


def text_match_rank(query: str | None, values: list[str]) -> int:
    if not query:
        return 0
    needle = query.strip().lower()
    haystack = [value.strip().lower() for value in values if value.strip()]
    if any(value == needle for value in haystack):
        return 0
    if any(value.startswith(needle) or needle.startswith(value) for value in haystack):
        return 1
    if any(needle in value or value in needle for value in haystack):
        return 2
    return 3


class RideSearchService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.rides = RideRepository(db)

    def search(self, filters: RideSearchFilters):
        source = filters.source.strip() if filters.source else None
        destination = filters.destination.strip() if filters.destination else None
        if not source or not destination:
            return []

        selected_departure_windows = parse_csv_filter(filters.departure_window)
        normalized_sort = normalize_sort(filters.sort_by)
        search_params = self._cache_params(
            filters, source, destination, selected_departure_windows, normalized_sort
        )
        cached = cache.get_cached_ride_search(search_params)
        if cached is not None:
            return [RideOut.model_validate(item) for item in cached]

        query = self.rides.list_active_with_seats(filters.seats)
        query = query.filter(Ride.source_city.ilike(f"%{source}%"))
        query = query.filter(Ride.destination_city.ilike(f"%{destination}%"))
        if filters.journey_date:
            query = query.filter(
                Ride.journey_date == date.fromisoformat(filters.journey_date)
            )
        if filters.min_price is not None:
            query = query.filter(Ride.price_per_seat >= filters.min_price)
        if filters.max_price is not None:
            query = query.filter(Ride.price_per_seat <= filters.max_price)
        if filters.departure_after:
            query = query.filter(
                Ride.departure_time >= time.fromisoformat(filters.departure_after)
            )
        if filters.departure_before:
            query = query.filter(
                Ride.departure_time <= time.fromisoformat(filters.departure_before)
            )
        if filters.ac_available is not None:
            query = query.filter(Ride.ac_available == filters.ac_available)

        results = [
            ride_to_out(ride)
            for ride in query.order_by(
                Ride.journey_date.asc(), Ride.departure_time.asc()
            ).all()
            if not ride_departure_has_passed(ride)
        ]
        results = self._apply_output_filters(
            results, filters, selected_departure_windows
        )
        results = self._sort(results, filters, normalized_sort, source, destination)

        cache.set_cached_ride_search(
            search_params, [ride.model_dump(mode="json") for ride in results]
        )
        return results

    @staticmethod
    def _cache_params(
        filters: RideSearchFilters,
        source: str,
        destination: str,
        selected_departure_windows: set[str],
        normalized_sort: str,
    ) -> dict:
        return {
            "source": source,
            "destination": destination,
            "journey_date": filters.journey_date,
            "min_price": filters.min_price,
            "max_price": filters.max_price,
            "seats": filters.seats,
            "departure_after": filters.departure_after,
            "departure_before": filters.departure_before,
            "pickup_point": filters.pickup_point,
            "drop_point": filters.drop_point,
            "source_area": filters.source_area,
            "destination_area": filters.destination_area,
            "driver_rating": filters.driver_rating,
            "car_type": filters.car_type,
            "fuel_type": filters.fuel_type,
            "departure_window": sorted(selected_departure_windows),
            "sort_by": normalized_sort,
            "ac_available": filters.ac_available,
            "verified_profile": filters.verified_profile,
            "instant_booking": filters.instant_booking,
            "smoking_allowed": filters.smoking_allowed,
            "pets_allowed": filters.pets_allowed,
        }

    @staticmethod
    def _apply_output_filters(
        results, filters: RideSearchFilters, selected_departure_windows: set[str]
    ):
        filtered = []
        for output in results:
            pickup_names = [point.lower() for point in output.pickup_points]
            drop_names = [point.lower() for point in output.drop_points]
            stop_names = [point.lower() for point in output.route_stops]
            if (
                filters.pickup_point
                and filters.pickup_point.lower() not in pickup_names
            ):
                continue
            if filters.drop_point and filters.drop_point.lower() not in drop_names:
                continue
            if filters.source_area and filters.source_area.lower() not in pickup_names:
                continue
            if (
                filters.destination_area
                and filters.destination_area.lower() not in drop_names
                and filters.destination_area.lower() not in stop_names
            ):
                continue
            if (
                filters.driver_rating is not None
                and output.driver_rating < filters.driver_rating
            ):
                continue
            if (
                filters.car_type
                and output.vehicle.car_type.lower() != filters.car_type.lower()
            ):
                continue
            if (
                filters.fuel_type
                and output.vehicle.fuel_type.lower() != filters.fuel_type.lower()
            ):
                continue
            if not matches_departure_window(
                output.departure_time, selected_departure_windows
            ):
                continue
            if (
                filters.verified_profile is not None
                and output.driver_verified != filters.verified_profile
            ):
                continue
            if (
                filters.instant_booking is not None
                and output.auto_confirm_bookings != filters.instant_booking
            ):
                continue
            if (
                filters.smoking_allowed is not None
                and output.smoking_allowed != filters.smoking_allowed
            ):
                continue
            if (
                filters.pets_allowed is not None
                and ("no_pets" not in output.ride_rules) != filters.pets_allowed
            ):
                continue
            filtered.append(output)
        return filtered

    @staticmethod
    def _sort(
        results,
        filters: RideSearchFilters,
        normalized_sort: str,
        source: str,
        destination: str,
    ):
        if normalized_sort == "lowest_price":
            return sorted(results, key=lambda item: item.price_per_seat)
        if normalized_sort == "close_to_departure_point":
            departure_query = filters.source_area or filters.pickup_point or source
            return sorted(
                results,
                key=lambda item: (
                    text_match_rank(
                        departure_query, item.pickup_points + [item.source_city]
                    ),
                    item.journey_date,
                    item.departure_time,
                    item.price_per_seat,
                ),
            )
        if normalized_sort == "close_to_arrival_point":
            arrival_query = (
                filters.destination_area or filters.drop_point or destination
            )
            return sorted(
                results,
                key=lambda item: (
                    text_match_rank(
                        arrival_query,
                        item.drop_points + item.route_stops + [item.destination_city],
                    ),
                    item.journey_date,
                    item.departure_time,
                    item.price_per_seat,
                ),
            )
        if normalized_sort == "shortest_ride":
            return sorted(
                results,
                key=lambda item: (
                    item.distance_km,
                    item.journey_date,
                    item.departure_time,
                ),
            )
        return sorted(
            results, key=lambda item: (item.journey_date, item.departure_time)
        )
