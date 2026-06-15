"""Booking business logic.

Routers stay thin (parse request -> call service -> return schema); the rules
live here and raise domain errors. This is the template other domains follow.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core import cache
from app.core.exceptions import NotFoundError, ValidationError
from app.models import Booking, BookingStatus, CancellationReason
from app.repositories.booking_repository import BookingRepository
from app.services.whatsapp import notify_booking_cancelled

CANCELLABLE_STATUSES = {BookingStatus.pending, BookingStatus.confirmed}


class BookingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.bookings = BookingRepository(db)

    def cancel_for_passenger(self, booking_id: int, passenger_id: int, reason: str) -> Booking:
        booking = self.bookings.get_for_passenger(booking_id, passenger_id)
        if not booking:
            raise NotFoundError("Booking not found")
        # A passenger may cancel while pending approval or after confirmation;
        # already cancelled/rejected/completed bookings cannot be cancelled.
        if booking.status not in CANCELLABLE_STATUSES:
            raise ValidationError("This booking can no longer be cancelled")

        booking.ride.available_seats += booking.seats_booked
        booking.ride.available_seats = min(booking.ride.available_seats, booking.ride.total_seats)
        booking.status = BookingStatus.cancelled
        booking.cancellation_reason = reason
        self.db.add(CancellationReason(user_id=passenger_id, booking_id=booking.id, reason=reason))
        notify_booking_cancelled(self.db, booking, reason, "passenger")
        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return booking
