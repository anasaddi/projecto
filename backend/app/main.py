import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import sources, content, insights, search, youtube, training
from app.config import get_settings
from app.db.session import SessionLocal, Base, engine
from app.db import models
from app.db.seed_training import seed_training_if_empty, seed_fake_history


def _cors_origins_list(settings) -> list:
    s = (getattr(settings, "cors_origins", None) or "").strip()
    return [x.strip() for x in s.split(",") if x.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist (important for SQLite in production)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Table creation error: {e}")

    # Seed training data if DB is empty (run after migrations)
    try:
        db = SessionLocal()
        
        # Manual migration for SQLite (adding is_active to exercises if it doesn't exist)
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE exercises ADD COLUMN is_active INTEGER DEFAULT 1"))
            db.commit()
        except Exception:
            db.rollback() # Ignore if column already exists

        n = seed_training_if_empty(db)
        if n:
            print(f"Training seed: inserted {n} exercises and day templates.")
        m = seed_fake_history(db)
        if m:
            print(f"Fake history: inserted {m} workout logs.")
        db.close()
    except Exception as e:
        print(f"Training seed skipped or failed: {e}")
    yield
    # shutdown cleanup if needed


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="KM Personal",
        description="Personal Knowledge Management - Text + Media ingestion",
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request, exc):
        tb = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc), "traceback": tb},
        )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Temporaneamente permettiamo tutto per debugging CORS/Proxy
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(training.router, prefix="/api/training", tags=["training"])
    app.include_router(sources.router, prefix="/api/sources", tags=["sources"])
    app.include_router(content.router, prefix="/api/content", tags=["content"])
    app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
    return app


app = create_app()


@app.get("/health")
def health():
    return {"status": "ok"}
