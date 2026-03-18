"""
Rigorous Pydantic models for dashboard state.
Use for validation of API payloads and for typing the JSON stored in DashboardState.data.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# --- Task node (shared by projects and life-goal tasks) ---
class TaskNode(BaseModel):
    id: str
    title: str
    done: bool = False
    children: list["TaskNode"] = Field(default_factory=list)
    deadline: Optional[str] = None


TaskNode.model_rebuild()


# --- Habits ---
class DailyTaskTemplate(BaseModel):
    id: str
    title: str
    locked: bool = False
    ordinal: int = 0
    in_timeline: Optional[bool] = Field(None, alias="inTimeline")  # None/true = show in Daily Timeline

    model_config = {"populate_by_name": True}


class DailyTaskLogEntry(BaseModel):
    id: str
    done: bool = True


# --- Projects ---
class Project(BaseModel):
    id: str
    title: str
    active: bool = True
    tasks: list[TaskNode] = Field(default_factory=list)
    deadline: Optional[str] = None
    ordinal: int = 0
    life_goal_id: Optional[str] = Field(None, alias="lifeGoalId")
    # Allow lifeGoalId from frontend camelCase
    model_config = {"populate_by_name": True}


# --- Quick tasks ---
class QuickTask(BaseModel):
    id: str
    title: str
    done: bool = False
    deadline: Optional[str] = None
    parent_id: Optional[str] = Field(None, alias="parentId")
    life_goal_id: Optional[str] = Field(None, alias="lifeGoalId")
    ordinal: Optional[int] = None
    model_config = {"populate_by_name": True}


# --- Top 3 slot ---
class Top3Slot(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId")
    task_id: Optional[str] = Field(None, alias="taskId")
    quick_task_id: Optional[str] = Field(None, alias="quickTaskId")
    share_id: Optional[str] = Field(None, alias="shareId")
    title: Optional[str] = None
    done: Optional[bool] = None
    model_config = {"populate_by_name": True}


# --- Life goals ---
class LifeGoal(BaseModel):
    id: str
    title: str
    category: str = ""
    type: Literal["quick", "project"] = "quick"
    done: bool = False
    deadline: Optional[str] = None
    tasks: list[TaskNode] = Field(default_factory=list)
    ordinal: int = 0


class LifeGoalTier(BaseModel):
    id: str
    name: str
    emoji: str = ""
    color: str = ""
    collapsed: bool = False
    goals: list[LifeGoal] = Field(default_factory=list)


class LifeGoalsPayload(BaseModel):
    collapsed: bool = False
    tiers: list[LifeGoalTier] = Field(default_factory=list)


# --- Timeline / completion log ---
class TimelineEvent(BaseModel):
    id: str
    title: str
    type: Literal["habit", "quick", "project", "shared_quick"] = "habit"
    timestamp: int  # ms
    slot_key: Optional[str] = Field(None, alias="slotKey")
    project_name: Optional[str] = Field(None, alias="projectName")
    model_config = {"populate_by_name": True}


class DayCompletionPayload(BaseModel):
    quick: list[str] = Field(default_factory=list)  # quick task ids
    project: list[str] = Field(default_factory=list)  # "projectId:taskId"
    events: list[TimelineEvent] = Field(default_factory=list)


class TimelineRoutineItem(BaseModel):
    id: str
    habit_id: str = Field(alias="habitId")
    done: bool = False
    model_config = {"populate_by_name": True}


# --- Full dashboard state (payload inside DashboardState.data) ---
class DashboardStatePayload(BaseModel):
    """Validates the nested structure of dashboard state stored as JSON."""
    daily_task_templates: list[DailyTaskTemplate] = Field(
        default_factory=list, alias="dailyTaskTemplates"
    )
    daily_task_logs: dict[str, list[DailyTaskLogEntry]] = Field(
        default_factory=dict, alias="dailyTaskLogs"
    )
    projects: list[Project] = Field(default_factory=list)
    prayer_logs: dict[str, dict[str, bool]] = Field(
        default_factory=dict, alias="prayerLogs"
    )
    top3_manual: list[Optional[Top3Slot]] = Field(
        default_factory=lambda: [None, None, None], alias="top3Manual"
    )
    quick_tasks: list[QuickTask] = Field(default_factory=list, alias="quickTasks")
    daily_completion_log: dict[str, DayCompletionPayload] = Field(
        default_factory=dict, alias="dailyCompletionLog"
    )
    life_goals: LifeGoalsPayload = Field(default_factory=LifeGoalsPayload, alias="lifeGoals")
    timeline_routines: dict[str, dict[str, list[TimelineRoutineItem]]] = Field(
        default_factory=dict, alias="timelineRoutines"
    )
    timeline_panel_expanded: bool = Field(True, alias="timelinePanelExpanded")

    model_config = {"populate_by_name": True, "extra": "allow"}


def validate_dashboard_data(data: dict[str, Any]) -> DashboardStatePayload:
    """Validate and coerce dashboard state blob from API/DB."""
    return DashboardStatePayload.model_validate(data)
