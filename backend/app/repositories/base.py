"""Generic repository base.

Repositories isolate data-access (SQLAlchemy) from services, so business logic
depends on a small, intention-revealing interface rather than ORM query details
(Dependency Inversion + Single Responsibility). New entities get a repository by
subclassing this and setting ``model``.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, entity_id: int) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def add(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        self.db.flush()
        return entity
