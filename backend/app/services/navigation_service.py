from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationError
from app.models import Ride, RideStatus
from app.schemas.navigation import NavigationRequest
from app.services.amazon_location_service import AmazonLocationService
from app.utils.serializers import _extract_list


class NavigationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.amazon_location = AmazonLocationService(get_settings())

    def ride_navigation(self, ride_id: int, payload: NavigationRequest) -> dict:
        ride = (
            self.db.query(Ride)
            .filter(Ride.id == ride_id, Ride.status != RideStatus.cancelled)
            .first()
        )
        if not ride:
            raise NotFoundError("Ride not found")

        pickup = payload.pickup_point.strip()
        drop = payload.drop_point.strip()
        allowed_pickups = {point.name for point in ride.pickup_points}
        route_stops = set(_extract_list(ride.route_notes, "route_stops"))
        allowed_drops = {point.name for point in ride.drop_points} | route_stops
        if pickup not in allowed_pickups:
            raise ValidationError("Select a valid pickup point for this ride")
        if drop not in allowed_drops:
            raise ValidationError("Select a valid drop point for this ride")

        origin_query = self._place_query(pickup, ride.source_city)
        destination_city = (
            ride.destination_city if drop in {p.name for p in ride.drop_points} else ""
        )
        destination_query = self._place_query(drop, destination_city)
        return self.amazon_location.calculate_route(origin_query, destination_query)

    @staticmethod
    def _place_query(point: str, city: str) -> str:
        parts = [point]
        if city and city.lower() not in point.lower():
            parts.append(city)
        parts.extend(["Gujarat", "India"])
        return ", ".join(parts)
