from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import (
    PasswordLoginRequest,
    RegisterRequest,
    SendOtpRequest,
    TokenResponse,
    UserOut,
    VerifyOtpRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = AuthService(db).register(payload)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(
    payload: PasswordLoginRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    user = AuthService(db).authenticate(payload)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/refresh", response_model=TokenResponse)
def refresh(user: User = Depends(get_current_user)) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/logout")
def logout() -> dict:
    return {"message": "Client should delete the access token"}


@router.post("/send-otp")
def send_otp(payload: SendOtpRequest, db: Session = Depends(get_db)) -> dict:
    AuthService(db).send_login_otp(payload.mobile_number)
    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(
    payload: VerifyOtpRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    user = AuthService(db).authenticate_with_otp(payload.mobile_number, payload.otp)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
