from fastapi import APIRouter, Depends
from app import schemas, crud
from app.api.deps import get_current_admin

from app.services import search as search_service

from app.schemas.search import SemanticSearchQuery

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("/semantic")
def search_semantic(req: SemanticSearchQuery):
    return search_service.semantic_search(
        req.query, req.limit, req.intent, req.min_weight
    )
