from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import Insight
from app.schemas.insights import InsightCreate, InsightUpdate
from app.crud.base import _maybe_await

async def create_insight(db: AsyncSession, data: InsightCreate):
    insight = Insight(
        content_id=data.content_id,
        text=data.text[:2000],
        transferable_principle=data.transferable_principle,
        applicability_contexts=data.applicability_contexts or [],
        tipo="manual",
        session_intent=data.session_intent,
    )
    db.add(insight)
    await _maybe_await(db.commit())
    await _maybe_await(db.refresh(insight))
    return insight

async def list_insights(db: AsyncSession, content_id=None, skip=0, limit=100):
    stmt = select(Insight)
    if content_id is not None:
        stmt = stmt.filter(Insight.content_id == content_id)
    res = await _maybe_await(db.execute(stmt.order_by(Insight.created_at.desc()).offset(skip).limit(limit)))
    return res.scalars().all()

async def get_insight(db: AsyncSession, insight_id: int):
    res = await _maybe_await(db.execute(select(Insight).filter(Insight.id == insight_id)))
    return res.scalar_one_or_none()

async def update_insight(db: AsyncSession, insight_id: int, data: InsightUpdate):
    insight = await get_insight(db, insight_id)
    if not insight:
        return None
    if data.text is not None:
        insight.text = data.text[:2000]
    if data.transferable_principle is not None:
        insight.transferable_principle = data.transferable_principle
    if data.applicability_contexts is not None:
        insight.applicability_contexts = data.applicability_contexts
    if data.user_rating is not None:
        insight.user_rating = data.user_rating
    await _maybe_await(db.commit())
    await _maybe_await(db.refresh(insight))
    return insight

async def delete_insight(db: AsyncSession, insight_id: int):
    insight = await get_insight(db, insight_id)
    if insight:
        await _maybe_await(db.delete(insight))
        await _maybe_await(db.commit())
