from pydantic import BaseModel


class SemanticSearchQuery(BaseModel):
    query: str
    limit: int = 10
    intent: str | None = None
    min_weight: float = 0.3


class SearchHit(BaseModel):
    chunk_id: int
    content_id: int
    source_id: int
    text: str
    score: float
    tipo: str | None = None
    trust_score: int | None = None


class SemanticSearchResult(BaseModel):
    hits: list[SearchHit]
