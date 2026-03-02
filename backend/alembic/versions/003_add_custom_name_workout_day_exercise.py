"""Add custom_name to workout_day_exercises

Revision ID: 003
Revises: 002
Create Date: 2025-02-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("workout_day_exercises", sa.Column("custom_name", sa.String(256), nullable=True))


def downgrade() -> None:
    op.drop_column("workout_day_exercises", "custom_name")
