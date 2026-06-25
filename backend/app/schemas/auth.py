import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import UserRole
from app.schemas.vehicle import VehicleCreate

# Indian mobile: optional +91 / 91 / 0 prefix, then 10 digits starting 6-9.
_INDIAN_MOBILE_RE = re.compile(r"^(?:\+91|91|0)?([6-9]\d{9})$")


def validate_indian_mobile(value: str, *, field: str = "Mobile number") -> str:
    """Normalize to a bare 10-digit Indian mobile, raising on invalid input."""
    cleaned = "".join(ch for ch in value.strip() if ch.isdigit() or ch == "+")
    if not cleaned:
        raise ValueError(f"{field} is required")
    match = _INDIAN_MOBILE_RE.match(cleaned)
    if not match:
        raise ValueError(f"{field} must be a valid 10-digit Indian mobile number")
    return match.group(1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    full_name: str
    gender: str
    mobile_number: str
    email: EmailStr
    username: str
    password: str = Field(min_length=8)
    whatsapp_number: str | None = None
    role: UserRole = UserRole.passenger
    vehicle: VehicleCreate | None = None

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

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        value = value.strip().lower()
        if len(value) < 3:
            raise ValueError("Username must be at least 3 characters")
        return value

    @field_validator("gender")
    @classmethod
    def normalize_gender(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Gender is required")
        return value

    @field_validator("mobile_number")
    @classmethod
    def normalize_mobile_number(cls, value: str) -> str:
        return validate_indian_mobile(value)

    @field_validator("whatsapp_number")
    @classmethod
    def normalize_whatsapp_number(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return validate_indian_mobile(value, field="WhatsApp number")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_login_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class PasswordLoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def normalize_login_username(cls, value: str) -> str:
        value = value.strip().lower()
        if not value:
            raise ValueError("Username is required")
        return value


class SendOtpRequest(BaseModel):
    mobile_number: str

    @field_validator("mobile_number")
    @classmethod
    def normalize_mobile_number(cls, value: str) -> str:
        return validate_indian_mobile(value)


class VerifyOtpRequest(SendOtpRequest):
    otp: str = Field(min_length=4, max_length=8)

    @field_validator("otp")
    @classmethod
    def normalize_otp(cls, value: str) -> str:
        value = "".join(ch for ch in value.strip() if ch.isdigit())
        if not value:
            raise ValueError("OTP is required")
        return value
