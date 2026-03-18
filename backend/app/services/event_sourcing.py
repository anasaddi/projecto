"""
Event Sourcing: append-only domain events and state reconstruction (Time Travel).
"""
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.audit import DomainEvent


EVENT_TYPE_DASHBOARD_UPDATED = "DashboardStateUpdated"
AGGREGATE_DASHBOARD = "dashboard"


async def append_dashboard_event(
    db: AsyncSession,
    aggregate_id: str,
    payload: dict[str, Any],
    user_id: str | None = None,
) -> None:
    """Append a dashboard state update event. Call after persisting state (e.g. in update_dashboard_from_json)."""
    event = DomainEvent(
        aggregate_type=AGGREGATE_DASHBOARD,
        aggregate_id=aggregate_id,
        event_type=EVENT_TYPE_DASHBOARD_UPDATED,
        payload=payload,
        user_id=user_id,
    )
    db.add(event)


async def get_dashboard_events(
    db: AsyncSession,
    aggregate_id: str,
    before: datetime | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    """Load events for an aggregate up to optional timestamp (for Time Travel)."""
    q = (
        select(DomainEvent)
        .filter(
            DomainEvent.aggregate_type == AGGREGATE_DASHBOARD,
            DomainEvent.aggregate_id == aggregate_id,
        )
        .order_by(DomainEvent.timestamp.asc())
    )
    if before is not None:
        q = q.filter(DomainEvent.timestamp <= before)
    q = q.limit(limit)
    result = await db.execute(q)
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "payload": e.payload,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]


def project_events_to_state(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Replay events to get state at a point in time. Last DashboardStateUpdated wins."""
    state: dict[str, Any] = {}
    for ev in events:
        if ev.get("event_type") == EVENT_TYPE_DASHBOARD_UPDATED and isinstance(ev.get("payload"), dict):
            state = ev["payload"]
    return state


async def get_dashboard_state_at(
    db: AsyncSession,
    aggregate_id: str,
    at: datetime | None = None,
) -> dict[str, Any]:
    """Time Travel: return dashboard state as it was at `at` (or latest if at is None)."""
    events = await get_dashboard_events(db, aggregate_id, before=at)
    return project_events_to_state(events)
