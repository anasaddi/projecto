"""Add completed_at to prayer_logs for timestamp tracking

Revision ID: 010_prayer_completed_at
Revises: 009_domain_events
Create Date: 2026-05-03

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "010_prayer_completed_at"
down_revision: Union[str, None] = "009_domain_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable completed_at column — existing rows keep NULL (no data loss)
    op.add_column('prayer_logs', sa.Column('completed_at', sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column('prayer_logs', 'completed_at')
