import json

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Booking, NotificationLog, NotificationStatus, User
from app.services.twilio_client import send_via_twilio

_BODY_TEMPLATES = {
    "passenger_booking_confirmation": (
        "RideSaathi: booking {booking_status}!\n"
        "Booking: {booking_id}\n"
        "Route: {route}\n"
        "Driver: {driver_name} ({driver_whatsapp_number})\n"
        "Car: {car_model} ({vehicle_number})\n"
        "Pickup: {pickup_point}\n"
        "Drop: {drop_off_point}\n"
        "Departure: {journey_date} {journey_time}\n"
        "Seats: {seat_count_booked}\n"
        "Amount: Rs. {total_amount}"
    ),
    "driver_booking_request": (
        "RideSaathi: new booking {booking_id}.\n"
        "Passenger: {passenger_name} ({passenger_whatsapp_number})\n"
        "Seats: {seats_booked}\n"
        "Pickup: {pickup_point}\n"
        "Drop: {drop_off_point}"
    ),
    "passenger_booking_cancelled": (
        "RideSaathi: booking {booking_id} cancelled by {cancelled_by}.\n"
        "Route: {route}\n"
        "Journey: {journey_date} {journey_time}\n"
        "Seats: {seats_booked}\n"
        "Reason: {reason}"
    ),
    "driver_booking_cancelled": (
        "RideSaathi: booking {booking_id} cancelled by {cancelled_by}.\n"
        "Route: {route}\n"
        "Journey: {journey_date} {journey_time}\n"
        "Pickup: {pickup_point}, drop: {drop_off_point}\n"
        "Seats: {seats_booked}\n"
        "Reason: {reason}"
    ),
}


def _render_body(template_name: str, payload: dict) -> str:
    template = _BODY_TEMPLATES.get(template_name)
    if not template:
        return f"RideSaathi notification ({template_name}): {json.dumps(payload)}"
    return template.format(**payload)


def _content_sid_for(template_name: str) -> str | None:
    return getattr(get_settings(), f"twilio_content_sid_{template_name}", "") or None


def log_whatsapp(db: Session, user: User, booking: Booking, template_name: str, payload: dict) -> NotificationLog:
    settings = get_settings()
    recipient = user.whatsapp_number or "missing"
    use_twilio = settings.whatsapp_provider == "twilio"
    # WhatsApp rejects template sends with empty variables, and freeform
    # bodies would render literal "None" — substitute a dash instead.
    payload = {key: value if value is not None and str(value).strip() else "-" for key, value in payload.items()}

    if not use_twilio:
        status = NotificationStatus.mocked
    elif recipient == "missing":
        status = NotificationStatus.failed
    else:
        status = send_via_twilio(
            recipient,
            _render_body(template_name, payload),
            _content_sid_for(template_name),
            {key: str(value) for key, value in payload.items()},
        )

    log = NotificationLog(
        user_id=user.id,
        booking_id=booking.id,
        template_name=template_name,
        recipient=recipient,
        payload=json.dumps(payload),
        status=status,
    )
    db.add(log)

    return log


def notify_booking_created(db: Session, booking: Booking, notify_driver: bool = True) -> None:
    ride = booking.ride
    driver = ride.driver
    passenger = booking.passenger
    vehicle = ride.vehicle

    log_whatsapp(
        db,
        passenger,
        booking,
        "passenger_booking_confirmation",
        {
            "booking_id": booking.booking_code,
            "booking_status": booking.status.value,
            "route": f"{ride.source_city} to {ride.destination_city}",
            "driver_name": driver.full_name,
            "driver_whatsapp_number": driver.whatsapp_number,
            "car_model": f"{vehicle.brand} {vehicle.model}",
            "vehicle_number": vehicle.vehicle_number,
            "pickup_point": booking.pickup_point,
            "drop_off_point": booking.drop_point,
            "journey_date": ride.journey_date.isoformat(),
            "journey_time": ride.departure_time.isoformat(),
            "seat_count_booked": booking.seats_booked,
            "total_amount": booking.total_amount,
        },
    )
    if notify_driver:
        log_whatsapp(
            db,
            driver,
            booking,
            "driver_booking_request",
            {
                "passenger_name": passenger.full_name,
                "passenger_whatsapp_number": passenger.whatsapp_number,
                "seats_booked": booking.seats_booked,
                "pickup_point": booking.pickup_point,
                "drop_off_point": booking.drop_point,
                "booking_id": booking.booking_code,
            },
        )


def notify_booking_cancelled(db: Session, booking: Booking, reason: str, cancelled_by: str) -> None:
    ride = booking.ride
    passenger = booking.passenger
    driver = ride.driver
    payload = {
        "booking_id": booking.booking_code,
        "route": f"{ride.source_city} to {ride.destination_city}",
        "journey_date": ride.journey_date.isoformat(),
        "journey_time": ride.departure_time.isoformat(),
        "pickup_point": booking.pickup_point,
        "drop_off_point": booking.drop_point,
        "seats_booked": booking.seats_booked,
        "cancelled_by": cancelled_by,
        "reason": reason,
    }
    log_whatsapp(db, passenger, booking, "passenger_booking_cancelled", payload)
    log_whatsapp(db, driver, booking, "driver_booking_cancelled", payload)


def notify_ride_cancelled(db: Session, ride, reason: str) -> None:
    active_bookings = [booking for booking in ride.bookings if booking.status.value in {"pending", "confirmed"}]
    for booking in active_bookings:
        notify_booking_cancelled(db, booking, reason, "driver")
