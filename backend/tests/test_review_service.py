from __future__ import annotations

import pytest

from app.core.exceptions import ConflictError, ValidationError
from app.models import Booking, BookingStatus, Ride, RideStatus, User, UserRole, Vehicle
from app.schemas import ReviewCreate
from app.services.review_service import ReviewService


def _seed_booking(db, *, status: BookingStatus):
    driver = User(
        full_name="Driver",
        email="driver@example.com",
        password_hash="x",
        role=UserRole.driver,
    )
    passenger = User(
        full_name="Passenger",
        email="passenger@example.com",
        password_hash="x",
        role=UserRole.passenger,
    )
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
        status=RideStatus.completed,
    )
    db.add(ride)
    db.flush()

    booking = Booking(
        booking_code="RS-REVIEW1",
        ride_id=ride.id,
        passenger_id=passenger.id,
        seats_booked=1,
        pickup_point="Rajkot Bus Stand",
        drop_point="Jamnagar Bus Stand",
        status=status,
        total_amount=180,
        payment_method="cash",
    )
    db.add(booking)
    db.commit()
    return driver, passenger, booking


def test_review_completed_booking_updates_driver_rating(db):
    driver, passenger, booking = _seed_booking(db, status=BookingStatus.completed)

    review = ReviewService(db).create_for_booking(
        booking.id, passenger, ReviewCreate(rating=4, comment="Good ride")
    )

    assert review.rating == 4
    assert review.comment == "Good ride"
    assert driver.rating_average == 4
    assert driver.rating_count == 1


def test_review_pending_booking_is_rejected(db):
    _, passenger, booking = _seed_booking(db, status=BookingStatus.pending)

    with pytest.raises(ValidationError):
        ReviewService(db).create_for_booking(
            booking.id, passenger, ReviewCreate(rating=5)
        )


def test_review_booking_only_once(db):
    _, passenger, booking = _seed_booking(db, status=BookingStatus.completed)
    service = ReviewService(db)

    service.create_for_booking(booking.id, passenger, ReviewCreate(rating=5))

    with pytest.raises(ConflictError):
        service.create_for_booking(booking.id, passenger, ReviewCreate(rating=4))
