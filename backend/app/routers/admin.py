from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database import get_db
from app.dependencies import require_admin
from app.models import User
from app.schemas import AdminDecision, LoginRequest, TokenResponse, UserOut
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = AuthService(db).authenticate_admin(payload)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/users", response_model=list[UserOut])
def users(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    return AdminService(db).list_users()


@router.post("/users/{user_id}/verify", response_model=UserOut)
def verify_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    return AdminService(db).verify_user(user_id, admin.id)


@router.post("/users/{user_id}/reject", response_model=UserOut)
def reject_user(user_id: int, payload: AdminDecision, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    return AdminService(db).reject_user(user_id, admin.id, payload.reason)


@router.post("/users/{user_id}/block", response_model=UserOut)
def block_user(user_id: int, _: AdminDecision, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> User:
    return AdminService(db).block_user(user_id, admin.id)


@router.get("/rides")
def rides(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return AdminService(db).list_rides()


@router.get("/bookings")
def bookings(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return AdminService(db).list_bookings()


@router.get("/reports")
def reports(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return AdminService(db).list_reports()
