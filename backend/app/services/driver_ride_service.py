"""Driver ride lifecycle: publish, list, cancel, complete, and booking decisions."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core import cache
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import (
    Booking,
    BookingStatus,
    CancellationReason,
    Ride,
    RideDropPoint,
    RidePickupPoint,
    RideStatus,
    User,
    Vehicle,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.ride_repository import RideRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas import RideCreate
from app.services.ride_seats import cap_available_seats, default_available_seats
from app.services.ride_time import auto_complete_if_passed
from app.services.whatsapp import (
    notify_booking_created,
    notify_booking_rejected_by_driver,
    notify_ride_cancelled,
)
from app.utils.serializers import ride_to_out


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _build_route_notes(
    notes: str | None,
    route_stops: list[str],
    ride_rules: list[str],
    driver_instructions: str | None,
) -> str | None:
    parts = [notes.strip()] if notes and notes.strip() else []
    if route_stops:
        parts.append(f"[route_stops]{'|'.join(route_stops)}[/route_stops]")
    if ride_rules:
        parts.append(f"[ride_rules]{'|'.join(ride_rules)}[/ride_rules]")
    if driver_instructions and driver_instructions.strip():
        parts.append(
            f"[driver_instructions]{driver_instructions.strip()}[/driver_instructions]"
        )
    return "\n\n".join(parts) if parts else None


def _has_car_details(payload: RideCreate) -> bool:
    return all(
        _clean_optional(value)
        for value in [
            payload.car_brand,
            payload.car_model,
            payload.vehicle_number,
            payload.fuel_type,
            payload.car_type,
        ]
    )


class DriverRideService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.rides = RideRepository(db)
        self.vehicles = VehicleRepository(db)
        self.bookings = BookingRepository(db)

    # ----- publishing -------------------------------------------------------
    def publish(self, driver: User, payload: RideCreate) -> Ride:
        if not (driver.whatsapp_number and driver.whatsapp_number.strip()):
            raise ValidationError(
                "Please add your WhatsApp contact number in My Profile before publishing a ride"
            )
        self._validate_stop_counts(payload)
        vehicle = self._resolve_vehicle(driver, payload)
        if payload.available_seats < 1:
            raise ValidationError("Minimum 1 seat must be available before publishing")
        max_seats = default_available_seats(vehicle.car_type)
        if payload.available_seats > max_seats:
            raise ValidationError(
                f"{vehicle.car_type} rides can publish up to {max_seats} passenger seats"
            )
        self._validate_publish_window(payload)

        # Distance comes from the chosen route when present (km, rounded);
        # otherwise the driver-supplied/default value.
        distance_km = payload.distance_km
        if payload.route_distance_m:
            distance_km = max(1, round(payload.route_distance_m / 1000))

        ride = Ride(
            driver_id=driver.id,
            vehicle_id=vehicle.id,
            source_city=payload.source_city,
            destination_city=payload.destination_city,
            source_lat=payload.source_lat,
            source_lng=payload.source_lng,
            destination_lat=payload.destination_lat,
            destination_lng=payload.destination_lng,
            route_key=f"{payload.source_city.lower()}:{payload.destination_city.lower()}",
            distance_km=distance_km,
            route_geometry=(
                json.dumps(payload.route_geometry) if payload.route_geometry else None
            ),
            route_distance_m=payload.route_distance_m,
            route_duration_s=payload.route_duration_s,
            route_label=payload.route_label,
            route_has_tolls=payload.route_has_tolls,
            journey_date=payload.journey_date,
            departure_time=payload.departure_time,
            available_seats=payload.available_seats,
            total_seats=payload.available_seats,
            price_per_seat=payload.price_per_seat,
            route_notes=_build_route_notes(
                payload.route_notes,
                payload.route_stops,
                payload.ride_rules,
                payload.driver_instructions,
            ),
            luggage_allowance=payload.luggage_allowance,
            smoking_allowed=payload.smoking_allowed,
            ac_available=payload.ac_available,
            women_only_preference=payload.women_only_preference,
            auto_confirm_bookings=payload.auto_confirm_bookings,
        )
        self.db.add(ride)
        self.db.flush()
        self.db.add_all(
            [
                RidePickupPoint(ride_id=ride.id, name=name)
                for name in payload.pickup_points
            ]
        )
        self.db.add_all(
            [RideDropPoint(ride_id=ride.id, name=name) for name in payload.drop_points]
        )
        self.db.commit()
        self.db.refresh(ride)
        cache.bump_rides_version()
        return ride

    @staticmethod
    def _validate_publish_window(payload: RideCreate) -> None:
        journey_at = datetime.combine(payload.journey_date, payload.departure_time)
        now = datetime.now()
        if journey_at < now + timedelta(hours=3):
            raise ValidationError(
                "Ride must be published at least 3 hours before departure"
            )
        if journey_at > now + timedelta(days=30):
            raise ValidationError(
                "Ride can be published maximum 30 days before departure"
            )

    @staticmethod
    def _validate_stop_counts(payload: RideCreate) -> None:
        if len(payload.pickup_points) < 1:
            raise ValidationError("Please add at least 1 pickup point")
        if len(payload.pickup_points) > 5:
            raise ValidationError("Please add at most 5 pickup points")
        if len(payload.drop_points) < 1:
            raise ValidationError("Please add at least 1 drop point")

    def _resolve_vehicle(self, driver: User, payload: RideCreate) -> Vehicle:
        if payload.vehicle_id is not None:
            vehicle = self.vehicles.get_for_driver(payload.vehicle_id, driver.id)
            if not vehicle:
                raise ValidationError("Selected vehicle was not found for this driver")
            self._apply_vehicle_details(vehicle, payload)
            return vehicle

        number = _clean_optional(payload.vehicle_number)
        normalized = number.upper() if number else None
        if normalized:
            existing = self.vehicles.get_by_number(normalized)
            if existing and existing.driver_id != driver.id:
                raise ValidationError(
                    "Vehicle number already belongs to another driver"
                )
            if existing:
                self._apply_vehicle_details(existing, payload)
                return existing

        if not _has_car_details(payload):
            raise ValidationError(
                "Car brand, model, number, fuel type, and category are required before publishing a ride"
            )
        vehicle = Vehicle(
            driver_id=driver.id,
            brand=_clean_optional(payload.car_brand) or "",
            model=_clean_optional(payload.car_model) or "",
            vehicle_number=normalized or f"TBD-{driver.id}-{uuid4().hex[:6].upper()}",
            fuel_type=_clean_optional(payload.fuel_type) or "",
            car_type=_clean_optional(payload.car_type) or "",
            color=_clean_optional(payload.car_color) or "White",
            seats=payload.car_seats or default_available_seats(payload.car_type),
            photo_urls="",
        )
        self.db.add(vehicle)
        self.db.flush()
        return vehicle

    @staticmethod
    def _apply_vehicle_details(vehicle: Vehicle, payload: RideCreate) -> None:
        if brand := _clean_optional(payload.car_brand):
            vehicle.brand = brand
        if model := _clean_optional(payload.car_model):
            vehicle.model = model
        if number := _clean_optional(payload.vehicle_number):
            vehicle.vehicle_number = number.upper()
        if fuel_type := _clean_optional(payload.fuel_type):
            vehicle.fuel_type = fuel_type
        if car_type := _clean_optional(payload.car_type):
            vehicle.car_type = car_type
        if color := _clean_optional(payload.car_color):
            vehicle.color = color
        if payload.car_seats:
            vehicle.seats = payload.car_seats

    # ----- listing & lifecycle ---------------------------------------------
    def list_for_driver(self, driver: User) -> list[Ride]:
        rides = self.rides.list_for_driver(driver.id)
        changed = [auto_complete_if_passed(ride) for ride in rides]
        if any(changed):
            self.db.commit()
            cache.bump_rides_version()
        return rides

    def _require_ride(self, ride_id: int, driver: User) -> Ride:
        ride = self.rides.get_for_driver(ride_id, driver.id)
        if not ride:
            raise NotFoundError("Ride not found")
        return ride

    def cancel(self, ride_id: int, driver: User, reason: str) -> None:
        ride = self._require_ride(ride_id, driver)
        notify_ride_cancelled(self.db, ride, reason)
        ride.status = RideStatus.cancelled
        ride.cancellation_reason = reason
        for booking in ride.bookings:
            if booking.status in {BookingStatus.pending, BookingStatus.confirmed}:
                booking.status = BookingStatus.cancelled
                booking.cancellation_reason = f"Driver cancelled ride: {reason}"
        self.db.add(
            CancellationReason(user_id=driver.id, ride_id=ride.id, reason=reason)
        )
        self.db.commit()
        cache.bump_rides_version()

    def complete(self, ride_id: int, driver: User) -> None:
        ride = self._require_ride(ride_id, driver)
        if ride.status == RideStatus.cancelled:
            raise ValidationError("A cancelled ride cannot be completed")
        ride.status = RideStatus.completed
        for booking in ride.bookings:
            if booking.status == BookingStatus.confirmed:
                booking.status = BookingStatus.completed
        self.db.commit()
        cache.bump_rides_version()

    def ride_bookings(self, ride_id: int, driver: User) -> list[Booking]:
        ride = self._require_ride(ride_id, driver)
        return list(ride.bookings)

    # ----- booking decisions -----------------------------------------------
    def accept_booking(self, booking: Booking) -> Booking:
        if booking.status == BookingStatus.confirmed:
            return booking
        if booking.status != BookingStatus.pending:
            raise ValidationError("Only pending bookings can be accepted")
        booking.status = BookingStatus.confirmed
        notify_booking_created(self.db, booking, notify_driver=False)
        return booking

    def accept_booking_for_driver(self, booking_id: int, driver: User) -> Booking:
        booking = self.bookings.get_for_driver(booking_id, driver.id)
        if not booking:
            raise NotFoundError("Booking not found")
        booking = self.accept_booking(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def accept_booking_by_code(self, booking_code: str) -> Booking:
        booking = self.bookings.get_by_code(booking_code)
        if not booking:
            raise NotFoundError("Booking not found")
        booking = self.accept_booking(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def reject_booking(self, booking: Booking, reason: str) -> Booking:
        if booking.status in {BookingStatus.rejected, BookingStatus.cancelled}:
            return booking
        if booking.status not in {BookingStatus.pending, BookingStatus.confirmed}:
            raise ValidationError("Only pending or confirmed bookings can be rejected")
        booking.ride.available_seats += booking.seats_booked
        cap_available_seats(booking.ride)
        booking.status = BookingStatus.rejected
        booking.cancellation_reason = reason
        notify_booking_rejected_by_driver(self.db, booking, reason)
        return booking

    def reject_booking_for_driver(
        self, booking_id: int, driver: User, reason: str
    ) -> Booking:
        booking = self.bookings.get_for_driver(booking_id, driver.id)
        if not booking:
            raise NotFoundError("Booking not found")
        booking = self.reject_booking(booking, reason)
        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return booking

    def reject_booking_by_code(self, booking_code: str, reason: str) -> Booking:
        booking = self.bookings.get_by_code(booking_code)
        if not booking:
            raise NotFoundError("Booking not found")
        booking = self.reject_booking(booking, reason)
        self.db.commit()
        self.db.refresh(booking)
        cache.bump_rides_version()
        return booking

    def active_bookings(self, driver: User) -> list[Booking]:
        return self.bookings.list_active_for_driver(driver.id)
