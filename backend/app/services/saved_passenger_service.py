"""Passenger's saved co-travellers (account-level), reusable across bookings."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import SavedPassenger, User
from app.schemas import SavedPassengerCreate, SavedPassengerUpdate


class SavedPassengerService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(self, user: User) -> list[SavedPassenger]:
        return (
            self.db.query(SavedPassenger)
            .filter(SavedPassenger.user_id == user.id)
            .order_by(SavedPassenger.created_at.desc())
            .all()
        )

    def add(self, user: User, payload: SavedPassengerCreate) -> SavedPassenger:
        person = SavedPassenger(
            user_id=user.id,
            full_name=payload.full_name,
            age=payload.age,
            gender=payload.gender,
            phone=payload.phone,
        )
        self.db.add(person)
        self.db.commit()
        self.db.refresh(person)
        return person

    def update(
        self, user: User, passenger_id: int, payload: SavedPassengerUpdate
    ) -> SavedPassenger:
        person = (
            self.db.query(SavedPassenger)
            .filter(
                SavedPassenger.id == passenger_id,
                SavedPassenger.user_id == user.id,
            )
            .first()
        )
        if not person:
            raise NotFoundError("Saved passenger not found")
        person.full_name = payload.full_name
        person.age = payload.age
        person.gender = payload.gender
        person.phone = payload.phone
        self.db.commit()
        self.db.refresh(person)
        return person

    def delete(self, user: User, passenger_id: int) -> None:
        person = (
            self.db.query(SavedPassenger)
            .filter(
                SavedPassenger.id == passenger_id,
                SavedPassenger.user_id == user.id,
            )
            .first()
        )
        if not person:
            raise NotFoundError("Saved passenger not found")
        self.db.delete(person)
        self.db.commit()
