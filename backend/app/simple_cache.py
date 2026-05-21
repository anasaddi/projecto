"""Simple in-memory TTL cache for dashboard state when Redis is unavailable.
Works per-worker (not shared across Gunicorn workers) but still helps reduce DB load significantly."""
import time
from typing import Optional, Dict, Any

_store: Dict[str, tuple[Any, float]] = {}

async def get(key: str, ttl: int = 600) -> Optional[Any]:
    """Get value if it exists and hasn't expired."""
    item = _store.get(key)
    if not item:
        return None
    value, expires_at = item
    if time.monotonic() > expires_at:
        del _store[key]
        return None
    return value

async def set(key: str, value: Any, ttl: int = 600) -> None:
    """Store value with TTL."""
    _store[key] = (value, time.monotonic() + ttl)

async def delete(key: str) -> None:
    """Remove key."""
    _store.pop(key, None)

# Dashboard-specific helpers
SHARED_PREFIX = "shared_dashboard:"


def dashboard_fallback_key(user_id: str | None = None) -> str:
    return f"dashboard:{user_id or 'default'}"


async def get_cached_dashboard_fallback(user_id: str | None = None) -> Optional[Any]:
    return await get(dashboard_fallback_key(user_id), ttl=600)


async def set_cached_dashboard_fallback(data: Any, user_id: str | None = None) -> None:
    await set(dashboard_fallback_key(user_id), data, ttl=600)


async def invalidate_dashboard_fallback(user_id: str | None = None) -> None:
    await delete(dashboard_fallback_key(user_id))

async def get_cached_shared_dashboard_fallback(share_id: str) -> Optional[Any]:
    return await get(f"{SHARED_PREFIX}{share_id}", ttl=300)

async def set_cached_shared_dashboard_fallback(share_id: str, data: Any) -> None:
    await set(f"{SHARED_PREFIX}{share_id}", data, ttl=300)

async def invalidate_shared_dashboard_fallback(share_id: str) -> None:
    await delete(f"{SHARED_PREFIX}{share_id}")
