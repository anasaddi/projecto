"""
Redis caching layer for dashboard state.
Uses Redis as a read-through cache with write-behind persistence.
Falls back gracefully if Redis is unavailable.
"""
import json
import logging
import time
from typing import Optional
from redis.asyncio import Redis, ConnectionPool
from app.config import get_settings

logger = logging.getLogger("km.cache")

_pool: Optional[ConnectionPool] = None
_redis: Optional[Redis] = None
# Circuit breaker: skip connection attempts until this time (monotonic) when Redis recently failed
_redis_unavailable_until: float = 0.0
REDIS_CIRCUIT_BREAKER_SEC = 30

# TTL for cached dashboard state (seconds) - increased for better performance
DASHBOARD_TTL = 600  # 10 minutes
SHARED_DASHBOARD_TTL = 300  # 5 minutes


async def get_redis() -> Optional[Redis]:
    """Get or create Redis connection. Returns None if unavailable."""
    global _pool, _redis, _redis_unavailable_until
    if time.monotonic() < _redis_unavailable_until:
        return None
    if _redis is not None:
        try:
            await _redis.ping()
            return _redis
        except Exception:
            _redis = None
            _pool = None

    try:
        settings = get_settings()
        _pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=20,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
            retry_on_timeout=False,
        )
        _redis = Redis(connection_pool=_pool)
        await _redis.ping()
        _redis_unavailable_until = 0.0
        logger.info("Redis connected")
        return _redis
    except Exception as e:
        logger.info("Redis not available — running without cache (optional for local dev): %s", e)
        _redis = None
        _pool = None
        _redis_unavailable_until = time.monotonic() + REDIS_CIRCUIT_BREAKER_SEC
        return None


async def cache_get(key: str) -> Optional[dict]:
    """Read from cache. Returns None on miss or error."""
    r = await get_redis()
    if not r:
        return None
    try:
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def cache_set(key: str, data: dict, ttl: int = DASHBOARD_TTL):
    """Write to cache with TTL."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.setex(key, ttl, json.dumps(data, default=str))
    except Exception:
        pass


async def cache_delete(key: str):
    """Invalidate a cache key."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.delete(key)
    except Exception:
        pass


async def cache_publish(channel: str, data: dict):
    """Publish an event to a Redis Pub/Sub channel."""
    r = await get_redis()
    if not r:
        return
    try:
        await r.publish(channel, json.dumps(data, default=str))
    except Exception:
        pass


# Dashboard-specific helpers
DASHBOARD_CACHE_KEY = "dashboard:default"


def shared_dashboard_key(share_id: str) -> str:
    return f"shared_dashboard:{share_id}"


async def get_cached_dashboard() -> Optional[dict]:
    return await cache_get(DASHBOARD_CACHE_KEY)


async def set_cached_dashboard(data: dict):
    await cache_set(DASHBOARD_CACHE_KEY, data, DASHBOARD_TTL)


async def invalidate_dashboard():
    await cache_delete(DASHBOARD_CACHE_KEY)


async def get_cached_shared_dashboard(share_id: str) -> Optional[dict]:
    return await cache_get(shared_dashboard_key(share_id))


async def set_cached_shared_dashboard(share_id: str, data: dict):
    await cache_set(shared_dashboard_key(share_id), data, SHARED_DASHBOARD_TTL)


async def invalidate_shared_dashboard(share_id: str):
    await cache_delete(shared_dashboard_key(share_id))


# Embedding/Search helpers
EMBEDDING_TTL = 86400 * 30  # 30 days
SEARCH_RESULTS_TTL = 300  # 5 minutes


def embedding_key(text_hash: str) -> str:
    return f"embedding:{text_hash}"


def search_results_key(query_hash: str) -> str:
    return f"search:{query_hash}"


async def get_cached_embedding(text_hash: str) -> Optional[list[float]]:
    r = await get_redis()
    if not r:
        return None
    try:
        val = await r.get(embedding_key(text_hash))
        return json.loads(val) if val else None
    except Exception:
        return None


async def set_cached_embedding(text_hash: str, vector: list[float]):
    r = await get_redis()
    if not r:
        return
    try:
        await r.setex(embedding_key(text_hash), EMBEDDING_TTL, json.dumps(vector))
    except Exception:
        pass


async def get_cached_search_results(query_hash: str) -> Optional[dict]:
    return await cache_get(search_results_key(query_hash))


async def set_cached_search_results(query_hash: str, results: dict):
    await cache_set(search_results_key(query_hash), results, SEARCH_RESULTS_TTL)
