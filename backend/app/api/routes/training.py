import json
from pathlib import Path
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app import schemas
from app.crud import training as crud_training

router = APIRouter()


@router.get("/exercises", response_model=list[schemas.ExerciseOut])
def get_exercises(db: Session = Depends(get_db)):
    """List all exercises for the muscle-exercise matrix."""
    exercises = crud_training.get_all_exercises(db)
    return [schemas.ExerciseOut.model_validate(ex) for ex in exercises]


_AW_PROGRAM_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "aw_training_program.json"


@router.get("/aw-program")
def get_aw_program():
    """Return AW training program data (max_day, light, heavy, speed) from aw_training_program.json."""
    if not _AW_PROGRAM_PATH.exists():
        return {}
    try:
        return json.loads(_AW_PROGRAM_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


@router.get("/today", response_model=schemas.TodayResponse)
def get_today(db: Session = Depends(get_db), for_date: Optional[date] = None):
    """Fetch the template for today (or for_date). Exercises grouped as hypertrophy_exercises and strength_aw_exercises for the React grid. If no template for today, returns first available (fallback)."""
    from datetime import date as date_type
    target = for_date or date_type.today()
    template = crud_training.get_today_template(db, for_date)
    if not template:
        return schemas.TodayResponse(
            template_id="",
            day_name="Nessun template per oggi",
            hypertrophy_exercises=[],
            strength_aw_exercises=[],
        )
    hyp, strength_aw = crud_training.get_today_exercises_grouped(db, for_date)
    is_fallback = template.weekday is not None and template.weekday != target.weekday()
    return schemas.TodayResponse(
        template_id=template.id,
        day_name=template.day_name,
        hypertrophy_exercises=hyp,
        strength_aw_exercises=strength_aw,
        is_fallback=is_fallback,
    )


@router.get("/week", response_model=list[schemas.WeekDayData])
def get_week(db: Session = Depends(get_db)):
    """Fetch the full week's templates for the drag & drop calendar."""
    return crud_training.get_week_templates(db)

@router.put("/week", response_model=dict)
def update_week(body: schemas.WeekUpdateRequest, db: Session = Depends(get_db)):
    """Update the full week's exercises."""
    crud_training.update_week_templates(db, body.days)
    return {"status": "ok"}


@router.patch("/day-exercise", response_model=dict)
def update_day_exercise(body: schemas.DayExerciseUpdate, db: Session = Depends(get_db)):
    """Update instruction/base_sets/base_reps for an exercise in a day template."""
    ok = crud_training.update_day_exercise(
        db,
        template_id=body.template_id,
        exercise_id=body.exercise_id,
        custom_name=body.custom_name,
        instruction=body.instruction,
        base_sets=body.base_sets,
        base_reps=body.base_reps,
    )
    return {"status": "ok" if ok else "not_found"}

@router.get("/history", response_model=schemas.ExerciseHistoryResponse)
def get_exercise_history_route(
    exercise_id: str,
    limit: int = 15,
    db: Session = Depends(get_db),
):
    """Get workout history for an exercise (past sessions with weight/reps)."""
    return crud_training.get_exercise_history(db, exercise_id, limit=limit)


@router.post("/log", response_model=schemas.WorkoutLogOut)
def log_workout(body: schemas.WorkoutLogCreate, db: Session = Depends(get_db)):
    """Receive completed sets from the React ExerciseTable and save them."""
    log = crud_training.create_workout_log(db, body.template_id, body.sets)
    return log


@router.post("/recommendation", response_model=schemas.RecommendationResponse)
def recommendation(body: schemas.RecommendationRequest, db: Session = Depends(get_db)):
    """
    Dummy endpoint for future recommendation logic using joint_stress and DailyReadiness.
    When implemented:
    - If User DailyReadiness joint_pain (e.g. elbow) > 7, filter out templates where
      sum(exercise.joint_stress.elbow) for that day > threshold (e.g. 1.5).
    - Similarly use cns_fatigue to avoid stacking too many high-CNS exercises.
    """
    # Dummy: just return first available template for the requested date
    target = body.date or date.today()
    template = crud_training.get_today_template(db, target)
    if template:
        return schemas.RecommendationResponse(
            message="Placeholder: recommendation will use joint_stress and DailyReadiness to filter templates.",
            recommended_template_id=template.id,
        )
    return schemas.RecommendationResponse(
        message="No template for this day.",
        recommended_template_id=None,
    )
