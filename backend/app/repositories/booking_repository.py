from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus, Ride
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    model = Booking

    def get_for_passenger(self, booking_id: int, passenger_id: int) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(Booking.id == booking_id, Booking.passenger_id == passenger_id)
            .first()
        )

    def get_for_driver(self, booking_id: int, driver_id: int) -> Booking | None:
        return (
            self.db.query(Booking)
            .join(Ride)
            .filter(Booking.id == booking_id, Ride.driver_id == driver_id)
            .first()
        )

    def get_by_code(self, booking_code: str) -> Booking | None:
        return self.db.query(Booking).filter(Booking.booking_code == booking_code).first()

    def get_by_order_id(self, order_id: str) -> Booking | None:
        from app.models import Payment

        payment = self.db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        return payment.booking if payment else None

    def list_active_for_passenger(self, passenger_id: int) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.passenger_id == passenger_id, Booking.status != BookingStatus.completed)
            .order_by(Booking.created_at.desc())
            .all()
        )

    def list_newest_first(self) -> list[Booking]:
        return self.db.query(Booking).order_by(Booking.created_at.desc()).all()


def get_booking_repository(db: Session) -> BookingRepository:
    return BookingRepository(db)
