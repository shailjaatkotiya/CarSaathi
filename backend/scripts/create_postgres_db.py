"""Create the carthi database in PostgreSQL if it does not exist.

Usage:
    python scripts/create_postgres_db.py [--host localhost] [--port 5432]
        [--user postgres] [--password postgres] [--dbname carthi]
"""

import argparse

import psycopg2


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--user", default="postgres")
    parser.add_argument("--password", default="postgres")
    parser.add_argument("--dbname", default="carthi")
    args = parser.parse_args()

    connection = psycopg2.connect(
        host=args.host, port=args.port, user=args.user, password=args.password, dbname="postgres"
    )
    connection.autocommit = True
    cursor = connection.cursor()
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (args.dbname,))
    if cursor.fetchone():
        print(f"Database {args.dbname} already exists.")
    else:
        cursor.execute(f'CREATE DATABASE "{args.dbname}"')
        print(f"Database {args.dbname} created.")
    cursor.execute("SELECT version()")
    print(cursor.fetchone()[0])
    connection.close()


if __name__ == "__main__":
    main()
