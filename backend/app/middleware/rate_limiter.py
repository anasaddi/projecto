"""
Rate limiting middleware using in-memory sliding-window counter.
No external dependency required — works standalone.
"""
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

# Config
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 200     # max requests per window per IP
WS_RATE_LIMIT_MAX = 60   # max WS messages per minute (handled in websockets.py)


class _SlidingWindow:
    """Simple in-memory sliding window counter."""
    __slots__ = ("_hits",)

    def __init__(self):
        self._hits: dict[str, list[float]] = defaultdict(list)

    def hit(self, key: str, now: float = None) -> int:
        now = now or time.monotonic()
        window_start = now - RATE_LIMIT_WINDOW
        # Prune old entries
        hits = self._hits[key]
        self._hits[key] = hits = [t for t in hits if t > window_start]
        hits.append(now)
        return len(hits)

    def count(self, key: str) -> int:
        now = time.monotonic()
        window_start = now - RATE_LIMIT_WINDOW
        self._hits[key] = [t for t in self._hits[key] if t > window_start]
        return len(self._hits[key])


_window = _SlidingWindow()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip health checks and WebSocket upgrades
        if request.url.path in ("/health", "/ready") or request.headers.get("upgrade") == "websocket":
            return await call_next(request)

        ip = _get_client_ip(request)
        count = _window.hit(ip)

        if count > RATE_LIMIT_MAX:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Slow down."},
                headers={
                    "Retry-After": str(RATE_LIMIT_WINDOW),
                    "X-RateLimit-Limit": str(RATE_LIMIT_MAX),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX)
        response.headers["X-RateLimit-Remaining"] = str(max(0, RATE_LIMIT_MAX - count))
        return response


def add_rate_limiter(app):
    app.add_middleware(RateLimitMiddleware)
