import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import sources, content, insights, search, youtube, training
from app.config import get_settings
from app.db.session import Base, engine
from app.db import models


def _cors_origins_list(settings) -> list:
    s = (getattr(settings, "cors_origins", None) or "").strip()
    return [x.strip() for x in s.split(",") if x.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist (important for SQLite and first Postgres run)
    import asyncio
    max_retries = 5
    retry_delay = 5
    
    db_ready = False
    for i in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            db_ready = True
            print(f"Database connection successful on attempt {i+1}")
            break
        except Exception as e:
            print(f"Database connection attempt {i+1} failed: {e}")
            if i < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print("Max retries reached. Database initialization failed.")

    # Seeding
    if db_ready:
        from app.db.session import AsyncSessionLocal
        from app.db.seed_training import seed_training_if_empty, seed_fake_history
        async with AsyncSessionLocal() as db:
            try:
                n = await seed_training_if_empty(db)
                if n: print(f"Seeded {n} exercises.")
                m = await seed_fake_history(db)
                if m: print(f"Seeded {m} history logs.")
            except Exception as e:
                print(f"Seed error: {e}")
    
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
