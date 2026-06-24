from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models import BookingStatus
from app.schemas.payment import PaymentInitOut


class PassengerInput(BaseModel):
    full_name: str = Field(min_length=1)
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = None
    phone: str | None = None
    # When true, also store this person in the booker's account for reuse.
    save: bool = False

    @field_validator("full_name")
    @classmethod
    def require_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Passenger name is required")
        return value


class PassengerOut(BaseModel):
    full_name: str
    age: int | None = None
    gender: str | None = None
    phone: str | None = None

    model_config = {"from_attributes": True}


class BookingCreate(BaseModel):
    seats_booked: int = Field(ge=1, le=8)
    pickup_point: str = Field(min_length=1)
    drop_point: str = Field(min_length=1)
    payment_method: Literal["cash", "online"] = "cash"
    # One entry per seat. May be empty for a single-seat self booking.
    passengers: list[PassengerInput] = Field(default_factory=list)

    @field_validator("pickup_point", "drop_point")
    @classmethod
    def require_selected_point(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Please select pickup and drop points")
        return value


class BookingOut(BaseModel):
    id: int
    booking_code: str
    ride_id: int
    passenger_id: int
    driver_id: int
    driver_name: str
    driver_whatsapp: str | None = None
    car_number: str | None = None
    car_color: str | None = None
    route: str
    journey_date: date
    departure_time: time
    seats_booked: int
    pickup_point: str
    drop_point: str
    status: BookingStatus
    total_amount: int
    payment_method: str
    payment_status: str
    passengers: list[PassengerOut] = []
    review_rating: int | None = None
    review_comment: str | None = None
    reviewed_at: datetime | None = None

    model_config = {"from_attributes": True}


class DriverBookingOut(BookingOut):
    passenger_name: str
    passenger_whatsapp: str | None = None


class BookingActionOut(BaseModel):
    """Result of booking. ``payment`` is present only for online bookings."""

    booking: BookingOut
    payment: PaymentInitOut | None = None


class CancellationRequest(BaseModel):
    reason: str
