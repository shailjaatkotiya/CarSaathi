from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    model = Booking

    def get_for_passenger(self, booking_id: int, passenger_id: int) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id, Booking.passenger_id == passenger_id)
            .first()
        )

    def list_active_for_passenger(self, passenger_id: int) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.passenger_id == passenger_id, Booking.status != BookingStatus.completed)
            .order_by(Booking.created_at.desc())
            .all()
        )


def get_booking_repository(db: Session) -> BookingRepository:
    return BookingRepository(db)
