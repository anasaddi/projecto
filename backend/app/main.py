import traceback
import logging
import signal
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.routes import sources, content, insights, search, youtube, training
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
    return [x.strip() for x in s.split(",") if x.strip()]


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
                await conn.run_sync(Base.metadata.create_all)
                # Manual schema migration for is_active column if it doesn't exist
                try:
                    dialect = conn.dialect.name
                    if dialect == "postgresql":
                        await conn.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1"))
                    elif dialect == "sqlite":
                        cols = await conn.execute(text("PRAGMA table_info(exercises)"))
                        col_names = {r[1] for r in cols.fetchall()}
                        if "is_active" not in col_names:
                            await conn.execute(text("ALTER TABLE exercises ADD COLUMN is_active INTEGER DEFAULT 1"))
                except Exception as migrate_err:
                    logger.warning(f"Migration error (is_active): {migrate_err}")
            db_ready = True
            logger.info(f"Database connection successful on attempt {i+1}")
            break
        except Exception as e:
            logger.error(f"Database connection attempt {i+1} failed: {e}")
            if i < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                logger.critical("Max retries reached. Database initialization failed.")

    # Seeding
    if db_ready:
        from app.db.session import AsyncSessionLocal
        from app.db.seed_training import seed_training_if_empty, seed_fake_history
        async with AsyncSessionLocal() as db:
            try:
                n = await seed_training_if_empty(db)
                if n: logger.info(f"Seeded {n} exercises.")
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
        title="KM Personal",
        description="Personal Knowledge Management - Text + Media ingestion",
        version="0.2.0",
        lifespan=lifespan,
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        tb = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "traceback": tb},
        )

    # Middleware stack (order matters: last added = first executed)
    # 1. CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # 2. Compression (GZip)
    add_compression(app)
    # 3. Rate Limiting
    add_rate_limiter(app)
    # 4. Structured Request Logging
    add_request_logging(app)

    # Routers
    app.include_router(training.router, prefix="/api/training", tags=["training"])
    app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
    app.include_router(content.router, prefix="/api/content", tags=["content"])
    app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
    return app


app = create_app()


# --- Health & Readiness ---

@app.get("/health")
async def health():
    """Lightweight liveness probe."""
    return {"status": "ok"}


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
