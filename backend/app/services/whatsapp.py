import json

from sqlalchemy.orm import Session

from app.models import Booking, NotificationLog, NotificationStatus, User


def log_whatsapp(db: Session, user: User, booking: Booking, template_name: str, payload: dict) -> NotificationLog:
    log = NotificationLog(
        user_id=user.id,
        booking_id=booking.id,
        template_name=template_name,
        recipient=user.whatsapp_number or "missing",
        payload=json.dumps(payload),
        status=NotificationStatus.mocked,
    )
    db.add(log)
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
