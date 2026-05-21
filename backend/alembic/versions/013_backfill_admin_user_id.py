"""Backfill legacy NULL user_id to admin and unique dashboard_states (user_id, key)

Revision ID: 013_admin_backfill
Revises: 012_seed_admin_user
Create Date: 2026-05-21
"""

from typing import Sequence, Union
from alembic import op
from sqlalchemy import inspect, text


revision: str = "013_admin_backfill"
down_revision: Union[str, None] = "012_seed_admin_user"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ADMIN_ID = "admin"
DASHBOARD_KEY = "default"

TABLES_WITH_USER_ID = (
    "habits",
    "habit_logs",
    "projects",
    "quick_tasks",
    "prayer_logs",
    "top3_items",
    "daily_completion_log",
    "life_goal_tiers",
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "users" in inspector.get_table_names():
        res = bind.execute(text("SELECT id FROM users WHERE id = :id"), {"id": ADMIN_ID}).fetchone()
        if not res:
            op.execute(
                "INSERT INTO users (id, email, auth_provider, created_at) "
                "VALUES ('admin', 'admin@projecto.local', 'local', CURRENT_TIMESTAMP)"
            )

    if "dashboard_states" in inspector.get_table_names():
        bind.execute(
            text("UPDATE dashboard_states SET user_id = :uid WHERE user_id IS NULL"),
            {"uid": ADMIN_ID},
        )
        bind.execute(
            text(
                """
                DELETE FROM dashboard_states
                WHERE id NOT IN (
                    SELECT MAX(id) FROM dashboard_states
                    GROUP BY COALESCE(user_id, :uid), key
                )
                """
            ),
            {"uid": ADMIN_ID},
        )

        indexes = [idx["name"] for idx in inspector.get_indexes("dashboard_states")]
        if "uq_dashboard_states_user_key" not in indexes:
            with op.batch_alter_table("dashboard_states") as batch_op:
                batch_op.create_index(
                    "uq_dashboard_states_user_key",
                    ["user_id", "key"],
                    unique=True,
                )

    for table in TABLES_WITH_USER_ID:
        if table in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns(table)]
            if "user_id" in columns:
                bind.execute(
                    text(f"UPDATE {table} SET user_id = :uid WHERE user_id IS NULL"),
                    {"uid": ADMIN_ID},
                )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "dashboard_states" in inspector.get_table_names():
        indexes = [idx["name"] for idx in inspector.get_indexes("dashboard_states")]
        if "uq_dashboard_states_user_key" in indexes:
            with op.batch_alter_table("dashboard_states") as batch_op:
                batch_op.drop_index("uq_dashboard_states_user_key")
