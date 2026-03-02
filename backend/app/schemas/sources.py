from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class SourceBase(BaseModel):
    tipo: str
    title: str | None = None
    trust_score: int = 7


class SourceCreate(SourceBase):
    url_or_path: str | None = None


class SourceOut(SourceBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    url_or_path: str | None
    metadata: dict | None = Field(None, alias="metadata_")
    status: str
    content_hash: str | None
    error_code: str | None
    error_message: str | None
    created_at: datetime
