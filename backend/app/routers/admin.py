from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.dependencies import require_admin
from app.models import AdminUser, AadhaarVerification, Booking, ReportedUser, Ride, User, VerificationStatus
from app.schemas import AdminDecision, LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    admin_user = db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
    if not admin_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/users", response_model=list[UserOut])
def users(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users/{user_id}/verify", response_model=UserOut)
def verify_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.verification_status = VerificationStatus.verified
    aadhaar = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user.id).first()
    if aadhaar:
        aadhaar.status = VerificationStatus.verified
        aadhaar.reviewed_at = datetime.utcnow()
        aadhaar.reviewed_by_admin_id = admin.id
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reject", response_model=UserOut)
def reject_user(user_id: int, payload: AdminDecision, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.verification_status = VerificationStatus.rejected
    aadhaar = db.query(AadhaarVerification).filter(AadhaarVerification.user_id == user.id).first()
    if aadhaar:
        aadhaar.status = VerificationStatus.rejected
        aadhaar.reviewed_at = datetime.utcnow()
        aadhaar.reviewed_by_admin_id = admin.id
        aadhaar.rejection_reason = payload.reason
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/block", response_model=UserOut)
def block_user(user_id: int, _: AdminDecision, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin cannot block self")
    user.is_blocked = True
    db.commit()
    db.refresh(user)
    return user


@router.get("/rides")
def rides(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return [
        {
            "id": ride.id,
            "route": f"{ride.source_city} to {ride.destination_city}",
            "date": ride.journey_date.isoformat(),
            "driver": ride.driver.full_name,
            "available_seats": ride.available_seats,
            "status": ride.status,
        }
        for ride in db.query(Ride).order_by(Ride.created_at.desc()).all()
    ]


@router.get("/bookings")
def bookings(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return [
        {
            "id": booking.id,
            "booking_code": booking.booking_code,
            "route": f"{booking.ride.source_city} to {booking.ride.destination_city}",
            "passenger": booking.passenger.full_name,
            "seats": booking.seats_booked,
            "status": booking.status,
        }
        for booking in db.query(Booking).order_by(Booking.created_at.desc()).all()
    ]


@router.get("/reports")
def reports(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return [
        {
            "id": report.id,
            "reporter_id": report.reporter_id,
            "reported_user_id": report.reported_user_id,
            "reason": report.reason,
            "status": report.status,
        }
        for report in db.query(ReportedUser).order_by(ReportedUser.created_at.desc()).all()
    ]
