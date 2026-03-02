from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Source, Content, ContentChunk
from app.services.chunking import chunk_text
from app.services.parsers.registry import parse_source
from app.services.embeddings import get_embedding_model, embed_texts
from app.services.vector_store.qdrant_client import get_qdrant, ensure_collection, index_chunk
import hashlib


@celery_app.task(bind=True, max_retries=3)
def run_pipeline(self, source_id: int):
    db = SessionLocal()
    try:
        src = db.query(Source).filter(Source.id == source_id).first()
        if not src:
            return
        src.status = "processing"
        db.commit()
        try:
            result = parse_source(src, db)
            if not result or not result.get("clean_text"):
                src.status = "failed"
                src.error_code = result.get("error_code", "parse_empty")
                src.error_message = result.get("error_message", "No text extracted")
                db.commit()
                return
            raw = result.get("raw_text", "")
            clean = result.get("clean_text", "")
            diagnostics = result.get("diagnostics", {})
            content_hash = hashlib.sha256(clean.encode()).hexdigest()
            src.content_hash = content_hash
            content = db.query(Content).filter(Content.source_id == source_id).first()
            if not content:
                content = Content(source_id=source_id, raw_text=raw, clean_text=clean, parse_diagnostics=diagnostics)
                db.add(content)
            else:
                content.raw_text = raw
                content.clean_text = clean
                content.parse_diagnostics = diagnostics
            db.commit()
            db.refresh(content)
            chunks = chunk_text(clean, size=500, overlap=50)
            # Clear old chunks
            db.query(ContentChunk).filter(ContentChunk.content_id == content.id).delete()
            for i, text in enumerate(chunks):
                ch = ContentChunk(content_id=content.id, ordinal=i, text=text, token_count=len(text.split()))
                db.add(ch)
            db.commit()
            db.refresh(content)
            chunk_list = db.query(ContentChunk).filter(ContentChunk.content_id == content.id).order_by(ContentChunk.ordinal).all()
            model = get_embedding_model()
            texts = [c.text for c in chunk_list]
            vectors = embed_texts(model, texts)
            qdrant = get_qdrant()
            ensure_collection(qdrant)
            for i, (vec, ch) in enumerate(zip(vectors, chunk_list)):
                index_chunk(qdrant, ch.id, content.id, src.id, vec, ch.text, src.tipo, src.trust_score)
            src.status = "ready"
            db.commit()
        except Exception as e:
            src.status = "failed"
            src.error_code = "pipeline_error"
            src.error_message = str(e)[:2000]
            db.commit()
            raise
    finally:
        db.close()
