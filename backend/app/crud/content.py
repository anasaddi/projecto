from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Content

async def get_content_by_source(db: AsyncSession, source_id: int):
    res = await db.execute(select(Content).filter(Content.source_id == source_id))
    return res.scalar_one_or_none()

async def get_content(db: AsyncSession, content_id: int):
    res = await db.execute(select(Content).filter(Content.id == content_id))
    return res.scalar_one_or_none()
