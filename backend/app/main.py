import traceback
import logging
import signal
import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.routes import sources, content, insights, search, youtube, training, config, auth, bootstrap
from app.config import get_settings
from app.db.session import Base, engine
from app.db import models
from app.db import audit as audit_models  # Register AuditEvent table
from app.middleware.logging import setup_logging, add_request_logging
from app.middleware.compression import add_compression
from app.middleware.rate_limiter import add_rate_limiter

logger = logging.getLogger("km")


def _cors_origins_list(settings) -> list:
    s = (getattr(settings, "cors_origins", None) or "").strip()
    origins = [x.strip() for x in s.split(",") if x.strip()]
    # Always allow Vercel deployment origins (even if CORS_ORIGINS env var is missing)
    vercel_origins = ["https://projecto-indol.vercel.app", "https://projecto-frontend.vercel.app"]
    for vo in vercel_origins:
        if vo not in origins:
            origins.append(vo)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.log_level)

    # Ensure all tables exist (including audit_events)
    import asyncio
    max_retries = 5
    retry_delay = 5
    
    db_ready = False
    for i in range(max_retries):
        try:
            async with engine.begin() as conn:
                try:
                    if not settings.is_production:
                        await conn.run_sync(Base.metadata.create_all)
                except Exception as e:
                    logger.error(f"Failed to create tables: {e}")
                    db_ready = False
                else:
                    db_ready = True
                    logger.info(f"Database connection and table creation successful on attempt {i+1}")
                    break # Exit loop on success
        except Exception as e:
            logger.error(f"Database connection attempt {i+1} failed: {e}")
            if i < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                logger.critical("Max retries reached. Database initialization failed.")
                db_ready = False # Ensure db_ready is False if all retries fail

    # Seeding (skip in prod after first boot via SEED_ON_START=false)
    if db_ready and settings.seed_on_start:
        from app.db.session import AsyncSessionLocal
        from app.db.seed_training import seed_training_if_empty, seed_fake_history, sync_missing_exercises
        from app.db.models import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            try:
                # Ensure 'admin' user exists in database to satisfy foreign keys
                res = await db.execute(select(User).filter(User.id == "admin"))
                if not res.scalar_one_or_none():
                    db.add(User(id="admin", email="admin@projecto.local", auth_provider="local"))
                    await db.commit()
                    logger.info("Admin user verified/created in users table.")

                n = await seed_training_if_empty(db)
                if n: logger.info(f"Seeded {n} exercises.")
                added = await sync_missing_exercises(db)
                if added: logger.info(f"Synced {added} missing exercises.")
                m = await seed_fake_history(db)
                if m: logger.info(f"Seeded {m} history logs.")
            except Exception as e:
                logger.error(f"Seed error: {e}")

    # Pre-warm Redis connection
    try:
        from app.cache import get_redis
        r = await get_redis()
        if r:
            logger.info("Redis cache warmed up")
    except Exception:
        logger.info("Redis not available, running without cache")

    # Security: warn loudly if default secret keys are still in use
    _INSECURE_DEFAULTS = {"change-me-in-env", "your-secret-key-for-jwt", ""}
    if settings.admin_access_key in _INSECURE_DEFAULTS:
        logger.critical(
            "SECURITY WARNING: admin_access_key is set to the default insecure value. "
            "Set ADMIN_ACCESS_KEY in your .env file before exposing this service."
        )
    if settings.secret_key in _INSECURE_DEFAULTS:
        logger.critical(
            "SECURITY WARNING: secret_key is set to the default insecure value. "
            "Set SECRET_KEY in your .env file before exposing this service."
        )

    logger.info("App started successfully")
    yield

    # Graceful shutdown: close WebSocket connections, notify clients
    logger.info("Shutting down gracefully...")
    from app.websockets import manager
    await manager.graceful_shutdown()
    
    # Close Redis pool
    try:
        from app.cache import _redis, _pool
        if _redis:
            await _redis.close()
    except Exception:
        pass
    
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="PROJECTO",
        description="Personal Knowledge Management - Text + Media ingestion",
        version="0.2.0",
        lifespan=lifespan,
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc):
        # GET dashboard-state: never 500 — return empty state so frontend can use local data
        if "/api/training/dashboard-state" in str(request.url.path) and "at" not in str(request.url.path):
            logger.warning("dashboard-state %s failed, returning empty state: %s", request.method, exc)
            if request.method == "GET":
                return JSONResponse(status_code=200, content={
                    "key": "default",
                    "data": {
                        "dailyTaskTemplates": [],
                        "dailyTaskLogs": {},
                        "projects": [],
                        "quickTasks": [],
                        "prayerLogs": {},
                        "top3Manual": [None, None, None],
                        "dailyCompletionLog": {},
                        "lifeGoals": {"collapsed": False, "tiers": []},
                    },
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }, headers={"X-Degraded": "true"})
            if request.method == "PUT":
                return JSONResponse(status_code=503, content={"detail": "Dashboard save failed"})
        # GET/PUT shared-dashboard: never 500 — return controlled fallback or save error
        if "/api/training/shared-dashboard" in str(request.url.path):
            logger.warning("shared-dashboard %s failed, returning controlled fallback: %s", request.method, exc)
            if request.method == "GET":
                return JSONResponse(status_code=503, content={"detail": "Shared dashboard unavailable"})
            return JSONResponse(status_code=503, content={"detail": f"Shared dashboard save failed: {exc}"})
        # GET config/constants: return minimal config
        if "/api/config/constants" in str(request.url.path):
            logger.warning("config/constants GET failed, returning defaults: %s", exc)
            return JSONResponse(status_code=200, content={
                "PRAYERS": ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
                "PROJECT_ACCENTS": {},
            })
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        content = {"detail": str(exc)}
        if settings.debug:
            content["traceback"] = traceback.format_exc()
        return JSONResponse(status_code=500, content=content)

    # Middleware stack (order matters: last added = first executed on request)
    # CORS must be outermost so it handles preflight OPTIONS before any other
    # middleware can interfere, and adds headers to every response last.
    # 1. Request logging (innermost – runs last on request path)
    add_request_logging(app)
    # 2. Rate limiting
    add_rate_limiter(app)
    # 3. Compression (GZip)
    add_compression(app)
    # 4. CORS (outermost – runs first on request, adds CORS headers last on response)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins_list(settings),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(bootstrap.router, prefix="/api", tags=["bootstrap"])
    app.include_router(training.router, prefix="/api/training", tags=["training"])
    app.include_router(config.router, prefix="/api/config", tags=["config"])
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
    app.include_router(content.router, prefix="/api/content", tags=["content"])
    app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
    return app


app = create_app()


# --- Root (evita 404 se si apre localhost:8000 in browser) ---

@app.get("/")
async def root():
    """Root route: API in ascolto. Per la UI apri il frontend (es. http://localhost:3000)."""
    return {
        "message": "PROJECTO API",
        "docs": "/docs",
        "health": "/health",
        "frontend_dev": "Avvia il frontend con npm run dev (porta 3000) e apri http://localhost:3000",
    }


# --- Health & Readiness ---

@app.get("/health")
async def health():
    """Lightweight liveness probe."""
    return {"status": "ok"}


@app.get("/keepalive")
@app.head("/keepalive")
async def keepalive():
    """Keepalive endpoint to prevent Render free tier sleep."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/ready")
async def readiness():
    """Deep readiness check: DB + Redis connectivity."""
    checks = {}
    
    # DB check
    try:
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    # Redis check
    try:
        from app.cache import get_redis
        r = await get_redis()
        if r:
            await r.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "unavailable"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    # WebSocket count
    from app.websockets import manager
    ws_count = sum(len(v) for v in manager.active_connections.values())
    checks["websocket_connections"] = ws_count

    all_ok = checks.get("database") == "ok"
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks,
    }
