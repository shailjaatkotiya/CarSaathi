from datetime import date, time

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import BookingStatus, RideStatus, VerificationStatus


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    whatsapp_number: str | None = None

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name is required")
        return value

    @field_validator("email")
    @classmethod
    def normalize_register_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("whatsapp_number")
    @classmethod
    def normalize_whatsapp_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    age: int | None
    whatsapp_number: str | None
    personal_car_brand: str | None
    personal_car_model: str | None
    personal_car_number: str | None
    personal_car_fuel_type: str | None
    personal_car_category: str | None
    personal_car_seats: int | None
    verification_status: VerificationStatus
    is_blocked: bool
    rating_average: float
    rating_count: int

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    age: int | None = Field(default=None, ge=18, le=100)
    whatsapp_number: str | None = None
    personal_car_brand: str | None = None
    personal_car_model: str | None = None
    personal_car_number: str | None = None
    personal_car_fuel_type: str | None = None
    personal_car_category: str | None = None
    personal_car_seats: int | None = Field(default=None, ge=1, le=8)
    driving_license_number: str | None = None
    bio: str | None = None
    auto_confirm_bookings: bool | None = None
    preferred_pickup_point: str | None = None
    preferred_drop_point: str | None = None
    women_only_preference: bool | None = None


class AadhaarUploadRequest(BaseModel):
    aadhaar_number: str = Field(min_length=12, max_length=16)


class VerificationOut(BaseModel):
    status: VerificationStatus
    masked_aadhaar: str | None = None
    rejection_reason: str | None = None


class VehicleCreate(BaseModel):
    brand: str
    model: str
    vehicle_number: str
    fuel_type: str
    car_type: str = "Sedan"
    seats: int = Field(ge=1, le=8)
    photo_urls: list[str] = []


class VehicleOut(VehicleCreate):
    id: int
    is_verified: bool

    model_config = {"from_attributes": True}

    @field_validator("photo_urls", mode="before")
    @classmethod
    def split_photo_urls(cls, value: object) -> list[str]:
        if isinstance(value, str):
            return [url for url in value.split(",") if url]
        if isinstance(value, list):
            return value
        return []


class RideCreate(BaseModel):
    vehicle_id: int | None = None
    car_brand: str | None = None
    car_model: str | None = None
    vehicle_number: str | None = None
    fuel_type: str | None = None
    car_type: str | None = None
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


class BookingCreate(BaseModel):
    seats_booked: int = Field(ge=1, le=8)
    pickup_point: str
    drop_point: str


class BookingOut(BaseModel):
    id: int
    booking_code: str
    ride_id: int
    passenger_id: int
    seats_booked: int
    pickup_point: str
    drop_point: str
    status: BookingStatus
    total_amount: int

    model_config = {"from_attributes": True}


class CancellationRequest(BaseModel):
    reason: str


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class AdminDecision(BaseModel):
    reason: str | None = None


class ReportCreate(BaseModel):
    reported_user_id: int
    ride_id: int | None = None
    reason: str
