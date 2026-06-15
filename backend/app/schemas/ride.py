from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field

from app.models import RideStatus
from app.schemas.vehicle import VehicleOut


class RideCreate(BaseModel):
    vehicle_id: int | None = None
    car_brand: str | None = None
    car_model: str | None = None
    vehicle_number: str | None = None
    fuel_type: str | None = None
    car_type: str | None = None
    car_color: str | None = None
    car_seats: int | None = Field(default=None, ge=1, le=8)
    source_city: str
    destination_city: str
    distance_km: int
    journey_date: date
    departure_time: time
    available_seats: int = Field(ge=1, le=8)
    price_per_seat: int = Field(ge=1)
    pickup_points: list[str]
    drop_points: list[str]
    route_notes: str | None = None
    luggage_allowance: str | None = None
    smoking_allowed: bool = False
    ac_available: bool = True
    women_only_preference: bool = False
    auto_confirm_bookings: bool = False
    route_stops: list[str] = []
    ride_rules: list[str] = []
    driver_instructions: str | None = None


class RideOut(BaseModel):
    id: int
    source_city: str
    destination_city: str
    distance_km: int
    journey_date: date
    departure_time: time
    available_seats: int
    total_seats: int
    price_per_seat: int
    pickup_points: list[str]
    drop_points: list[str]
    route_notes: str | None
    luggage_allowance: str | None
    smoking_allowed: bool
    ac_available: bool
    women_only_preference: bool
    auto_confirm_bookings: bool
    status: RideStatus
    driver_name: str
    driver_rating: float
    driver_verified: bool
    vehicle: VehicleOut
    route_stops: list[str] = []
    ride_rules: list[str] = []
    driver_instructions: str | None = None


class FellowPassengerOut(BaseModel):
    name: str
    pickup_point: str
    drop_point: str
    seats_booked: int

    model_config = ConfigDict(from_attributes=True)
