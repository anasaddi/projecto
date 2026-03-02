from app.schemas.search import SemanticSearchQuery, SemanticSearchResult, SearchHit
from app.services.embeddings import get_embedding_model, embed_texts
from app.services.vector_store.qdrant_client import get_qdrant, search_similar


def semantic_search(query: SemanticSearchQuery) -> SemanticSearchResult:
    try:
        model = get_embedding_model()
        qvec = embed_texts(model, [query.query])[0]
        qdrant = get_qdrant()
        hits = search_similar(qdrant, qvec, limit=query.limit, intent=query.intent, min_weight=query.min_weight)
        return SemanticSearchResult(
            hits=[
                SearchHit(
                    chunk_id=h["chunk_id"],
                    content_id=h["content_id"],
                    source_id=h["source_id"],
                    text=h["text"],
                    score=h["score"],
                    tipo=h.get("tipo"),
                    trust_score=h.get("trust_score"),
                )
                for h in hits
            ]
        )
    except Exception:
        return SemanticSearchResult(hits=[])
