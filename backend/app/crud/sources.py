from sqlalchemy.orm import Session
from app.db.models import Source
from app.db.session import Base
from app.config import get_settings
import hashlib
import os
import uuid

from app.tasks.pipeline import run_pipeline


def create_source(db: Session, file=None, url=None, tipo=None, title=None, trust_score=7):
    url_or_path = None
    if url:
        url_or_path = url
    elif file:
        # Store under uploads with unique name; path is relative to app
        os.makedirs("uploads", exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1] or ".bin"
        path = f"uploads/{uuid.uuid4().hex}{ext}"
        with open(path, "wb") as f:
            f.write(file.file.read())
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
    db.commit()
    db.refresh(src)
    try:
        run_pipeline.delay(src.id)
    except Exception:
        # Redis/Celery unavailable: run pipeline in-process
        run_pipeline(src.id)
    return src


def list_sources(db: Session, skip=0, limit=50):
    return db.query(Source).order_by(Source.created_at.desc()).offset(skip).limit(limit).all()


def get_source(db: Session, source_id: int):
    return db.query(Source).filter(Source.id == source_id).first()
