"""Scope dashboard relational tables by user_id

Revision ID: 011_scope_dashboard_relational_by_user
Revises: 010_prayer_completed_at
Create Date: 2026-05-18
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "011_scope_dashboard_relational_by_user"
down_revision: Union[str, None] = "010_prayer_completed_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_user_id(table: str) -> None:
    op.add_column(table, sa.Column("user_id", sa.String(length=128), nullable=True))
    op.create_foreign_key(
        f"fk_{table}_user_id",
        table,
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(f"ix_{table}_user_id", table, ["user_id"], unique=False)


def upgrade() -> None:
    _add_user_id("habits")
    _add_user_id("habit_logs")
    _add_user_id("projects")
    _add_user_id("quick_tasks")
    _add_user_id("prayer_logs")
    _add_user_id("top3_items")
    _add_user_id("daily_completion_log")
    _add_user_id("life_goal_tiers")

    op.create_index("idx_habit_logs_user_date", "habit_logs", ["user_id", "date"], unique=False)
    op.create_index("idx_prayer_logs_user_date", "prayer_logs", ["user_id", "date"], unique=False)

    op.drop_index("idx_top3_items_slot", table_name="top3_items")
    op.create_index("idx_top3_items_user_slot", "top3_items", ["user_id", "slot"], unique=True)

    op.drop_index(op.f("ix_daily_completion_log_date"), table_name="daily_completion_log")
    op.create_index("idx_daily_completion_user_date", "daily_completion_log", ["user_id", "date"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_daily_completion_user_date", table_name="daily_completion_log")
    op.create_index(op.f("ix_daily_completion_log_date"), "daily_completion_log", ["date"], unique=True)

    op.drop_index("idx_top3_items_user_slot", table_name="top3_items")
    op.create_index("idx_top3_items_slot", "top3_items", ["slot"], unique=True)

    op.drop_index("idx_prayer_logs_user_date", table_name="prayer_logs")
    op.drop_index("idx_habit_logs_user_date", table_name="habit_logs")

    for table in (
        "life_goal_tiers",
        "daily_completion_log",
        "top3_items",
        "prayer_logs",
        "quick_tasks",
        "projects",
        "habit_logs",
        "habits",
    ):
        op.drop_index(f"ix_{table}_user_id", table_name=table)
        op.drop_constraint(f"fk_{table}_user_id", table, type_="foreignkey")
        op.drop_column(table, "user_id")
