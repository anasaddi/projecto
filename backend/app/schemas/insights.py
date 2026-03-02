from pydantic import BaseModel
from datetime import datetime


class InsightCreate(BaseModel):
    content_id: int
    text: str
    transferable_principle: str | None = None
    applicability_contexts: list[str] | None = None
    session_intent: str | None = None


class InsightUpdate(BaseModel):
    text: str | None = None
    transferable_principle: str | None = None
    applicability_contexts: list[str] | None = None
    user_rating: str | None = None


class InsightOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    content_id: int
    text: str
    transferable_principle: str | None
    applicability_contexts: list | None = None
    tipo: str
    session_intent: str | None
    user_rating: str | None
    weight: float
    created_at: datetime
