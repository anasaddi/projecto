"""Seed admin user in users table

Revision ID: 012_seed_admin_user
Revises: 011_scope_dashboard_relational_by_user
Create Date: 2026-05-19

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import inspect, text


revision: str = "012_seed_admin_user"
down_revision: Union[str, None] = "011_scope_dashboard_relational_by_user"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "users" in inspector.get_table_names():
        res = bind.execute(text("SELECT id FROM users WHERE id = 'admin'")).fetchone()
        if not res:
            op.execute(
                "INSERT INTO users (id, email, auth_provider, created_at) "
                "VALUES ('admin', 'admin@projecto.local', 'local', CURRENT_TIMESTAMP)"
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "users" in inspector.get_table_names():
        op.execute("DELETE FROM users WHERE id = 'admin'")
