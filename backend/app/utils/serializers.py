import re

from app.models import Booking, Ride, RideStatus
from app.schemas import DriverBookingOut, PassengerOut, RideOut, VehicleOut
from app.services.ride_time import ride_has_ended


def driver_booking_to_out(booking: Booking) -> DriverBookingOut:
    return DriverBookingOut(
        id=booking.id,
        booking_code=booking.booking_code,
        ride_id=booking.ride_id,
        passenger_id=booking.passenger_id,
        driver_id=booking.driver_id,
        driver_name=booking.driver_name,
        car_number=booking.car_number,
        car_color=booking.car_color,
        route=booking.route,
        journey_date=booking.journey_date,
        departure_time=booking.departure_time,
        seats_booked=booking.seats_booked,
        pickup_point=booking.pickup_point,
        drop_point=booking.drop_point,
        status=booking.status,
        total_amount=booking.total_amount,
        payment_method=booking.payment_method,
        payment_status=booking.payment_status,
        passengers=[
            PassengerOut.model_validate(person) for person in booking.passengers
        ],
        passenger_name=booking.passenger.full_name,
        passenger_whatsapp=booking.passenger.whatsapp_number,
    )


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
    cleaned = re.sub(
        r"\[driver_instructions\].*?\[/driver_instructions\]",
        "",
        cleaned,
        flags=re.DOTALL,
    )
    return cleaned.strip() or None


def ride_to_out(ride: Ride) -> RideOut:
    # An active ride that has ended (past the on-going window) is shown as
    # completed even if a background job has not flipped the stored status yet.
    effective_status = ride.status
    if ride.status == RideStatus.active and ride_has_ended(ride):
        effective_status = RideStatus.completed
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
        status=effective_status,
        driver_name=ride.driver.full_name,
        driver_rating=ride.driver.rating_average,
        driver_verified=ride.driver.verification_status.value == "verified",
        route_stops=_extract_list(ride.route_notes, "route_stops"),
        ride_rules=_extract_list(ride.route_notes, "ride_rules"),
        driver_instructions=(
            _extract_list(ride.route_notes, "driver_instructions") or [None]
        )[0],
        vehicle=VehicleOut(
            id=ride.vehicle.id,
            brand=ride.vehicle.brand,
            model=ride.vehicle.model,
            vehicle_number=ride.vehicle.vehicle_number,
            fuel_type=ride.vehicle.fuel_type,
            car_type=ride.vehicle.car_type,
            color=ride.vehicle.color,
            seats=ride.vehicle.seats,
            photo_urls=[url for url in ride.vehicle.photo_urls.split(",") if url],
            is_verified=ride.vehicle.is_verified,
        ),
    )
