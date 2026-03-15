from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import get_settings

settings = get_settings()

# --- Async Setup (FastAPI) with Connection Pooling ---
_is_sqlite = settings.async_database_url.startswith("sqlite")

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    # Connection pooling config (ignored for SQLite)
    **({} if _is_sqlite else {
        "pool_size": 10,           # Persistent connections
        "max_overflow": 20,        # Burst capacity
        "pool_pre_ping": True,     # Verify connections before use
        "pool_recycle": 1800,      # Recycle connections every 30 minutes
        "pool_timeout": 30,        # Wait max 30s for a connection
    })
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# --- Sync Setup (Celery Tasks & Scripts) ---
sync_url = settings.database_url
if sync_url.startswith("sqlite+aiosqlite:///"):
    sync_url = sync_url.replace("sqlite+aiosqlite:///", "sqlite:///")
elif sync_url.startswith("postgresql+asyncpg://"):
    sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql://")

engine_sync = create_engine(
    sync_url,
    **({} if _is_sqlite else {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    })
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_sync)

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)

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
