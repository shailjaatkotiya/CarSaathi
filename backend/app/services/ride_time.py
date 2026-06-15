"""Time helpers for rides, shared by search and booking."""

from __future__ import annotations

from datetime import datetime

from app.models import Ride


def ride_departure_has_passed(ride: Ride, now: datetime | None = None) -> bool:
    current = now or datetime.now()
    journey_at = datetime.combine(ride.journey_date, ride.departure_time)
    return journey_at <= current
