import re

from app.models import Ride
from app.schemas import RideOut, VehicleOut


def _extract_list(notes: str | None, key: str) -> list[str]:
    if not notes:
        return []
    match = re.search(rf"\[{key}\](.*?)\[/{key}\]", notes, flags=re.DOTALL)
    if not match:
        return []
    return [item.strip() for item in match.group(1).split("|") if item.strip()]


def clean_route_notes(notes: str | None) -> str | None:
    if not notes:
        return notes
    cleaned = re.sub(r"\[route_stops\].*?\[/route_stops\]", "", notes, flags=re.DOTALL)
    cleaned = re.sub(r"\[ride_rules\].*?\[/ride_rules\]", "", cleaned, flags=re.DOTALL)
    cleaned = re.sub(r"\[driver_instructions\].*?\[/driver_instructions\]", "", cleaned, flags=re.DOTALL)
    return cleaned.strip() or None


def ride_to_out(ride: Ride) -> RideOut:
    return RideOut(
        id=ride.id,
        source_city=ride.source_city,
        destination_city=ride.destination_city,
        distance_km=ride.distance_km,
        journey_date=ride.journey_date,
        departure_time=ride.departure_time,
        available_seats=ride.available_seats,
        total_seats=ride.total_seats,
        price_per_seat=ride.price_per_seat,
        pickup_points=[point.name for point in ride.pickup_points],
        drop_points=[point.name for point in ride.drop_points],
        route_notes=clean_route_notes(ride.route_notes),
        luggage_allowance=ride.luggage_allowance,
        smoking_allowed=ride.smoking_allowed,
        ac_available=ride.ac_available,
        women_only_preference=ride.women_only_preference,
        auto_confirm_bookings=ride.auto_confirm_bookings,
        status=ride.status,
        driver_name=ride.driver.full_name,
        driver_rating=ride.driver.rating_average,
        driver_verified=ride.driver.verification_status.value == "verified",
        route_stops=_extract_list(ride.route_notes, "route_stops"),
        ride_rules=_extract_list(ride.route_notes, "ride_rules"),
        driver_instructions=(_extract_list(ride.route_notes, "driver_instructions") or [None])[0],
        vehicle=VehicleOut(
            id=ride.vehicle.id,
            brand=ride.vehicle.brand,
            model=ride.vehicle.model,
            vehicle_number=ride.vehicle.vehicle_number,
            fuel_type=ride.vehicle.fuel_type,
            car_type=ride.vehicle.car_type,
            seats=ride.vehicle.seats,
            photo_urls=[url for url in ride.vehicle.photo_urls.split(",") if url],
            is_verified=ride.vehicle.is_verified,
        ),
    )
