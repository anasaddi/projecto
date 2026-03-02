from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class JointStress(BaseModel):
    knees: float = 0.0
    lower_back: float = 0.0
    elbow: float = 0.0
    wrist: float = 0.0
    shoulder: float = 0.0


class ExerciseBase(BaseModel):
    name: str
    category: str  # STRENGTH | AW | HYPERTROPHY
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    cns_fatigue: float = 0.0
    joint_stress: dict = Field(default_factory=dict)


class ExerciseCreate(ExerciseBase):
    id: str


class ExerciseOut(ExerciseBase):
    id: str

    class Config:
        from_attributes = True


# --- Template & day ---

class WorkoutDayExerciseItem(BaseModel):
    exercise_id: str
    instruction: Optional[str] = None
    base_sets: int = 4
    base_reps: Optional[int] = None


class TemplateExerciseOut(BaseModel):
    exercise_id: str
    exercise_name: str
    category: str
    instruction: Optional[str] = None
    base_sets: int
    base_reps: Optional[int] = None
    primary_muscles: list[str] = []
    secondary_muscles: list[str] = []
    cns_fatigue: float = 0.0
    joint_stress: dict = {}

    class Config:
        from_attributes = True


class TodayResponse(BaseModel):
    template_id: str
    day_name: str
    hypertrophy_exercises: list[TemplateExerciseOut] = []
    strength_aw_exercises: list[TemplateExerciseOut] = []
    is_fallback: bool = False  # True se oggi non è il giorno previsto per questo template


class WeekDayData(BaseModel):
    template_id: str
    day_name: str
    weekday: int
    exercises: list[TemplateExerciseOut] = []

    class Config:
        from_attributes = True


class DayExerciseItem(BaseModel):
    """Single exercise in a week day update (preserves custom_name, instruction, etc.)."""
    exercise_id: str
    custom_name: Optional[str] = None
    instruction: Optional[str] = None
    base_sets: Optional[int] = None
    base_reps: Optional[int] = None


class WeekDayUpdateData(BaseModel):
    template_id: str
    exercises: list[DayExerciseItem]


class WeekUpdateRequest(BaseModel):
    days: list[WeekDayUpdateData]


class DayExerciseUpdate(BaseModel):
    template_id: str
    exercise_id: str
    custom_name: Optional[str] = None
    instruction: Optional[str] = None
    base_sets: Optional[int] = None
    base_reps: Optional[int] = None


class ExercisePrimaryMusclesUpdate(BaseModel):
    primary_muscles: list[str] = []


# --- Log ---

class SetLogItem(BaseModel):
    exercise_id: str
    set_number: int
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    completed: bool = True


class WorkoutLogCreate(BaseModel):
    template_id: Optional[str] = None
    sets: list[SetLogItem]


class WorkoutLogOut(BaseModel):
    id: int
    template_id: Optional[str] = None
    logged_at: datetime

    class Config:
        from_attributes = True


class ExerciseHistoryEntry(BaseModel):
    date: str
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    completed: bool = True


class ExerciseHistoryResponse(BaseModel):
    exercise_id: str
    entries: list[ExerciseHistoryEntry] = []


# --- Recommendation (dummy) ---

class RecommendationRequest(BaseModel):
    date: Optional[date] = None
    cns_fatigue: Optional[float] = None  # 1-10
    joint_pain: Optional[dict[str, float]] = None  # e.g. {"elbow": 7, "wrist": 3}


class RecommendationResponse(BaseModel):
    message: str
    recommended_template_id: Optional[str] = None
