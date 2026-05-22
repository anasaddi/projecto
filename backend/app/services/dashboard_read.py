"""Unified dashboard read path (cache + DB + ETag)."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.api._dashboard_helpers import (
    dashboard_etag,
    dashboard_snapshot_or_empty,
    has_meaningful_dashboard_data,
)
from app.services import dashboard_service

logger = logging.getLogger(__name__)


@dataclass
class DashboardReadResult:
    """Client-ready dashboard-state payload."""

    key: str
    data: dict[str, Any]
    updated_at: datetime
    etag: str
    not_modified: bool


async def read_dashboard_for_client(
    db: AsyncSession,
    *,
    user_id: str | None,
    if_none_match: str | None = None,
    log_label: str = "read_dashboard",
) -> DashboardReadResult:
    """Redis-first dashboard read with ETag/304 support."""
    from app.cache import get_cached_dashboard, set_cached_dashboard

    t0 = time.perf_counter()
    cached = await get_cached_dashboard(user_id)

    if has_meaningful_dashboard_data(cached):
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info("%s cache hit in %.1fms (user=%s)", log_label, elapsed_ms, user_id or "default")
        updated_at = datetime.now(timezone.utc)
        etag = dashboard_etag(user_id, cached)
        if if_none_match == etag:
            return DashboardReadResult("default", cached, updated_at, etag, True)
        return DashboardReadResult("default", cached, updated_at, etag, False)

    if cached:
        logger.info("%s ignoring empty cache; fetching DB snapshot", log_label)

    data, updated_at = await dashboard_service.get_dashboard_with_meta(db, user_id=user_id)
    await set_cached_dashboard(data, user_id)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info("%s DB fetch in %.1fms (user=%s)", log_label, elapsed_ms, user_id or "default")

    snapshot = dashboard_snapshot_or_empty(data)
    etag = dashboard_etag(user_id, data, updated_at)
    ts = updated_at or datetime.now(timezone.utc)
    if if_none_match == etag:
        return DashboardReadResult("default", snapshot, ts, etag, True)
    return DashboardReadResult("default", snapshot, ts, etag, False)


def dashboard_read_to_response(result: DashboardReadResult) -> dict[str, Any]:
    return {
        "key": result.key,
        "data": result.data,
        "updated_at": result.updated_at,
    }
