from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum, JSON, Index
from sqlalchemy.orm import relationship, backref
from app.db.session import Base
import enum


class SourceType(str, enum.Enum):
    video = "video"
    audio = "audio"
    pdf = "pdf"
    article = "article"
    note = "note"


class SourceStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class SessionIntent(str, enum.Enum):
    deep_dive = "deep_dive"
    fact_checking = "fact_checking"
    skimming = "skimming"
    auto = "auto"


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(32), nullable=False)
    url_or_path = Column(String(2048), nullable=True, index=True)
    title = Column(String(512), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    trust_score = Column(Integer, default=7, nullable=False)
    status = Column(String(32), default=SourceStatus.pending.value, nullable=False)
    content_hash = Column(String(64), nullable=True, index=True)
    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    content = relationship("Content", back_populates="source", uselist=False)
    sessions = relationship("Session", back_populates="source")


class Content(Base):
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False, index=True)
    raw_text = Column(Text, nullable=True)
    clean_text = Column(Text, nullable=True)
    parse_diagnostics = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    source = relationship("Source", back_populates="content")
    chunks = relationship("ContentChunk", back_populates="content", order_by="ContentChunk.ordinal")
    insights = relationship("Insight", back_populates="content")


class ContentChunk(Base):
    __tablename__ = "content_chunks"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False, index=True)
    ordinal = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    content = relationship("Content", back_populates="chunks")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True, index=True)
    intent = Column(String(32), default=SessionIntent.auto.value, nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)

    source = relationship("Source", back_populates="sessions")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    transferable_principle = Column(Text, nullable=True)
    applicability_contexts = Column(JSON, nullable=True, default=list)
    tipo = Column(String(32), default="manual", nullable=False)
    session_intent = Column(String(32), nullable=True)
    user_rating = Column(String(32), nullable=True)
    weight = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    content = relationship("Content", back_populates="insights")


class TrainingProgression(Base):
    __tablename__ = "training_progressions"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(String(32), ForeignKey("exercises.id"), nullable=False, index=True)
    # Blob JSON per tmAnas, tmFlavio, tmByMonth, dataByMonth
    data = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    exercise = relationship("Exercise")


class DailySchedule(Base):
    __tablename__ = "daily_schedules"

    id = Column(Integer, primary_key=True, index=True)
    date_ = Column("date", DateTime(timezone=True), nullable=False, index=True, unique=True)
    template_id = Column(String(64), ForeignKey("workout_day_templates.id"), nullable=True)
    is_completed = Column(Integer, default=0, nullable=False)  # 1 = completed, 0 = pending
    
    template = relationship("WorkoutDayTemplate")


# --- Training (Powerbuilding + AW + Hypertrophy) ---

class ExerciseCategory(str, enum.Enum):
    STRENGTH = "STRENGTH"
    AW = "AW"
    HYPERTROPHY = "HYPERTROPHY"


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String(32), primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    category = Column(String(32), nullable=False)  # STRENGTH | AW | HYPERTROPHY
    primary_muscles = Column(JSON, nullable=True, default=list)  # ["quads", "glutes"]
    secondary_muscles = Column(JSON, nullable=True, default=list)
    cns_fatigue = Column(Float, default=0.0, nullable=False)
    joint_stress = Column(JSON, nullable=True, default=dict)  # { "elbow": 0.6, "wrist": 0.5, ... }
    is_active = Column(Integer, default=1, nullable=False)  # 1 = active, 0 = disabled

    template_exercises = relationship("WorkoutDayExercise", back_populates="exercise")
    set_logs = relationship("SetLog", back_populates="exercise")


class WorkoutDayTemplate(Base):
    __tablename__ = "workout_day_templates"

    id = Column(String(64), primary_key=True, index=True)
    day_name = Column(String(256), nullable=False)
    weekday = Column(Integer, nullable=True, index=True)  # 0=Monday .. 6=Sunday (Python convention)

    exercises = relationship("WorkoutDayExercise", back_populates="template", order_by="WorkoutDayExercise.ordinal")
    workout_logs = relationship("WorkoutLog", back_populates="template")


