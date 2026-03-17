from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import json
import hashlib
from app import schemas
from app.api.deps import get_current_admin
from app.services import search as search_service
from app.schemas.search import SemanticSearchQuery
from app.cache import get_cached_search_results, set_cached_search_results

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("/semantic")
async def search_semantic(req: SemanticSearchQuery):
    """Semantic search with Redis caching."""
    query_str = f"{req.query}:{req.limit}:{req.intent}:{req.min_weight}"
    query_hash = hashlib.sha256(query_str.encode()).hexdigest()
    
    cached = await get_cached_search_results(query_hash)
    if cached:
        return cached
        
    results = search_service.semantic_search(req)
    await set_cached_search_results(query_hash, results.model_dump())
    return results


@router.post("/semantic/stream")
async def search_semantic_stream(req: SemanticSearchQuery):
    """Streaming semantic search results (NDJSON)."""
    results = search_service.semantic_search(req)
    
    async def generator():
        for hit in results.hits:
            yield json.dumps(hit.model_dump()) + "\n"
            
    return StreamingResponse(generator(), media_type="application/x-ndjson")
