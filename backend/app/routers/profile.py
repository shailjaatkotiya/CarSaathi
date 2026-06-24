from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import (
    AadhaarUploadRequest,
    DriverProfileOut,
    ProfileUpdate,
    UserOut,
    VerificationOut,
)
from app.services.profile_service import ProfileService
from app.services.review_service import ReviewService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserOut)
def profile_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/drivers/{driver_id}", response_model=DriverProfileOut)
def driver_profile(driver_id: int, db: Session = Depends(get_db)) -> DriverProfileOut:
    return ReviewService(db).driver_profile(driver_id)


@router.put("", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return ProfileService(db).update(user, payload)


@router.post("/aadhaar", response_model=VerificationOut)
def upload_aadhaar(
    payload: AadhaarUploadRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VerificationOut:
    return ProfileService(db).submit_aadhaar(user, payload)


@router.get("/verification-status", response_model=VerificationOut)
def verification_status(user: User = Depends(get_current_user)) -> VerificationOut:
    return ProfileService.verification_status(user)