class WorkoutDayExercise(Base):
    __tablename__ = "workout_day_exercises"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String(64), ForeignKey("workout_day_templates.id"), nullable=False, index=True)
    exercise_id = Column(String(32), ForeignKey("exercises.id"), nullable=False, index=True)
    base_sets = Column(Integer, default=4, nullable=False)
    base_reps = Column(Integer, nullable=True)
    instruction = Column(String(512), nullable=True)
    custom_name = Column(String(256), nullable=True)  # Override display name for this day
    ordinal = Column(Integer, default=0, nullable=False)

    template = relationship("WorkoutDayTemplate", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="template_exercises")

    __table_args__ = (
        Index("idx_workout_day_exercises_tmpl_ordinal", "template_id", "ordinal"),
    )


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String(64), ForeignKey("workout_day_templates.id"), nullable=True, index=True)
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    template = relationship("WorkoutDayTemplate", back_populates="workout_logs")
    sets = relationship("SetLog", back_populates="workout_log", order_by="SetLog.id")


class SetLog(Base):
    __tablename__ = "set_logs"

    id = Column(Integer, primary_key=True, index=True)
    workout_log_id = Column(Integer, ForeignKey("workout_logs.id"), nullable=False, index=True)
    exercise_id = Column(String(32), ForeignKey("exercises.id"), nullable=False, index=True)
    set_number = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    completed = Column(Integer, default=1, nullable=False)  # 1 = done, 0 = skipped

    workout_log = relationship("WorkoutLog", back_populates="sets")
    exercise = relationship("Exercise", back_populates="set_logs")


# --- Dashboard & Habits ---

# --- Dashboard & Habits (Relational Refactor) ---

class Habit(Base):
    __tablename__ = "habits"
    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    locked = Column(Integer, default=0) # 0 = unlocked, 1 = locked
    ordinal = Column(Integer, default=0)

class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(String(64), ForeignKey("habits.id"), nullable=False)
    date = Column(String(10), nullable=False, index=True) # YYYY-MM-DD
    status = Column(Integer, default=0) # 0 = not done, 1 = done

    __table_args__ = (
        Index("idx_habit_logs_habit_date", "habit_id", "date"),
    )

class Project(Base):
    __tablename__ = "projects"
    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    # Se share_id è presente, il progetto è condiviso
    share_id = Column(String(64), ForeignKey("shared_dashboards.share_id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey("projects.id"), nullable=False, index=True)
    parent_id = Column(String(64), ForeignKey("tasks.id"), nullable=True)
    title = Column(String(512), nullable=False)
    done = Column(Integer, default=0)
    deadline = Column(String(10), nullable=True) # YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="tasks")
    children = relationship("Task", backref=backref("parent", remote_side=[id]), cascade="all, delete-orphan", single_parent=True)

    __table_args__ = (
        Index("idx_tasks_project_parent", "project_id", "parent_id"),
    )

class QuickTask(Base):
    __tablename__ = "quick_tasks"
    id = Column(String(64), primary_key=True)
    title = Column(String(512), nullable=False)
    done = Column(Integer, default=0)
    deadline = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String(64), primary_key=True)
    share_id = Column(String(64), ForeignKey("shared_dashboards.share_id"), nullable=False, index=True)
    sender_id = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class DashboardState(Base):
    __tablename__ = "dashboard_states"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class SharedDashboard(Base):
    __tablename__ = "shared_dashboards"
    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False, default="Progetti Condivisi")
    data = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    projects = relationship("Project", backref="shared_dashboard")


class DailyReadiness(Base):
    __tablename__ = "daily_readiness"

    id = Column(Integer, primary_key=True, index=True)
    date_ = Column("date", DateTime, nullable=False, index=True)  # date only, stored as datetime at midnight
    cns_fatigue = Column(Float, nullable=True)  # 1-10 scale
    muscle_doms = Column(JSON, nullable=True, default=dict)  # { "quads": 5, "chest": 2 }
    joint_pain = Column(JSON, nullable=True, default=dict)  # { "elbow": 7, "wrist": 3 }

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
