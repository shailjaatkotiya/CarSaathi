"""Profile, personal-car, and Aadhaar verification logic."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ValidationError
from app.core.security import aadhaar_token, encrypt_aadhaar, mask_aadhaar
from app.models import (
    AadhaarVerification,
    DriverProfile,
    PassengerProfile,
    User,
    VerificationStatus,
)
from app.repositories.user_repository import UserRepository
from app.schemas import AadhaarUploadRequest, ProfileUpdate, VerificationOut

PERSONAL_CAR_FIELDS = [
    "personal_car_brand",
    "personal_car_model",
    "personal_car_fuel_type",
    "personal_car_category",
    "personal_car_color",
    "personal_car_seats",
]

USER_WRITABLE_FIELDS = [
    "full_name",
    "gender",
    "mobile_number",
    "whatsapp_number",
    "personal_car_brand",
    "personal_car_model",
    "personal_car_number",
    "personal_car_fuel_type",
    "personal_car_category",
    "personal_car_color",
    "personal_car_seats",
]

DRIVER_PROFILE_FIELDS = ["driving_license_number", "bio", "auto_confirm_bookings"]
PASSENGER_PROFILE_FIELDS = [
    "preferred_pickup_point",
    "preferred_drop_point",
    "women_only_preference",
]


class ProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def update(self, user: User, payload: ProfileUpdate) -> User:
        updates = payload.model_dump(exclude_unset=True)

        if "email" in updates and updates["email"] != user.email:
            if self.users.email_taken_by_other(str(updates["email"]), user.id):
                raise ConflictError("Email already registered")
            user.email = str(updates["email"])
        if "username" in updates and updates["username"] != user.username:
            if self.users.username_taken_by_other(str(updates["username"]), user.id):
                raise ConflictError("Username already registered")
            user.username = str(updates["username"])
        if (
            "mobile_number" in updates
            and updates["mobile_number"] != user.mobile_number
            and updates["mobile_number"] is not None
        ):
            if self.users.mobile_taken_by_other(str(updates["mobile_number"]), user.id):
                raise ConflictError("Mobile number already registered")

        merged_number = updates.get("personal_car_number", user.personal_car_number)
        has_car_detail = any(
            (updates[field] if field in updates else getattr(user, field))
            not in (None, "")
            for field in PERSONAL_CAR_FIELDS
        )
        if has_car_detail and not (merged_number and str(merged_number).strip()):
            raise ValidationError("Car number is required to add a car")

        for field in USER_WRITABLE_FIELDS:
            if field in updates:
                setattr(user, field, updates[field])

        # Default personal car colour to White once any car detail exists.
        if has_car_detail and not (
            user.personal_car_color and user.personal_car_color.strip()
        ):
            user.personal_car_color = "White"

        self._apply_driver_profile(user, updates)
        self._apply_passenger_profile(user, updates)

        self.db.commit()
        self.db.refresh(user)
        return user

    def _apply_driver_profile(self, user: User, updates: dict) -> None:
        if user.driver_profile:
            for field in DRIVER_PROFILE_FIELDS:
                if field in updates:
                    setattr(user.driver_profile, field, updates[field])
        elif any(
            updates.get(field) is not None
            for field in ["driving_license_number", "bio"]
        ):
            self.db.add(
                DriverProfile(
                    user_id=user.id,
                    driving_license_number=updates.get("driving_license_number"),
                    bio=updates.get("bio"),
                )
            )

    def _apply_passenger_profile(self, user: User, updates: dict) -> None:
        if user.passenger_profile:
            for field in PASSENGER_PROFILE_FIELDS:
                if field in updates:
                    setattr(user.passenger_profile, field, updates[field])
        elif any(
            updates.get(field) is not None
            for field in ["preferred_pickup_point", "preferred_drop_point"]
        ):
            self.db.add(
                PassengerProfile(
                    user_id=user.id,
                    preferred_pickup_point=updates.get("preferred_pickup_point"),
                    preferred_drop_point=updates.get("preferred_drop_point"),
                )
            )

    def submit_aadhaar(
        self, user: User, payload: AadhaarUploadRequest
    ) -> VerificationOut:
        masked = mask_aadhaar(payload.aadhaar_number)
        existing = user.aadhaar_verification
        if existing:
            existing.aadhaar_token = aadhaar_token(payload.aadhaar_number)
            existing.encrypted_aadhaar = encrypt_aadhaar(payload.aadhaar_number)
            existing.masked_aadhaar = masked
            existing.status = VerificationStatus.pending
            existing.rejection_reason = None
        else:
            self.db.add(
                AadhaarVerification(
                    user_id=user.id,
                    aadhaar_token=aadhaar_token(payload.aadhaar_number),
                    encrypted_aadhaar=encrypt_aadhaar(payload.aadhaar_number),
                    masked_aadhaar=masked,
                )
            )
        user.verification_status = VerificationStatus.pending
        self.db.commit()
        return VerificationOut(status=VerificationStatus.pending, masked_aadhaar=masked)

    @staticmethod
    def verification_status(user: User) -> VerificationOut:
        aadhaar = user.aadhaar_verification
        return VerificationOut(
            status=user.verification_status,
            masked_aadhaar=aadhaar.masked_aadhaar if aadhaar else None,
            rejection_reason=aadhaar.rejection_reason if aadhaar else None,
        )
