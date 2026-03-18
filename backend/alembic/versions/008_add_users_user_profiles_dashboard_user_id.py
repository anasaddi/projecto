"""Add users, user_profiles, and user_id on dashboard_states

Revision ID: 008_users
Revises: 760fc49c5bc0
Create Date: 2026-03-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "008_users"
down_revision: Union[str, None] = "8d296e8b25ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(128), nullable=False),
        sa.Column("email", sa.String(256), nullable=True),
        sa.Column("auth_provider", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("timezone", sa.String(64), nullable=True),
        sa.Column("preferences", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_user_profiles")),
    )
    op.create_index(op.f("ix_user_profiles_user_id"), "user_profiles", ["user_id"], unique=False)

    op.add_column("dashboard_states", sa.Column("user_id", sa.String(128), nullable=True))
    op.create_foreign_key(
        "fk_dashboard_states_user_id",
        "dashboard_states",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(op.f("ix_dashboard_states_user_id"), "dashboard_states", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dashboard_states_user_id"), table_name="dashboard_states")
    op.drop_constraint("fk_dashboard_states_user_id", "dashboard_states", type_="foreignkey")
    op.drop_column("dashboard_states", "user_id")
    op.drop_index(op.f("ix_user_profiles_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
