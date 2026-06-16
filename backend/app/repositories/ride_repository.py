from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Ride, RideStatus
from app.repositories.base import BaseRepository


class RideRepository(BaseRepository[Ride]):
    model = Ride

    def get_for_driver(self, ride_id: int, driver_id: int) -> Ride | None:
        return (
            self.db.query(Ride)
            .filter(Ride.id == ride_id, Ride.driver_id == driver_id)
            .first()
        )

    def list_for_driver(self, driver_id: int) -> list[Ride]:
        # Latest ride date/time first.
        return (
            self.db.query(Ride)
            .filter(Ride.driver_id == driver_id)
            .order_by(Ride.journey_date.desc(), Ride.departure_time.desc())
            .all()
        )

    def lock_active(self, ride_id: int) -> Ride | None:
        """Row-locked fetch used while reserving seats during booking."""
        return self.db.query(Ride).filter(Ride.id == ride_id).with_for_update().first()

    def list_active_with_seats(self, min_seats: int):
        return self.db.query(Ride).filter(
            Ride.status == RideStatus.active, Ride.available_seats >= min_seats
        )

    def list_newest_first(self) -> list[Ride]:
        return self.db.query(Ride).order_by(Ride.created_at.desc()).all()
