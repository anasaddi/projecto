"""
Event sourcing CRUD helpers — record audit events for dashboard mutations.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.audit import AuditEvent

logger = logging.getLogger("km.audit")


async def record_event(
    db: AsyncSession,
    entity_type: str,
    entity_id: str,
    action: str,
    share_id: str | None = None,
    actor_id: str | None = None,
    old_data: dict | None = None,
    new_data: dict | None = None,
    metadata: dict | None = None,
):
    """Record an immutable audit event. Fire-and-forget, never blocks the caller."""
    try:
        event = AuditEvent(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            share_id=share_id,
            actor_id=actor_id,
            old_data=old_data,
            new_data=new_data,
            metadata_=metadata,
        )
        db.add(event)
        # Don't commit here — let the caller's transaction handle it
    except Exception as e:
        logger.warning(f"Failed to record audit event: {e}")


async def get_events(
    db: AsyncSession,
    entity_type: str | None = None,
    entity_id: str | None = None,
    share_id: str | None = None,
    limit: int = 50,
):
    """Query audit events with filters."""
    from sqlalchemy import select
    q = select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit)
    if entity_type:
        q = q.filter(AuditEvent.entity_type == entity_type)
    if entity_id:
        q = q.filter(AuditEvent.entity_id == entity_id)
    if share_id:
        q = q.filter(AuditEvent.share_id == share_id)
    result = await db.execute(q)
    return [
        {
            "id": e.id,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "action": e.action,
            "share_id": e.share_id,
            "actor_id": e.actor_id,
            "old_data": e.old_data,
            "new_data": e.new_data,
            "metadata": e.metadata_,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in result.scalars().all()
    ]
