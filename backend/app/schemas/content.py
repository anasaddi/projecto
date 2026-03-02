from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    raw_text: str | None
    clean_text: str | None
    parse_diagnostics: dict | None = None
    created_at: datetime
