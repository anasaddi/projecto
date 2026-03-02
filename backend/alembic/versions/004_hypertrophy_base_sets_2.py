"""Set base_sets=2 for HYPERTROPHY exercises

Revision ID: 004
Revises: 003
Create Date: 2025-02-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE workout_day_exercises
        SET base_sets = 2
        WHERE exercise_id IN (SELECT id FROM exercises WHERE category = 'HYPERTROPHY')
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        UPDATE workout_day_exercises
        SET base_sets = 4
        WHERE exercise_id IN (SELECT id FROM exercises WHERE category = 'HYPERTROPHY')
    """))
