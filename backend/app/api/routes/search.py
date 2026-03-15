from fastapi import APIRouter, Depends
from app import schemas, crud
from app.api.deps import get_current_admin

from app.services import search as search_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("/semantic")
def search_semantic(req: SearchRequest):
    return search_service.semantic_search(
        req.query, req.limit, req.intent, req.min_weight
    )
