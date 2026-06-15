from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Vehicle
from app.repositories.base import BaseRepository


class VehicleRepository(BaseRepository[Vehicle]):
    model = Vehicle

    def get_for_driver(self, vehicle_id: int, driver_id: int) -> Vehicle | None:
        return (
            self.db.query(Vehicle)
            .filter(Vehicle.id == vehicle_id, Vehicle.driver_id == driver_id)
            .first()
        )

    def get_by_number(self, vehicle_number: str) -> Vehicle | None:
        return self.db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_number).first()

    def list_for_driver(self, driver_id: int) -> list[Vehicle]:
        return self.db.query(Vehicle).filter(Vehicle.driver_id == driver_id).all()
