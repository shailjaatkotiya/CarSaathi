"""Seat-capacity helpers shared by ride publishing and booking."""

from __future__ import annotations

from app.models import Ride


def default_available_seats(car_type: str | None) -> int:
    normalized = (car_type or "").strip().lower()
    return 6 if "7" in normalized else 3


def cap_available_seats(ride: Ride) -> None:
    ride.available_seats = min(ride.available_seats, ride.total_seats)
