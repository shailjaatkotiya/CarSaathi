from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models import BookingStatus
from app.schemas.payment import PaymentInitOut


class BookingCreate(BaseModel):
    seats_booked: int = Field(ge=1, le=8)
    pickup_point: str = Field(min_length=1)
    drop_point: str = Field(min_length=1)
    payment_method: Literal["cash", "online"] = "cash"

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
