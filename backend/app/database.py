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
        "role": "VARCHAR(20) DEFAULT 'passenger'",
        "age": "INTEGER",
        "personal_car_brand": "VARCHAR(80)",
        "personal_car_model": "VARCHAR(80)",
        "personal_car_number": "VARCHAR(30)",
        "personal_car_fuel_type": "VARCHAR(30)",
        "personal_car_category": "VARCHAR(40)",
        "personal_car_seats": "INTEGER",
    }
    with engine.begin() as connection:
        existing_columns = {row[1] for row in connection.execute(text("PRAGMA table_info(users)"))}
        for column_name, column_type in user_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
        remove_booking_point_limit(connection)


def sqlite_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def booking_point_limit_exists(connection) -> bool:
    target_columns = ["ride_id", "passenger_id", "pickup_point", "drop_point"]
    if not list(connection.execute(text("PRAGMA table_info(bookings)"))):
        return False
    for index in connection.execute(text("PRAGMA index_list(bookings)")):
        index_name = index[1]
        is_unique = bool(index[2])
        if not is_unique:
            continue
        index_columns = [
            column[2]
            for column in connection.execute(text(f"PRAGMA index_info({sqlite_identifier(index_name)})"))
        ]
        if index_columns == target_columns:
            return True
    return False


def remove_booking_point_limit(connection) -> None:
    if not booking_point_limit_exists(connection):
        return

    connection.execute(text("PRAGMA foreign_keys=OFF"))
    connection.execute(
        text(
            """
            CREATE TABLE bookings_without_point_limit (
                id INTEGER NOT NULL,
                booking_code VARCHAR(40) NOT NULL,
                ride_id INTEGER NOT NULL,
                passenger_id INTEGER NOT NULL,
                seats_booked INTEGER NOT NULL,
                pickup_point VARCHAR(120) NOT NULL,
                drop_point VARCHAR(120) NOT NULL,
                status VARCHAR(9) NOT NULL,
                total_amount INTEGER NOT NULL,
                cancellation_reason TEXT,
                created_at DATETIME NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(ride_id) REFERENCES rides (id),
                FOREIGN KEY(passenger_id) REFERENCES users (id)
            )
            """
        )
    )
    connection.execute(
        text(
            """
            INSERT INTO bookings_without_point_limit (
                id,
                booking_code,
                ride_id,
                passenger_id,
                seats_booked,
                pickup_point,
                drop_point,
                status,
                total_amount,
                cancellation_reason,
                created_at
            )
            SELECT
                id,
                booking_code,
                ride_id,
                passenger_id,
                seats_booked,
                pickup_point,
                drop_point,
                status,
                total_amount,
                cancellation_reason,
                created_at
            FROM bookings
            """
        )
    )
    connection.execute(text("DROP TABLE bookings"))
    connection.execute(text("ALTER TABLE bookings_without_point_limit RENAME TO bookings"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_bookings_booking_code ON bookings (booking_code)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_ride_id ON bookings (ride_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_bookings_passenger_id ON bookings (passenger_id)"))
    connection.execute(text("PRAGMA foreign_keys=ON"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
