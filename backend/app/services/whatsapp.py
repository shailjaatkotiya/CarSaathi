import json
import logging

from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Booking, NotificationLog, NotificationStatus, User

logger = logging.getLogger("ridesaathi.whatsapp")

# Session.info key holding sends queued during the current transaction.
# Drained by the after_commit listener so the Celery worker can never pick up
# a task before its NotificationLog row is committed.
_PENDING_KEY = "whatsapp_pending_dispatch"

_BODY_TEMPLATES = {
    "passenger_booking_confirmation": (
        "RideSaathi: booking confirmed!\n"
        "Driver: {driver_name} ({driver_whatsapp_number})\n"
        "Car: {car_model} ({vehicle_number})\n"
        "Pickup: {pickup_point}\n"
        "Departure: {journey_time}\n"
        "Seats: {seat_count_booked}"
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


@event.listens_for(Session, "after_commit")
def _dispatch_after_commit(session: Session) -> None:
    pending = session.info.pop(_PENDING_KEY, None)
    if not pending:
        return
    from app.tasks.whatsapp_tasks import send_whatsapp_message

    for kwargs in pending:
        try:
            send_whatsapp_message.delay(**kwargs)
        except Exception:  # noqa: BLE001 - broker outage must not break the request
            logger.exception("failed to enqueue whatsapp task log_id=%s", kwargs.get("log_id"))


def log_whatsapp(db: Session, user: User, booking: Booking, template_name: str, payload: dict) -> NotificationLog:
    settings = get_settings()
    recipient = user.whatsapp_number or "missing"
    use_twilio = settings.whatsapp_provider == "twilio"

    if not use_twilio:
        status = NotificationStatus.mocked
    elif recipient == "missing":
        status = NotificationStatus.failed
    else:
        status = NotificationStatus.queued

    log = NotificationLog(
        user_id=user.id,
        booking_id=booking.id,
        template_name=template_name,
        recipient=recipient,
        payload=json.dumps(payload),
        status=status,
    )
    db.add(log)

    if status == NotificationStatus.queued:
        db.flush()  # assign log.id before enqueueing
        db.info.setdefault(_PENDING_KEY, []).append(
            {
                "log_id": log.id,
                "recipient": recipient,
                "body": _render_body(template_name, payload),
                "content_sid": _content_sid_for(template_name),
                "content_variables": {key: str(value) for key, value in payload.items()},
            }
        )
    return log


def notify_booking_created(db: Session, booking: Booking) -> None:
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
            "driver_name": driver.full_name,
            "driver_whatsapp_number": driver.whatsapp_number,
            "car_model": f"{vehicle.brand} {vehicle.model}",
            "vehicle_number": vehicle.vehicle_number,
            "pickup_point": booking.pickup_point,
            "journey_time": ride.departure_time.isoformat(),
            "seat_count_booked": booking.seats_booked,
        },
    )
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
