"""Unified shared dashboard fetch (cache + DB) with consistent internal shape."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.api._dashboard_helpers import safe_shared_dashboard_data
from app.services import dashboard_service

logger = logging.getLogger(__name__)

INTERNAL_KEYS = ("share_id", "title", "data", "updated_at")


def normalize_shared_record(share_id: str, raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize cache/DB/service payloads to internal record (data may include passwordHash)."""
    if "share_id" in raw and "is_protected" in raw and raw.get("data") is not None:
        # Legacy REST cached client shape — may lack passwordHash; prefer DB fields when present
        data = safe_shared_dashboard_data(raw.get("data"))
    elif "share_id" in raw:
        data = safe_shared_dashboard_data(raw.get("data"))
    else:
        data = safe_shared_dashboard_data(raw.get("data"))
    return {
        "share_id": share_id,
        "title": raw.get("title") or "Progetti Condivisi",
        "data": data,
        "updated_at": raw.get("updated_at") or datetime.now(timezone.utc),
    }


def shared_dashboard_out(
    record: dict[str, Any],
    *,
    include_data: bool,
) -> dict[str, Any]:
    payload_data = safe_shared_dashboard_data(record.get("data"))
    pwd_hash = payload_data.get("passwordHash")
    is_protected = bool(pwd_hash)
    if include_data:
        clean = dict(payload_data)
        clean.pop("passwordHash", None)
        clean.pop("sectionPasswords", None)
        data = clean
    else:
        data = None
    return {
        "share_id": record["share_id"],
        "title": record.get("title") or "Progetti Condivisi",
        "data": data,
        "updated_at": record.get("updated_at"),
        "is_protected": is_protected,
    }


async def fetch_shared_dashboard_internal(
    db: AsyncSession,
    share_id: str,
) -> dict[str, Any] | None:
    """Load shared dashboard from cache or DB; cache always stores internal shape."""
    from app.cache import get_cached_shared_dashboard, invalidate_shared_dashboard, set_cached_shared_dashboard

    cached = await get_cached_shared_dashboard(share_id)
    if cached is not None and not isinstance(cached, dict):
        logger.warning("Ignoring malformed shared dashboard cache for %s", share_id)
        await invalidate_shared_dashboard(share_id)
        cached = None

    if cached:
        record = normalize_shared_record(share_id, cached)
        # Protected shell cached without hash — refetch from DB
        if record.get("data") is None and cached.get("is_protected"):
            cached = None
        else:
            return record

    raw = await dashboard_service.get_shared_dashboard(db, share_id)
    if not raw:
        return None

    record = normalize_shared_record(share_id, raw)
    await set_cached_shared_dashboard(share_id, record)
    return record


async def auto_create_shared_dashboard(
    db: AsyncSession,
    share_id: str,
) -> dict[str, Any]:
    created = await dashboard_service.update_shared_dashboard(
        db, share_id, {}, title="Progetti Condivisi"
    )
    record = normalize_shared_record(share_id, created)
    from app.cache import set_cached_shared_dashboard

    await set_cached_shared_dashboard(share_id, record)
    return record
