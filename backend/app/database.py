from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine_kwargs = {}
if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, pool_pre_ping=True, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def ensure_runtime_schema() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    user_columns = {
        "age": "INTEGER",
        "personal_car_brand": "VARCHAR(80)",
        "personal_car_model": "VARCHAR(80)",
        "personal_car_number": "VARCHAR(30)",
        "personal_car_fuel_type": "VARCHAR(30)",
        "personal_car_category": "VARCHAR(40)",
        "personal_car_seats": "INTEGER",
    }
    # Columns removed from the User model; old DB files may still carry them
    # with NOT NULL constraints that break inserts.
    legacy_user_columns = {"role"}
    with engine.begin() as connection:
        existing_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(users)"))}
        for column_name, column_type in user_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
        for column_name in legacy_user_columns & existing_columns:
            connection.execute(text(f"ALTER TABLE users DROP COLUMN {column_name}"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
