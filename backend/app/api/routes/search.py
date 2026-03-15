from fastapi import APIRouter, Depends
from app import schemas, crud
from app.api.deps import get_current_admin

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.post("/semantic", response_model=schemas.SemanticSearchResult)
def semantic_search(query: schemas.SemanticSearchQuery):
    return services.search.semantic_search(query)
