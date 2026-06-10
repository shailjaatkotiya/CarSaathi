from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.dependencies import get_current_user
from app.models import DriverProfile, PassengerProfile, User, UserRole
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        whatsapp_number=payload.whatsapp_number,
        role=payload.role,
    )
    db.add(user)
    db.flush()
    if payload.role == UserRole.driver:
        db.add(DriverProfile(user_id=user.id))
    if payload.role == UserRole.passenger:
        db.add(PassengerProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if payload.role and user.role != payload.role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Please login with a {payload.role.value} account")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/refresh", response_model=TokenResponse)
def refresh(user: User = Depends(get_current_user)) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/logout")
def logout() -> dict:
    return {"message": "Client should delete the access token"}


@router.post("/send-otp")
def send_otp() -> dict:
    return {"message": "OTP provider integration is mocked for MVP", "otp": "123456"}


@router.post("/verify-otp")
def verify_otp() -> dict:
    return {"message": "OTP verified in mock mode"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
