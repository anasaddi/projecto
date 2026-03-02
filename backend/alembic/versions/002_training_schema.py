"""Training schema: exercises, workout_day_templates, workout_day_exercises, workout_logs, set_logs, daily_readiness

Revision ID: 002
Revises: 001
Create Date: 2025-02-24

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exercises",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("primary_muscles", sa.JSON(), nullable=True),
        sa.Column("secondary_muscles", sa.JSON(), nullable=True),
        sa.Column("cns_fatigue", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("joint_stress", sa.JSON(), nullable=True),
    )
    op.create_index("ix_exercises_id", "exercises", ["id"])

    op.create_table(
        "workout_day_templates",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("day_name", sa.String(256), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=True),
    )
    op.create_index("ix_workout_day_templates_id", "workout_day_templates", ["id"])
    op.create_index("ix_workout_day_templates_weekday", "workout_day_templates", ["weekday"])

    op.create_table(
        "workout_day_exercises",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_id", sa.String(64), sa.ForeignKey("workout_day_templates.id"), nullable=False),
        sa.Column("exercise_id", sa.String(32), sa.ForeignKey("exercises.id"), nullable=False),
        sa.Column("base_sets", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("base_reps", sa.Integer(), nullable=True),
        sa.Column("instruction", sa.String(512), nullable=True),
        sa.Column("ordinal", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_workout_day_exercises_id", "workout_day_exercises", ["id"])
    op.create_index("ix_workout_day_exercises_template_id", "workout_day_exercises", ["template_id"])
    op.create_index("ix_workout_day_exercises_exercise_id", "workout_day_exercises", ["exercise_id"])

    op.create_table(
        "workout_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_id", sa.String(64), sa.ForeignKey("workout_day_templates.id"), nullable=True),
        sa.Column("logged_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_workout_logs_id", "workout_logs", ["id"])
    op.create_index("ix_workout_logs_template_id", "workout_logs", ["template_id"])

    op.create_table(
        "set_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("workout_log_id", sa.Integer(), sa.ForeignKey("workout_logs.id"), nullable=False),
        sa.Column("exercise_id", sa.String(32), sa.ForeignKey("exercises.id"), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("completed", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_index("ix_set_logs_id", "set_logs", ["id"])
    op.create_index("ix_set_logs_workout_log_id", "set_logs", ["workout_log_id"])
    op.create_index("ix_set_logs_exercise_id", "set_logs", ["exercise_id"])

    op.create_table(
        "daily_readiness",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("cns_fatigue", sa.Float(), nullable=True),
        sa.Column("muscle_doms", sa.JSON(), nullable=True),
        sa.Column("joint_pain", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_daily_readiness_id", "daily_readiness", ["id"])
    op.create_index("ix_daily_readiness_date", "daily_readiness", ["date"])


def downgrade() -> None:
    op.drop_table("daily_readiness")
    op.drop_table("set_logs")
    op.drop_table("workout_logs")
    op.drop_table("workout_day_exercises")
    op.drop_table("workout_day_templates")
    op.drop_table("exercises")
