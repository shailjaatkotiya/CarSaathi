"""Authentication and registration logic."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from secrets import randbelow

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AuthError, ConflictError
from app.core.security import hash_password, verify_password
from app.models import (
    DriverProfile,
    NotificationLog,
    NotificationStatus,
    PassengerProfile,
    SavedPassenger,
    User,
    UserRole,
    Vehicle,
)
from app.repositories.user_repository import UserRepository
from app.schemas import LoginRequest, PasswordLoginRequest, RegisterRequest
from app.services.twilio_client import send_login_otp_via_twilio


OTP_TTL_MINUTES = 5
_otp_store: dict[str, tuple[str, datetime]] = {}


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        if self.users.get_by_email(payload.email):
            raise ConflictError("Email already registered")
        if self.users.get_by_username(payload.username):
            raise ConflictError("Username already registered")
        if self.users.get_by_mobile_number(payload.mobile_number):
            raise ConflictError("Mobile number already registered")
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            username=payload.username,
            password_hash=hash_password(payload.password),
            gender=payload.gender,
            mobile_number=payload.mobile_number,
            whatsapp_number=payload.whatsapp_number or payload.mobile_number,
            role=payload.role,
        )
        self.db.add(user)
        self.db.flush()
        if payload.role == UserRole.driver:
            self.db.add(DriverProfile(user_id=user.id))
            if payload.vehicle:
                self.db.add(
                    Vehicle(
                        driver_id=user.id,
                        brand=payload.vehicle.brand,
                        model=payload.vehicle.model,
                        vehicle_number=payload.vehicle.vehicle_number.upper(),
                        fuel_type=payload.vehicle.fuel_type,
                        car_type=payload.vehicle.car_type,
                        color=payload.vehicle.color,
                        seats=payload.vehicle.seats,
                        photo_urls=",".join(payload.vehicle.photo_urls),
                    )
                )
        if payload.role == UserRole.passenger:
            self.db.add(PassengerProfile(user_id=user.id))
            self.db.add(
                SavedPassenger(
                    user_id=user.id,
                    full_name=user.full_name,
                    age=None,
                    gender=user.gender,
                    phone=user.mobile_number,
                )
            )
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, payload: PasswordLoginRequest) -> User:
        user = self.users.get_by_username(payload.username)
        if not user and "@" in payload.username:
            user = self.users.get_by_email(payload.username)
        if not user:
            user = self.users.get_by_mobile_number(payload.username)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Invalid username or password")
        return user

    def send_login_otp(self, mobile_number: str) -> NotificationStatus:
        user = self.users.get_by_mobile_number(mobile_number)
        if not user:
            raise AuthError("No account found for this mobile number")
        otp = f"{randbelow(1_000_000):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
        settings = get_settings()
        status = (
            send_login_otp_via_twilio(mobile_number, otp, OTP_TTL_MINUTES)
            if settings.whatsapp_provider == "twilio"
            else NotificationStatus.mocked
        )
        log = NotificationLog(
            user_id=user.id,
            booking_id=None,
            template_name="login_otp",
            recipient=mobile_number,
            payload=json.dumps(
                {
                    "purpose": "login",
                    "expires_minutes": OTP_TTL_MINUTES,
                    "provider": settings.whatsapp_provider,
                }
            ),
            status=status,
        )
        self.db.add(log)
        self.db.commit()
        if status == NotificationStatus.failed:
            raise AuthError("Unable to send OTP. Please try again.")
        _otp_store[mobile_number] = (otp, expires_at)
        return status

    def authenticate_with_otp(self, mobile_number: str, otp: str) -> User:
        user = self.users.get_by_mobile_number(mobile_number)
        if not user:
            raise AuthError("No account found for this mobile number")
        expected = _otp_store.get(mobile_number)
        if not expected:
            raise AuthError("OTP expired or not requested")
        expected_otp, expires_at = expected
        if datetime.now(timezone.utc) > expires_at:
            _otp_store.pop(mobile_number, None)
            raise AuthError("OTP expired or not requested")
        if otp != expected_otp:
            raise AuthError("Invalid OTP")
        _otp_store.pop(mobile_number, None)
        return user

    def authenticate_admin(self, payload: LoginRequest) -> User:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Invalid admin credentials")
        if not self.users.is_admin(user.id):
            raise AuthError("Invalid admin credentials")
        return user
