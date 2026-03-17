import logging
import hashlib
import asyncio
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import Source, Content, ContentChunk
from app.services.chunking import chunk_text
from app.services.parsers.registry import parse_source
from app.services.embeddings import get_embedding_model, embed_texts
from app.services.vector_store.qdrant_client import get_qdrant, ensure_collection, index_chunk

logger = logging.getLogger(__name__)

async def run_pipeline(db: AsyncSession, source_id: int):
    """Refactored async pipeline logic for content ingestion."""
    try:
        # 1. Start processing
        res = await db.execute(select(Source).filter(Source.id == source_id))
        src = res.scalar_one_or_none()
        if not src:
            logger.error(f"Source {source_id} not found")
            return
            
        src.status = "processing"
        await db.commit()
        
        try:
            # 2. Parsing (Run in thread if CPU bound, currently sync)
            result = parse_source(src, None) # db is unused in registry.py
            if not result or not result.get("clean_text"):
                src.status = "failed"
                src.error_code = result.get("error_code", "parse_empty") if result else "parse_empty"
                src.error_message = result.get("error_message", "No text extracted") if result else "No text extracted"
                await db.commit()
                return
                
            raw = result.get("raw_text", "")
            clean = result.get("clean_text", "")
            diagnostics = result.get("diagnostics", {})
            content_hash = hashlib.sha256(clean.encode()).hexdigest()
            src.content_hash = content_hash
            
            # 3. Save content
            res_content = await db.execute(select(Content).filter(Content.source_id == source_id))
            content = res_content.scalar_one_or_none()
            if not content:
                content = Content(source_id=source_id, raw_text=raw, clean_text=clean, parse_diagnostics=diagnostics)
                db.add(content)
            else:
                content.raw_text = raw
                content.clean_text = clean
                content.parse_diagnostics = diagnostics
            await db.commit()
            await db.refresh(content)
            
            # 4. Chunking
            chunks = chunk_text(clean, size=500, overlap=50)
            await db.execute(delete(ContentChunk).filter(ContentChunk.content_id == content.id))
            for i, text in enumerate(chunks):
                ch = ContentChunk(content_id=content.id, ordinal=i, text=text, token_count=len(text.split()))
                db.add(ch)
            await db.commit()
            
            # 5. Embedding
            res_chunks = await db.execute(select(ContentChunk).filter(ContentChunk.content_id == content.id).order_by(ContentChunk.ordinal))
            chunk_list = res_chunks.scalars().all()
            
            model = get_embedding_model()
            
            # Use cache for embeddings (Area 6)
            from app.cache import get_cached_embedding, set_cached_embedding
            
            vectors = [None] * len(chunk_list)
            texts_to_embed = []
            text_indices = []
            
            for i, ch in enumerate(chunk_list):
                text_hash = hashlib.sha256(ch.text.encode()).hexdigest()
                cached_vec = await get_cached_embedding(text_hash)
                if cached_vec:
                    vectors[i] = cached_vec
                else:
                    texts_to_embed.append(ch.text)
                    text_indices.append(i)
            
            if texts_to_embed:
                # Batch embedding (Area 6)
                new_vectors = embed_texts(model, texts_to_embed)
                for idx, vec in zip(text_indices, new_vectors):
                    vectors[idx] = vec
                    text_hash = hashlib.sha256(chunk_list[idx].text.encode()).hexdigest()
                    await set_cached_embedding(text_hash, vec)
            
            # 6. Indexing
            qdrant = get_qdrant()
            ensure_collection(qdrant)
            for vec, ch in zip(vectors, chunk_list):
                index_chunk(qdrant, ch.id, content.id, src.id, vec, ch.text, src.tipo, src.trust_score)
            
            src.status = "ready"
            await db.commit()
            logger.info(f"Pipeline completed successfully for source {source_id}")
            
        except Exception as e:
            logger.error(f"Pipeline error for source {source_id}: {e}", exc_info=True)
            src.status = "failed"
            src.error_code = "pipeline_error"
            src.error_message = str(e)[:2000]
            await db.commit()
            raise
    except Exception as e:
        logger.error(f"Outer pipeline error for source {source_id}: {e}", exc_info=True)
        raise
