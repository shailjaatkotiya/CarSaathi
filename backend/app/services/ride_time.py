"""Time helpers for rides, shared by search and booking."""

from __future__ import annotations

from datetime import datetime, timedelta

from app.models import BookingStatus, Ride, RideStatus

# No ride end time is stored, so a ride is treated as "on going" for this long
# after departure, then considered completed. Mirrors RIDE_DURATION_MS on the
# frontend.
RIDE_DURATION_HOURS = 6


def ride_departure_has_passed(ride: Ride, now: datetime | None = None) -> bool:
    current = now or datetime.now()
    journey_at = datetime.combine(ride.journey_date, ride.departure_time)
    return journey_at <= current


def ride_has_ended(ride: Ride, now: datetime | None = None) -> bool:
    """True once the ride is considered finished (RIDE_DURATION_HOURS after
    departure), i.e. past the 'on going' window."""
    current = now or datetime.now()
    journey_at = datetime.combine(ride.journey_date, ride.departure_time)
    return journey_at + timedelta(hours=RIDE_DURATION_HOURS) <= current


def auto_complete_if_passed(ride: Ride, now: datetime | None = None) -> bool:
    """Flip an active ride (and its open bookings) to completed once the ride
    has ended (RIDE_DURATION_HOURS after departure). Cancelled rides are left
    untouched.

    Returns True when something changed so the caller can commit + bump cache.
    """
    if ride.status == RideStatus.active and ride_has_ended(ride, now):
        ride.status = RideStatus.completed
        for booking in ride.bookings:
            # Any still-open booking (awaiting approval or confirmed) is treated
            # as completed once the ride has ended.
            if booking.status in {BookingStatus.pending, BookingStatus.confirmed}:
                booking.status = BookingStatus.completed
        return True
    return False
