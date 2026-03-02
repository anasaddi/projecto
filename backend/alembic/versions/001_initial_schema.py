"""Initial schema: sources, contents, content_chunks, insights, sessions

Revision ID: 001
Revises:
Create Date: 2025-02-12

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sources",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("tipo", sa.String(32), nullable=False),
        sa.Column("url_or_path", sa.String(2048), nullable=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("content_hash", sa.String(64), nullable=True),
        sa.Column("error_code", sa.String(64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_sources_id", "sources", ["id"])
    op.create_index("ix_sources_url_or_path", "sources", ["url_or_path"])
    op.create_index("ix_sources_content_hash", "sources", ["content_hash"])

    op.create_table(
        "contents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id"), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("clean_text", sa.Text(), nullable=True),
        sa.Column("parse_diagnostics", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_contents_id", "contents", ["id"])
    op.create_index("ix_contents_source_id", "contents", ["source_id"])

    op.create_table(
        "content_chunks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("content_id", sa.Integer(), sa.ForeignKey("contents.id"), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_content_chunks_id", "content_chunks", ["id"])
    op.create_index("ix_content_chunks_content_id", "content_chunks", ["content_id"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id"), nullable=True),
        sa.Column("intent", sa.String(32), nullable=False, server_default="auto"),
        sa.Column("started_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_sessions_id", "sessions", ["id"])
    op.create_index("ix_sessions_source_id", "sessions", ["source_id"])

    op.create_table(
        "insights",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("content_id", sa.Integer(), sa.ForeignKey("contents.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("transferable_principle", sa.Text(), nullable=True),
        sa.Column("applicability_contexts", sa.JSON(), nullable=True),
        sa.Column("tipo", sa.String(32), nullable=False, server_default="manual"),
        sa.Column("session_intent", sa.String(32), nullable=True),
        sa.Column("user_rating", sa.String(32), nullable=True),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_insights_id", "insights", ["id"])
    op.create_index("ix_insights_content_id", "insights", ["content_id"])


def downgrade() -> None:
    op.drop_table("insights")
    op.drop_table("sessions")
    op.drop_table("content_chunks")
    op.drop_table("contents")
    op.drop_table("sources")
