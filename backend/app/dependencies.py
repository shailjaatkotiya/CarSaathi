from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models import AdminUser, User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    subject = decode_token(token)
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, int(subject))
    if not user or not user.is_active or user.is_blocked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or blocked user")
    return user


def require_admin(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    admin_user = db.query(AdminUser).filter(AdminUser.user_id == user.id).first()
    if not admin_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def require_driver(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.driver:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Login as driver to publish or manage rides")
    return user


def require_passenger(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.passenger:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Log in as passenger to book a ride")
    return user
