"""Authentication and registration logic."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import AuthError, ConflictError, PermissionError
from app.core.security import hash_password, verify_password
from app.models import DriverProfile, PassengerProfile, User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas import LoginRequest, RegisterRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> User:
        if self.users.get_by_email(payload.email):
            raise ConflictError("Email already registered")
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            whatsapp_number=payload.whatsapp_number,
            role=payload.role,
        )
        self.db.add(user)
        self.db.flush()
        if payload.role == UserRole.driver:
            self.db.add(DriverProfile(user_id=user.id))
        if payload.role == UserRole.passenger:
            self.db.add(PassengerProfile(user_id=user.id))
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, payload: LoginRequest) -> User:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Invalid email or password")
        if payload.role and user.role != payload.role:
            raise PermissionError(f"Please login with a {payload.role.value} account")
        return user

    def authenticate_admin(self, payload: LoginRequest) -> User:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Invalid admin credentials")
        if not self.users.is_admin(user.id):
            raise AuthError("Invalid admin credentials")
        return user
