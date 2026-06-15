from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import AdminUser, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def email_taken_by_other(self, email: str, user_id: int) -> bool:
        return (
            self.db.query(User).filter(User.email == email, User.id != user_id).first() is not None
        )

    def is_admin(self, user_id: int) -> bool:
        return self.db.query(AdminUser).filter(AdminUser.user_id == user_id).first() is not None

    def list_newest_first(self) -> list[User]:
        return self.db.query(User).order_by(User.created_at.desc()).all()
