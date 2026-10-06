"""Remove redundant admin and cancellation-reason tables."""

from alembic import op
import sqlalchemy as sa


revision = "20261006_remove_redundant_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "admin_users" in tables and "users" in tables:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "role" not in user_columns:
            op.add_column(
                "users",
                sa.Column(
                    "role",
                    sa.String(length=20),
                    nullable=False,
                    server_default="passenger",
                ),
            )
        op.execute(
            sa.text(
                "UPDATE users SET role = 'admin' "
                "WHERE id IN (SELECT user_id FROM admin_users)"
            )
        )

    for table in ("cancellation_reasons", "admin_users"):
        if table in tables:
            op.drop_table(table)


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())

    if "admin_users" not in tables:
        op.create_table(
            "admin_users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False
            ),
            sa.Column("permissions", sa.Text(), nullable=False),
            sa.UniqueConstraint("user_id"),
        )
        op.execute(
            sa.text(
                "INSERT INTO admin_users (user_id, permissions) "
                "SELECT id, 'users,rides,bookings,verification,reports' "
                "FROM users WHERE role = 'admin'"
            )
        )

    if "cancellation_reasons" not in tables:
        op.create_table(
            "cancellation_reasons",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False
            ),
            sa.Column("ride_id", sa.Integer(), sa.ForeignKey("rides.id")),
            sa.Column("booking_id", sa.Integer(), sa.ForeignKey("bookings.id")),
            sa.Column("reason", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )