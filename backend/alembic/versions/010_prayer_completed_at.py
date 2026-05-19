"""Add completed_at to prayer_logs for timestamp tracking

Revision ID: 010_prayer_completed_at
Revises: 009_domain_events
Create Date: 2026-05-03

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "010_prayer_completed_at"
down_revision: Union[str, None] = "009_domain_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("prayer_logs")]
    if "completed_at" not in columns:
        if bind.dialect.name == "postgresql":
            # Add nullable completed_at column — existing rows keep NULL (no data loss)
            # Uses IF NOT EXISTS for idempotency (safe to re-run)
            op.execute("ALTER TABLE prayer_logs ADD COLUMN IF NOT EXISTS completed_at VARCHAR(64)")
        else:
            with op.batch_alter_table("prayer_logs") as batch_op:
                batch_op.add_column(sa.Column("completed_at", sa.String(length=64), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c["name"] for c in inspector.get_columns("prayer_logs")]
    if "completed_at" in columns:
        if bind.dialect.name == "postgresql":
            op.drop_column('prayer_logs', 'completed_at')
        else:
            with op.batch_alter_table("prayer_logs") as batch_op:
                batch_op.drop_column("completed_at")


