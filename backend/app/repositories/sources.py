from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete
from app.db.models import Source
from app.repositories.base import _maybe_await
import os
import uuid
import aiofiles
from app.tasks.pipeline import run_pipeline

async def create_source(db: AsyncSession, file=None, url=None, tipo=None, title=None, trust_score=7):
    url_or_path = None
    if url:
        url_or_path = url
    elif file:
        os.makedirs("uploads", exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1] or ".bin"
        path = f"uploads/{uuid.uuid4().hex}{ext}"
        async with aiofiles.open(path, "wb") as f:
            content = await file.read()
            await f.write(content)
        url_or_path = path
    
    title = title or (file.filename if file else url or "Untitled")
    src = Source(
        tipo=tipo or "note",
        url_or_path=url_or_path,
        title=title,
        trust_score=min(10, max(1, trust_score)),
        status="pending",
    )
    db.add(src)
    await _maybe_await(db.commit())
    await _maybe_await(db.refresh(src))
    
    try:
        run_pipeline.delay(src.id)
    except Exception:
        # Run sync in thread if celery is down
        run_pipeline(src.id)
    return src

async def list_sources(db: AsyncSession, skip=0, limit=50):
    res = await _maybe_await(db.execute(select(Source).order_by(Source.created_at.desc()).offset(skip).limit(limit)))
    return res.scalars().all()

async def get_source(db: AsyncSession, source_id: int):
    res = await _maybe_await(db.execute(select(Source).filter(Source.id == source_id)))
    return res.scalar_one_or_none()
