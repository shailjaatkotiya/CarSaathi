from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import aadhaar_token, encrypt_aadhaar, mask_aadhaar
from app.database import get_db
from app.dependencies import get_current_user
from app.models import AadhaarVerification, DriverProfile, PassengerProfile, User, VerificationStatus
from app.schemas import AadhaarUploadRequest, ProfileUpdate, UserOut, VerificationOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserOut)
def profile_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.put("", response_model=UserOut)
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] != user.email:
        existing = db.query(User).filter(User.email == updates["email"], User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        user.email = str(updates["email"])

    for field in [
        "full_name",
        "age",
        "mobile_number",
        "whatsapp_number",
        "emergency_contact",
        "personal_car_brand",
        "personal_car_model",
        "personal_car_number",
        "personal_car_fuel_type",
        "personal_car_category",
        "personal_car_seats",
    ]:
        if field in updates:
            setattr(user, field, updates[field])

    if user.driver_profile:
        for field in ["driving_license_number", "bio", "auto_confirm_bookings"]:
            if field in updates:
                setattr(user.driver_profile, field, updates[field])
    elif any(field in updates and updates[field] is not None for field in ["driving_license_number", "bio"]):
        db.add(DriverProfile(user_id=user.id, driving_license_number=updates.get("driving_license_number"), bio=updates.get("bio")))

    if user.passenger_profile:
        for field in ["preferred_pickup_point", "preferred_drop_point", "women_only_preference"]:
            if field in updates:
                setattr(user.passenger_profile, field, updates[field])
    elif any(field in updates and updates[field] is not None for field in ["preferred_pickup_point", "preferred_drop_point"]):
        db.add(PassengerProfile(user_id=user.id, preferred_pickup_point=updates.get("preferred_pickup_point"), preferred_drop_point=updates.get("preferred_drop_point")))

    db.commit()
    db.refresh(user)
    return user


@router.post("/aadhaar", response_model=VerificationOut)
def upload_aadhaar(payload: AadhaarUploadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> VerificationOut:
    masked = mask_aadhaar(payload.aadhaar_number)
    existing = user.aadhaar_verification
    if existing:
        existing.aadhaar_token = aadhaar_token(payload.aadhaar_number)
        existing.encrypted_aadhaar = encrypt_aadhaar(payload.aadhaar_number)
        existing.masked_aadhaar = masked
        existing.status = VerificationStatus.pending
        existing.rejection_reason = None
    else:
        db.add(
            AadhaarVerification(
                user_id=user.id,
                aadhaar_token=aadhaar_token(payload.aadhaar_number),
                encrypted_aadhaar=encrypt_aadhaar(payload.aadhaar_number),
                masked_aadhaar=masked,
            )
        )
    user.verification_status = VerificationStatus.pending
    db.commit()
    return VerificationOut(status=VerificationStatus.pending, masked_aadhaar=masked)


@router.get("/verification-status", response_model=VerificationOut)
def verification_status(user: User = Depends(get_current_user)) -> VerificationOut:
    aadhaar = user.aadhaar_verification
    return VerificationOut(
        status=user.verification_status,
        masked_aadhaar=aadhaar.masked_aadhaar if aadhaar else None,
        rejection_reason=aadhaar.rejection_reason if aadhaar else None,
    )
