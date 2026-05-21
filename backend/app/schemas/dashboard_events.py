"""PATCH contract: frontend sends camelCase aliases; repo reads snake_case fields."""
from typing import Any, Literal
from pydantic import BaseModel, Field


DashboardEventType = Literal[
    "toggle_habit",
    "toggle_prayer",
    "toggle_quick_task",
    "set_completion_log",
]


class DashboardEvent(BaseModel):
    type: DashboardEventType
    date: str | None = None
    habit_id: str | None = Field(None, alias="habitId")
    done: bool | None = None
    prayer_name: str | None = Field(None, alias="prayerName")
    completed: bool | None = None
    completed_at: str | None = Field(None, alias="completedAt")
    quick_task_id: str | None = Field(None, alias="quickTaskId")
    completion: dict[str, Any] | None = None

    model_config = {"populate_by_name": True}


class DashboardPatchRequest(BaseModel):
    events: list[DashboardEvent] = Field(..., min_length=1, max_length=32)
