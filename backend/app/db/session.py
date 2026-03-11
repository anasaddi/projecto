from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import get_settings

settings = get_settings()

# --- Async Setup (FastAPI) ---
engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# --- Sync Setup (Celery Tasks & Scripts) ---
# We use the standard database_url (without aiosqlite/asyncpg prefix if possible, 
# or handled in config)
sync_url = settings.database_url
if sync_url.startswith("sqlite+aiosqlite:///"):
    sync_url = sync_url.replace("sqlite+aiosqlite:///", "sqlite:///")
elif sync_url.startswith("postgresql+asyncpg://"):
    sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://")

engine_sync = create_engine(sync_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_sync)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
