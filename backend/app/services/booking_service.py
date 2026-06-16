"""Booking business logic: book, verify payment, cancel, history, report.

Routers stay thin (parse request -> call service -> return schema); the rules
live here and raise domain errors. This is the template other domains follow.
"""

from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from app.core import cache
from app.core.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import (
    Booking,
    BookingStatus,
    CancellationReason,
    Payment,
    ReportedUser,
    Ride,
    RideStatus,
    User,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.ride_repository import RideRepository
from app.schemas import (
    BookingActionOut,
    BookingCreate,
    BookingOut,
    PaymentInitOut,
    ReportCreate,
)
from app.services import razorpay_client
from app.services.ride_seats import cap_available_seats
from app.services.ride_time import auto_complete_if_passed, ride_departure_has_passed
from app.services.whatsapp import notify_booking_cancelled, notify_booking_created
from app.utils.serializers import ride_to_out

settings = get_settings()

CANCELLABLE_STATUSES = {BookingStatus.pending, BookingStatus.confirmed}


class BookingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.bookings = BookingRepository(db)
        self.rides = RideRepository(db)

    # ----- booking ----------------------------------------------------------
    def book(
        self, ride_id: int, passenger: User, payload: BookingCreate
    ) -> BookingActionOut:
        if not (passenger.whatsapp_number and passenger.whatsapp_number.strip()):
            raise ValidationError(
                "Please add your WhatsApp contact number in My Profile before booking a ride"
            )
        if payload.payment_method == "online" and not razorpay_client.is_configured():
            raise ValidationError(
                "Online payment is not available right now. Please choose Pay by cash."
            )

        ride = self.rides.lock_active(ride_id)
        if not ride or ride.status != RideStatus.active:
            raise NotFoundError("Ride not available")
        if ride.driver_id == passenger.id:
            raise ValidationError("Driver cannot book own ride")
        if payload.seats_booked > ride.available_seats:
            raise ConflictError("Not enough seats available")
        if ride_departure_has_passed(ride):
            raise ValidationError("This ride has already departed")

        ride_output = ride_to_out(ride)
        valid_pickups = ride_output.pickup_points
        valid_drops = ride_output.drop_points + ride_output.route_stops
        if (
            payload.pickup_point not in valid_pickups
            or payload.drop_point not in valid_drops
        ):
            raise ValidationError("Invalid pickup or drop point")

        total_amount = payload.seats_booked * ride.price_per_seat
        ride.available_seats -= payload.seats_booked

        if payload.payment_method == "online":
            # Reserve seats but keep unconfirmed until payment succeeds; the
            # driver is notified only after the money is verified.
            booking_status = BookingStatus.pending
            payment = Payment(method="online", status="created", amount=total_amount)
        else:
            booking_status = (
                BookingStatus.confirmed
                if ride.auto_confirm_bookings
                else BookingStatus.pending
            )
            payment = Payment(method="cash", status="pending_cash", amount=total_amount)

        booking = Booking(
            booking_code=f"RS-{uuid4().hex[:8].upper()}",
            ride_id=ride.id,
            passenger_id=passenger.id,
            seats_booked=payload.seats_booked,
            pickup_point=payload.pickup_point,
            drop_point=payload.drop_point,
            status=booking_status,
            total_amount=total_amount,
            payment_method=payload.payment_method,
        )
        booking.payment = payment
        self.db.add(booking)
        self.db.flush()

        payment_init: PaymentInitOut | None = None
        if payload.payment_method == "online":
            try:
                order = razorpay_client.create_order(
                    total_amount, receipt=booking.booking_code
                )
            except (
                Exception
            ) as exc:  # noqa: BLE001 - surface a clean error, roll back the reservation
                self.db.rollback()
                raise ValidationError(
                    "Could not start the payment. Please try again."
                ) from exc
            payment.razorpay_order_id = order["id"]
            payment_init = PaymentInitOut(
                razorpay_order_id=order["id"],
                razorpay_key_id=settings.razorpay_key_id,
                amount=order["amount"],
                currency=order["currency"],
                booking_code=booking.booking_code,
            )
        else:
            notify_booking_created(self.db, booking)

        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return BookingActionOut(
            booking=BookingOut.model_validate(booking), payment=payment_init
        )

    # ----- payment verification --------------------------------------------
    def verify_payment(self, payload, passenger: User) -> Booking:
        booking = self.bookings.get_for_passenger(payload.booking_id, passenger.id)
        if not booking or not booking.payment:
            raise NotFoundError("Booking not found")
        payment = booking.payment
        if (
            payment.method != "online"
            or payment.razorpay_order_id != payload.razorpay_order_id
        ):
            raise ValidationError("Payment does not match this booking")
        if payment.status == "paid":
            return booking  # idempotent
        if not razorpay_client.verify_payment_signature(
            payload.razorpay_order_id,
            payload.razorpay_payment_id,
            payload.razorpay_signature,
        ):
            raise ValidationError("Payment verification failed")

        payment.status = "paid"
        payment.provider_reference = payload.razorpay_payment_id
        booking.status = (
            BookingStatus.confirmed
            if booking.ride.auto_confirm_bookings
            else BookingStatus.pending
        )
        notify_booking_created(self.db, booking)
        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return booking

    # ----- cancel -----------------------------------------------------------
    def cancel_for_passenger(
        self, booking_id: int, passenger_id: int, reason: str
    ) -> Booking:
        booking = self.bookings.get_for_passenger(booking_id, passenger_id)
        if not booking:
            raise NotFoundError("Booking not found")
        if booking.status not in CANCELLABLE_STATUSES:
            raise ValidationError("This booking can no longer be cancelled")

        booking.ride.available_seats += booking.seats_booked
        cap_available_seats(booking.ride)
        booking.status = BookingStatus.cancelled
        booking.cancellation_reason = reason
        self.db.add(
            CancellationReason(
                user_id=passenger_id, booking_id=booking.id, reason=reason
            )
        )
        notify_booking_cancelled(self.db, booking, reason, "passenger")
        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return booking

    # ----- read models ------------------------------------------------------
    def history(self, passenger: User) -> list[Booking]:
        bookings = self.bookings.list_active_for_passenger(passenger.id)
        changed = [auto_complete_if_passed(booking.ride) for booking in bookings]
        if any(changed):
            self.db.commit()
            cache.bump_rides_version()
        # Bookings that just completed drop out of the "not completed yet" list.
        return [
            booking
            for booking in bookings
            if booking.status != BookingStatus.completed
        ]

    def report(self, reporter: User, payload: ReportCreate) -> None:
        self.db.add(
            ReportedUser(
                reporter_id=reporter.id,
                reported_user_id=payload.reported_user_id,
                ride_id=payload.ride_id,
                reason=payload.reason,
            )
        )
        self.db.commit()
