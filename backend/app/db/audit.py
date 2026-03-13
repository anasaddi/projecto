"""
Event Sourcing: audit log for all dashboard mutations.
Every change is recorded as an immutable event for undo/redo and history.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.db.session import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(64), nullable=False, index=True)   # "task", "project", "quick_task", "habit", "chat"
    entity_id = Column(String(64), nullable=False, index=True)
    action = Column(String(32), nullable=False, index=True)        # "created", "updated", "deleted", "toggled"
    share_id = Column(String(64), nullable=True, index=True)       # Null for personal dashboard
    actor_id = Column(String(64), nullable=True)                   # Who did it (user ID or "system")
    old_data = Column(JSON, nullable=True)                         # Previous state (for undo)
    new_data = Column(JSON, nullable=True)                         # New state
    metadata_ = Column("metadata", JSON, nullable=True)            # Extra context
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
