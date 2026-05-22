"""Add read-path indexes for workout logs and chat messages

Revision ID: 014_perf_indexes
Revises: 013_admin_backfill
Create Date: 2026-05-22
"""

from typing import Sequence, Union

from alembic import op


revision: str = "014_perf_indexes"
down_revision: Union[str, None] = "013_admin_backfill"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "sqlite":
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_workout_logs_logged_at ON workout_logs (logged_at)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_chat_messages_timestamp ON chat_messages (timestamp)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS ix_chat_messages_share_timestamp "
            "ON chat_messages (share_id, timestamp)"
        )
    else:
        op.create_index("ix_workout_logs_logged_at", "workout_logs", ["logged_at"], unique=False)
        op.create_index("ix_chat_messages_timestamp", "chat_messages", ["timestamp"], unique=False)
        op.create_index(
            "ix_chat_messages_share_timestamp",
            "chat_messages",
            ["share_id", "timestamp"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "sqlite":
        op.execute("DROP INDEX IF EXISTS ix_chat_messages_share_timestamp")
        op.execute("DROP INDEX IF EXISTS ix_chat_messages_timestamp")
        op.execute("DROP INDEX IF EXISTS ix_workout_logs_logged_at")
    else:
        op.drop_index("ix_chat_messages_share_timestamp", table_name="chat_messages")
        op.drop_index("ix_chat_messages_timestamp", table_name="chat_messages")
        op.drop_index("ix_workout_logs_logged_at", table_name="workout_logs")
