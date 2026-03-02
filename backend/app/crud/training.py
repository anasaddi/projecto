from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import (
    Exercise,
    WorkoutDayTemplate,
    WorkoutDayExercise,
    WorkoutLog,
    SetLog,
)
from app.schemas.training import TemplateExerciseOut, SetLogItem


def get_today_template(db: Session, for_date: Optional[date] = None) -> Optional[WorkoutDayTemplate]:
    """Return the template for the given weekday (0=Monday .. 6=Sunday). Default: today. If none, returns first available (fallback)."""
    d = for_date or date.today()
    weekday = d.weekday()
    template = db.query(WorkoutDayTemplate).filter(WorkoutDayTemplate.weekday == weekday).first()
    if template:
        return template
    # Fallback: mostra comunque un template così la pagina non è vuota
    return db.query(WorkoutDayTemplate).order_by(WorkoutDayTemplate.id).first()


def get_today_exercises_grouped(db: Session, for_date: Optional[date] = None):
    """Returns (hypertrophy_exercises, strength_aw_exercises) for the frontend grid."""
    template = get_today_template(db, for_date)
    if not template:
        return [], []

    hypertrophy = []
    strength_aw = []
    for wde in template.exercises:
        ex = wde.exercise
        out = TemplateExerciseOut(
            exercise_id=ex.id,
            exercise_name=(wde.custom_name or ex.name),
            category=ex.category,
            instruction=wde.instruction,
            base_sets=wde.base_sets,
            base_reps=wde.base_reps,
            primary_muscles=ex.primary_muscles or [],
            secondary_muscles=ex.secondary_muscles or [],
            cns_fatigue=ex.cns_fatigue,
            joint_stress=ex.joint_stress or {},
        )
        if ex.category == "HYPERTROPHY":
            hypertrophy.append(out)
        else:
            strength_aw.append(out)

    return hypertrophy, strength_aw


def get_all_exercises(db: Session):
    """Return all exercises for the muscle-exercise matrix."""
    return db.query(Exercise).order_by(Exercise.category, Exercise.name).all()


def update_exercise_primary_muscles(db: Session, exercise_id: str, primary_muscles: list[str]) -> bool:
    """Update primary_muscles for an exercise."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        return False
    ex.primary_muscles = primary_muscles or []
    db.commit()
    return True


def get_week_templates(db: Session):
    """Returns all templates ordered by weekday."""
    templates = db.query(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday).all()
    week_data = []
    for tmpl in templates:
        exercises_out = []
        for wde in tmpl.exercises:
            ex = wde.exercise
            exercises_out.append(
                TemplateExerciseOut(
                    exercise_id=ex.id,
                    exercise_name=(wde.custom_name or ex.name),
                    category=ex.category,
                    instruction=wde.instruction,
                    base_sets=wde.base_sets,
                    base_reps=wde.base_reps,
                    primary_muscles=ex.primary_muscles or [],
                    secondary_muscles=ex.secondary_muscles or [],
                    cns_fatigue=ex.cns_fatigue,
                    joint_stress=ex.joint_stress or {},
                )
            )
        week_data.append({
            "template_id": tmpl.id,
            "day_name": tmpl.day_name,
            "weekday": tmpl.weekday,
            "exercises": exercises_out
        })
    return week_data

def update_day_exercise(
    db: Session,
    template_id: str,
    exercise_id: str,
    custom_name: str | None = None,
    instruction: str | None = None,
    base_sets: int | None = None,
    base_reps: int | None = None,
) -> bool:
    """Update custom_name/instruction/base_sets/base_reps for an exercise in a day template."""
    wde = (
        db.query(WorkoutDayExercise)
        .filter(
            WorkoutDayExercise.template_id == template_id,
            WorkoutDayExercise.exercise_id == exercise_id,
        )
        .first()
    )
    if not wde:
        return False
    if custom_name is not None:
        wde.custom_name = custom_name.strip() or None
    if instruction is not None:
        wde.instruction = instruction
    if base_sets is not None:
        wde.base_sets = base_sets
    if base_reps is not None:
        wde.base_reps = base_reps
    db.commit()
    return True


def update_week_templates(db: Session, updates: list):
    """Updates the exercises for each template, preserving custom_name/instruction/base_sets/base_reps."""
    for update in updates:
        template_id = update.template_id
        db.query(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == template_id).delete()
        for ordinal, item in enumerate(update.exercises):
            ex = db.query(Exercise).filter(Exercise.id == item.exercise_id).first()
            default_sets = 2 if ex and ex.category == "HYPERTROPHY" else 4
            base_sets = item.base_sets if item.base_sets is not None else default_sets
            db.add(WorkoutDayExercise(
                template_id=template_id,
                exercise_id=item.exercise_id,
                ordinal=ordinal,
                custom_name=None if item.custom_name is None else (item.custom_name.strip() or None),
                instruction=item.instruction,
                base_sets=base_sets,
                base_reps=item.base_reps,
            ))
    db.commit()


def get_exercise_history(db: Session, exercise_id: str, limit: int = 20):
    """Return past workout entries for an exercise, one per session (date)."""
    from sqlalchemy import func
    from app.schemas.training import ExerciseHistoryEntry

    rows = (
        db.query(
            func.date(WorkoutLog.logged_at).label("log_date"),
            SetLog.weight_kg,
            SetLog.reps,
            SetLog.completed,
        )
        .join(SetLog, SetLog.workout_log_id == WorkoutLog.id)
        .filter(SetLog.exercise_id == exercise_id)
        .order_by(WorkoutLog.logged_at.desc())
        .all()
    )
    seen = set()
    entries = []
    for r in rows:
        d = r.log_date.isoformat() if hasattr(r.log_date, "isoformat") else str(r.log_date)
        if d in seen:
            continue
        seen.add(d)
        entries.append(
            ExerciseHistoryEntry(
                date=d,
                weight_kg=r.weight_kg,
                reps=r.reps,
                completed=bool(r.completed),
            )
        )
        if len(entries) >= limit:
            break
    return {"exercise_id": exercise_id, "entries": entries}


def create_workout_log(db: Session, template_id: str | None, sets: list[SetLogItem]) -> WorkoutLog:
    log = WorkoutLog(template_id=template_id, logged_at=datetime.now(timezone.utc))
    db.add(log)
    db.flush()
    for s in sets:
        db.add(SetLog(
            workout_log_id=log.id,
            exercise_id=s.exercise_id,
            set_number=s.set_number,
            weight_kg=s.weight_kg,
            reps=s.reps,
            completed=1 if s.completed else 0,
        ))
    db.commit()
    db.refresh(log)
    return log
