"""
Structured JSON logging middleware + logger setup.
Replaces print() with structured observability.
"""
import logging
import json
import time
import sys
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "ts": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Merge extra fields
        for key in ("method", "path", "status", "latency_ms", "ip", "share_id", "action", "error"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        return json.dumps(log_entry, default=str)


def setup_logging(level: str = "INFO"):
    """Configure root logger with structured JSON output."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JSONFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    # Silence noisy libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


logger = logging.getLogger("km")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        latency = round((time.monotonic() - start) * 1000, 1)

        # Skip noisy health checks
        if request.url.path in ("/health", "/ready"):
            return response

        logger.info(
            f"{request.method} {request.url.path} {response.status_code} {latency}ms",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "status": response.status_code,
                "latency_ms": latency,
                "ip": request.client.host if request.client else "unknown",
            }
        )
        return response


def add_request_logging(app):
    app.add_middleware(RequestLoggingMiddleware)
