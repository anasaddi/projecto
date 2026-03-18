"""Add domain_events table for Event Sourcing / Time Travel

Revision ID: 009_domain_events
Revises: 008_users
Create Date: 2026-03-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "009_domain_events"
down_revision: Union[str, None] = "008_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "domain_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("aggregate_type", sa.String(64), nullable=False),
        sa.Column("aggregate_id", sa.String(128), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("user_id", sa.String(128), nullable=True),
        sa.Column("version", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_domain_events")),
    )
    op.create_index(op.f("ix_domain_events_id"), "domain_events", ["id"], unique=False)
    op.create_index(op.f("ix_domain_events_aggregate_type"), "domain_events", ["aggregate_type"], unique=False)
    op.create_index(op.f("ix_domain_events_aggregate_id"), "domain_events", ["aggregate_id"], unique=False)
    op.create_index(op.f("ix_domain_events_event_type"), "domain_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_domain_events_user_id"), "domain_events", ["user_id"], unique=False)
    op.create_index(op.f("ix_domain_events_timestamp"), "domain_events", ["timestamp"], unique=False)
    op.create_index("idx_domain_events_aggregate_time", "domain_events", ["aggregate_type", "aggregate_id", "timestamp"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_domain_events_aggregate_time", table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_timestamp"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_user_id"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_event_type"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_aggregate_id"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_aggregate_type"), table_name="domain_events")
    op.drop_index(op.f("ix_domain_events_id"), table_name="domain_events")
    op.drop_table("domain_events")
