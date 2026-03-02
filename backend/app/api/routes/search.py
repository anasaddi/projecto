from fastapi import APIRouter, Depends
from app import schemas, services

router = APIRouter()


@router.post("/semantic", response_model=schemas.SemanticSearchResult)
def semantic_search(query: schemas.SemanticSearchQuery):
    return services.search.semantic_search(query)
