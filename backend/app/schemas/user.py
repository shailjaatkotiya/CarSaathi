from pydantic import BaseModel, EmailStr, Field

from app.models import UserRole, VerificationStatus


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    whatsapp_number: str | None
    personal_car_brand: str | None
    personal_car_model: str | None
    personal_car_number: str | None
    personal_car_fuel_type: str | None
    personal_car_category: str | None
    personal_car_color: str | None
    personal_car_seats: int | None
    verification_status: VerificationStatus
    is_blocked: bool
    rating_average: float
    rating_count: int

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    whatsapp_number: str | None = None
    personal_car_brand: str | None = None
    personal_car_model: str | None = None
    personal_car_number: str | None = None
    personal_car_fuel_type: str | None = None
    personal_car_category: str | None = None
    personal_car_color: str | None = None
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
