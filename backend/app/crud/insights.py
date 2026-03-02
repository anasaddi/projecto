from sqlalchemy.orm import Session
from app.db.models import Insight
from app.schemas.insights import InsightCreate, InsightUpdate


def create_insight(db: Session, data: InsightCreate):
    insight = Insight(
        content_id=data.content_id,
        text=data.text[:2000],
        transferable_principle=data.transferable_principle,
        applicability_contexts=data.applicability_contexts or [],
        tipo="manual",
        session_intent=data.session_intent,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


def list_insights(db: Session, content_id=None, skip=0, limit=100):
    q = db.query(Insight)
    if content_id is not None:
        q = q.filter(Insight.content_id == content_id)
    return q.order_by(Insight.created_at.desc()).offset(skip).limit(limit).all()


def get_insight(db: Session, insight_id: int):
    return db.query(Insight).filter(Insight.id == insight_id).first()


def update_insight(db: Session, insight_id: int, data: InsightUpdate):
    insight = get_insight(db, insight_id)
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
    db.commit()
    db.refresh(insight)
    return insight


def delete_insight(db: Session, insight_id: int):
    insight = get_insight(db, insight_id)
    if insight:
        db.delete(insight)
        db.commit()
