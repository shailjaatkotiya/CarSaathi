"""Tests for the booking domain: repository queries and service cancel rules.

Serves as the template for testing new service/repository code.
"""

from __future__ import annotations

import pytest

from app.core.exceptions import NotFoundError, ValidationError
from app.models import (
    Booking,
    BookingStatus,
    Ride,
    RideStatus,
    User,
    Vehicle,
)
from app.repositories.booking_repository import BookingRepository
from app.services.booking_service import BookingService


def _seed_ride_with_booking(db, *, status: BookingStatus, seats: int = 1):
    driver = User(full_name="Driver", email="d@example.com", password_hash="x")
    passenger = User(full_name="Rider", email="p@example.com", password_hash="x")
    db.add_all([driver, passenger])
    db.flush()

    vehicle = Vehicle(
        driver_id=driver.id,
        brand="Maruti",
        model="Dzire",
        vehicle_number="GJ01AB1234",
        fuel_type="Petrol",
        car_type="Sedan",
        color="White",
        seats=4,
        photo_urls="",
    )
    db.add(vehicle)
    db.flush()

    ride = Ride(
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        source_city="Rajkot",
        destination_city="Jamnagar",
        route_key="rajkot:jamnagar",
        distance_km=96,
        journey_date=__import__("datetime").date(2026, 7, 1),
        departure_time=__import__("datetime").time(7, 30),
        available_seats=2,
        total_seats=3,
        price_per_seat=180,
        status=RideStatus.active,
    )
    db.add(ride)
    db.flush()

    booking = Booking(
        booking_code="RS-TEST0001",
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=seats,
        pickup_point="Rajkot Bus Stand",
        drop_point="Jamnagar Bus Stand",
        status=status,
        total_amount=seats * 180,
        payment_method="cash",
    )
    db.add(booking)
    db.commit()
    return ride, passenger, booking


def test_repository_lists_only_active_bookings(db):
    ride, passenger, _ = _seed_ride_with_booking(db, status=BookingStatus.completed)
    repo = BookingRepository(db)
    assert repo.list_active_for_passenger(passenger.id) == []


def test_cancel_pending_restores_seats(db):
    ride, passenger, booking = _seed_ride_with_booking(
        db, status=BookingStatus.pending, seats=2
    )
    seats_before = ride.available_seats

    result = BookingService(db).cancel_for_passenger(
        booking.id, passenger.id, "changed plans"
    )

    assert result.status == BookingStatus.cancelled
    assert ride.available_seats == min(seats_before + 2, ride.total_seats)


def test_cancel_completed_booking_is_rejected(db):
    _, passenger, booking = _seed_ride_with_booking(db, status=BookingStatus.completed)
    with pytest.raises(ValidationError):
        BookingService(db).cancel_for_passenger(booking.id, passenger.id, "too late")


def test_cancel_unknown_booking_raises_not_found(db):
    _, passenger, _ = _seed_ride_with_booking(db, status=BookingStatus.pending)
    with pytest.raises(NotFoundError):
        BookingService(db).cancel_for_passenger(999, passenger.id, "no such booking")
