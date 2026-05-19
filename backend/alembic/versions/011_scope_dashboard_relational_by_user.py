"""Scope dashboard relational tables by user_id

Revision ID: 011_scope_dashboard_user
Revises: 010_prayer_completed_at
Create Date: 2026-05-18
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "011_scope_dashboard_user"
down_revision: Union[str, None] = "010_prayer_completed_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    def _add_user_id(table: str) -> None:
        columns = [c["name"] for c in inspector.get_columns(table)]
        
        with op.batch_alter_table(table) as batch_op:
            if "user_id" not in columns:
                batch_op.add_column(sa.Column("user_id", sa.String(length=128), nullable=True))
            
            fks = inspector.get_foreign_keys(table)
            fk_names = [fk["name"] for fk in fks if fk.get("name")]
            expected_fk = f"fk_{table}_user_id"
            if expected_fk not in fk_names:
                batch_op.create_foreign_key(
                    expected_fk,
                    "users",
                    ["user_id"],
                    ["id"],
                    ondelete="CASCADE",
                )
            
            indexes = [idx["name"] for idx in inspector.get_indexes(table)]
            expected_idx = f"ix_{table}_user_id"
            if expected_idx not in indexes:
                batch_op.create_index(expected_idx, ["user_id"], unique=False)

    for table in (
        "habits",
        "habit_logs",
        "projects",
        "quick_tasks",
        "prayer_logs",
        "top3_items",
        "daily_completion_log",
        "life_goal_tiers",
    ):
        _add_user_id(table)

    habit_logs_indexes = [idx["name"] for idx in inspector.get_indexes("habit_logs")]
    if "idx_habit_logs_user_date" not in habit_logs_indexes:
        with op.batch_alter_table("habit_logs") as batch_op:
            batch_op.create_index("idx_habit_logs_user_date", ["user_id", "date"], unique=False)

    prayer_logs_indexes = [idx["name"] for idx in inspector.get_indexes("prayer_logs")]
    if "idx_prayer_logs_user_date" not in prayer_logs_indexes:
        with op.batch_alter_table("prayer_logs") as batch_op:
            batch_op.create_index("idx_prayer_logs_user_date", ["user_id", "date"], unique=False)

    top3_indexes = [idx["name"] for idx in inspector.get_indexes("top3_items")]
    with op.batch_alter_table("top3_items") as batch_op:
        if "idx_top3_items_slot" in top3_indexes:
            batch_op.drop_index("idx_top3_items_slot")
        if "idx_top3_items_user_slot" not in top3_indexes:
            batch_op.create_index("idx_top3_items_user_slot", ["user_id", "slot"], unique=True)

    daily_indexes = [idx["name"] for idx in inspector.get_indexes("daily_completion_log")]
    with op.batch_alter_table("daily_completion_log") as batch_op:
        if "ix_daily_completion_log_date" in daily_indexes:
            batch_op.drop_index("ix_daily_completion_log_date")
        if "idx_daily_completion_user_date" not in daily_indexes:
            batch_op.create_index("idx_daily_completion_user_date", ["user_id", "date"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    daily_indexes = [idx["name"] for idx in inspector.get_indexes("daily_completion_log")]
    with op.batch_alter_table("daily_completion_log") as batch_op:
        if "idx_daily_completion_user_date" in daily_indexes:
            batch_op.drop_index("idx_daily_completion_user_date")
        if "ix_daily_completion_log_date" not in daily_indexes:
            batch_op.create_index("ix_daily_completion_log_date", ["date"], unique=True)

    top3_indexes = [idx["name"] for idx in inspector.get_indexes("top3_items")]
    with op.batch_alter_table("top3_items") as batch_op:
        if "idx_top3_items_user_slot" in top3_indexes:
            batch_op.drop_index("idx_top3_items_user_slot")
        if "idx_top3_items_slot" not in top3_indexes:
            batch_op.create_index("idx_top3_items_slot", ["slot"], unique=True)

    prayer_logs_indexes = [idx["name"] for idx in inspector.get_indexes("prayer_logs")]
    if "idx_prayer_logs_user_date" in prayer_logs_indexes:
        with op.batch_alter_table("prayer_logs") as batch_op:
            batch_op.drop_index("idx_prayer_logs_user_date")

    habit_logs_indexes = [idx["name"] for idx in inspector.get_indexes("habit_logs")]
    if "idx_habit_logs_user_date" in habit_logs_indexes:
        with op.batch_alter_table("habit_logs") as batch_op:
            batch_op.drop_index("idx_habit_logs_user_date")

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
        columns = [c["name"] for c in inspector.get_columns(table)]
        fks = inspector.get_foreign_keys(table)
        fk_names = [fk["name"] for fk in fks if fk.get("name")]
        indexes = [idx["name"] for idx in inspector.get_indexes(table)]
        
        with op.batch_alter_table(table) as batch_op:
            expected_idx = f"ix_{table}_user_id"
            if expected_idx in indexes:
                batch_op.drop_index(expected_idx)
                
            expected_fk = f"fk_{table}_user_id"
            if expected_fk in fk_names:
                batch_op.drop_constraint(expected_fk, type_="foreignkey")
                
            if "user_id" in columns:
                batch_op.drop_column("user_id")

