"""Driver vehicle CRUD."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import User, Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas import VehicleCreate


class VehicleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.vehicles = VehicleRepository(db)

    def list_for_driver(self, driver: User) -> list[Vehicle]:
        return self.vehicles.list_for_driver(driver.id)

    def add(self, driver: User, payload: VehicleCreate) -> Vehicle:
        vehicle = Vehicle(
            driver_id=driver.id,
            brand=payload.brand,
            model=payload.model,
            vehicle_number=payload.vehicle_number.upper(),
            fuel_type=payload.fuel_type,
            car_type=payload.car_type,
            color=payload.color,
            seats=payload.seats,
            photo_urls=",".join(payload.photo_urls),
        )
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def update(self, driver: User, vehicle_id: int, payload: VehicleCreate) -> Vehicle:
        vehicle = self.vehicles.get_for_driver(vehicle_id, driver.id)
        if not vehicle:
            raise NotFoundError("Vehicle not found")
        for field in ["brand", "model", "fuel_type", "car_type", "color", "seats"]:
            setattr(vehicle, field, getattr(payload, field))
        vehicle.vehicle_number = payload.vehicle_number.upper()
        vehicle.photo_urls = ",".join(payload.photo_urls)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle
