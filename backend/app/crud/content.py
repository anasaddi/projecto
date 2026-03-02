from sqlalchemy.orm import Session
from app.db.models import Content


def get_content_by_source(db: Session, source_id: int):
    return db.query(Content).filter(Content.source_id == source_id).first()


def get_content(db: Session, content_id: int):
    return db.query(Content).filter(Content.id == content_id).first()
