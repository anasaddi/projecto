"""
Event Sourcing: audit log and domain events for dashboard mutations.
- AuditEvent: fine-grained audit (task toggled, etc.)
- DomainEvent: CQRS-style events for rebuilding state (Time Travel).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index
from app.db.session import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False, index=True)
    action = Column(String(32), nullable=False, index=True)
    share_id = Column(String(64), nullable=True, index=True)
    actor_id = Column(String(64), nullable=True)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class DomainEvent(Base):
    """Append-only event log for CQRS / Time Travel. State is derived by replay."""
    __tablename__ = "domain_events"

    id = Column(Integer, primary_key=True, index=True)
    aggregate_type = Column(String(64), nullable=False, index=True)  # "dashboard", "shared_dashboard"
    aggregate_id = Column(String(128), nullable=False, index=True)   # user_id or "default" or share_id
    event_type = Column(String(64), nullable=False, index=True)     # "DashboardStateUpdated", "HabitChecked", ...
    payload = Column(JSON, nullable=False, default=dict)
    user_id = Column(String(128), nullable=True, index=True)
    version = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    __table_args__ = (Index("idx_domain_events_aggregate_time", "aggregate_type", "aggregate_id", "timestamp"),)
