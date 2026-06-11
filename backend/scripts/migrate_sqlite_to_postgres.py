"""One-time migration from the legacy SQLite database to PostgreSQL.

Copies account data only. Ride and booking history is intentionally left
behind to clean out stale data:

    kept:    users, admin_users, driver_profiles, passenger_profiles,
             aadhaar_verifications, vehicles
    dropped: rides, ride_pickup_points, ride_drop_points, bookings,
             payments, reviews, notification_logs, reported_users,
             cancellation_reasons

The target schema is created from the current SQLAlchemy models. Only
columns that exist in both source and target are copied, so older SQLite
files with missing columns migrate fine. Re-running is safe: tables that
already contain rows in PostgreSQL are skipped.

Usage (from the backend directory):
    python scripts/migrate_sqlite_to_postgres.py \
        --sqlite ../path/to/ridesaathi.db \
        --postgres postgresql+psycopg2://postgres:postgres@localhost:5432/carthi
"""

import argparse
import sqlite3
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401  (imported for table registration)

# Order matters: every table must come after the tables it references.
TABLES_TO_MIGRATE = [
    "users",
    "admin_users",
    "driver_profiles",
    "passenger_profiles",
    "aadhaar_verifications",
    "vehicles",
]


def fetch_source_rows(sqlite_connection: sqlite3.Connection, table: str) -> tuple[list[str], list[tuple]]:
    cursor = sqlite_connection.execute(f"SELECT * FROM {table}")
    columns = [description[0] for description in cursor.description]
    return columns, cursor.fetchall()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite", required=True, help="Path to the source SQLite file")
    parser.add_argument("--postgres", required=True, help="SQLAlchemy URL of the target PostgreSQL database")
    args = parser.parse_args()

    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        raise SystemExit(f"SQLite file not found: {sqlite_path}")

    source = sqlite3.connect(sqlite_path)
    engine = create_engine(args.postgres)

    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    boolean_columns: dict[str, set[str]] = {}
    for table in TABLES_TO_MIGRATE:
        boolean_columns[table] = {
            column["name"] for column in inspector.get_columns(table) if str(column["type"]) == "BOOLEAN"
        }

    with engine.begin() as target:
        for table in TABLES_TO_MIGRATE:
            existing = target.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            if existing:
                print(f"{table}: skipped, target already has {existing} rows")
                continue

            source_columns, rows = fetch_source_rows(source, table)
            target_columns = {column["name"] for column in inspector.get_columns(table)}
            shared = [column for column in source_columns if column in target_columns]
            skipped = [column for column in source_columns if column not in target_columns]
            if skipped:
                print(f"{table}: ignoring source-only columns {skipped}")

            if not rows:
                print(f"{table}: no rows in source")
                continue

            insert_sql = text(
                f"INSERT INTO {table} ({', '.join(shared)}) VALUES ({', '.join(':' + c for c in shared)})"
            )
            for row in rows:
                record = dict(zip(source_columns, row))
                payload = {
                    column: bool(record[column])
                    if column in boolean_columns[table] and record[column] is not None
                    else record[column]
                    for column in shared
                }
                target.execute(insert_sql, payload)
            print(f"{table}: migrated {len(rows)} rows")

        # Explicit IDs bypass the sequences, so realign them.
        for table in TABLES_TO_MIGRATE:
            target.execute(
                text(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false)"
                )
            )
        print("Sequences realigned.")

    source.close()
    print("Migration complete. Ride and booking history was intentionally not migrated.")


if __name__ == "__main__":
    main()
