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
    # Uses IF NOT EXISTS for idempotency (safe to re-run)
    op.execute("ALTER TABLE prayer_logs ADD COLUMN IF NOT EXISTS completed_at VARCHAR(64)")


def downgrade() -> None:
    op.drop_column('prayer_logs', 'completed_at')
