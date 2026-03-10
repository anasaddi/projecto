import json
from pathlib import Path
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db.session import get_db
from app import schemas
from app.crud import training as crud_training

router = APIRouter()

# --- Security Dependency ---
def check_admin_access(x_km_access: Optional[str] = Header(None)):
    """Simple header check to block unauthorized access to private routes."""
    # 'master-key' è la chiave predefinita per Anas. Il "friend" non la avrà.
    if x_km_access != "master-key":
        raise HTTPException(status_code=403, detail="Accesso negato: sezione privata.")
    return True

@router.get("/ping")
def ping(db: Session = Depends(get_db)):
    from app.db.models import Exercise, WorkoutDayTemplate, DailySchedule
    ex_count = db.query(Exercise).count()
    tmpl_count = db.query(WorkoutDayTemplate).count()
    sched_count = db.query(DailySchedule).count()
    return {
        "status": "pong",
        "db_stats": {
            "exercises": ex_count,
            "templates": tmpl_count,
            "schedule_entries": sched_count
        }
    }

@router.post("/reseed", dependencies=[Depends(check_admin_access)])
def reseed_db(db: Session = Depends(get_db)):
    """Force re-seeding of training data."""
    from app.db.seed_training import seed_training_if_empty
    from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise
    
    # Pulizia cauta (solo se vuoi forzare)
    # db.query(WorkoutDayExercise).delete()
    # db.query(WorkoutDayTemplate).delete()
    # db.query(Exercise).delete()
    # db.commit()
    
    n = seed_training_if_empty(db)
    return {"status": "ok", "seeded": n}

@router.get("/exercises", response_model=list[schemas.ExerciseOut])
def get_exercises(db: Session = Depends(get_db)):
    """Public route for the muscle-exercise matrix."""
    exercises = crud_training.get_all_exercises(db)
    return [schemas.ExerciseOut.model_validate(ex) for ex in exercises]


_AW_PROGRAM_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "aw_training_program.json"


@router.get("/aw-program", dependencies=[Depends(check_admin_access)])
def get_aw_program():
    """Return AW training program data (max_day, light, heavy, speed) from aw_training_program.json."""
    if not _AW_PROGRAM_PATH.exists():
        return {}
    try:
        return json.loads(_AW_PROGRAM_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


@router.get("/today", response_model=schemas.TodayResponse, dependencies=[Depends(check_admin_access)])
def get_today(db: Session = Depends(get_db), for_date: Optional[date] = None):
    """Fetch the template for today (or for_date)."""
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

@router.put("/week", response_model=dict, dependencies=[Depends(check_admin_access)])
def update_week(body: schemas.WeekUpdateRequest, db: Session = Depends(get_db)):
    """Update the full week's exercises."""
    crud_training.update_week_templates(db, body.days)
    return {"status": "ok"}


@router.patch("/exercise/active", response_model=dict, dependencies=[Depends(check_admin_access)])
def update_exercise_active(body: schemas.ExerciseActiveUpdate, db: Session = Depends(get_db)):
    """Enable or disable an exercise globally."""
    ok = crud_training.update_exercise_active(db, body.exercise_id, body.is_active)
    return {"status": "ok" if ok else "not_found"}


@router.patch("/day-exercise", response_model=dict, dependencies=[Depends(check_admin_access)])
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

@router.get("/history", response_model=schemas.ExerciseHistoryResponse, dependencies=[Depends(check_admin_access)])
def get_exercise_history_route(
    exercise_id: str,
    limit: int = 15,
    db: Session = Depends(get_db),
):
    """Get workout history for an exercise (past sessions with weight/reps)."""
    return crud_training.get_exercise_history(db, exercise_id, limit=limit)


# --- Dashboard ---

@router.get("/dashboard-state", response_model=schemas.DashboardStateOut | None, dependencies=[Depends(check_admin_access)])
def get_dashboard_state(db: Session = Depends(get_db)):
    """Fetch the dashboard state (habits, projects, etc.) from DB."""
    return crud_training.get_dashboard_state(db)


@router.put("/dashboard-state", response_model=schemas.DashboardStateOut, dependencies=[Depends(check_admin_access)])
def update_dashboard_state(body: schemas.DashboardStateUpdate, db: Session = Depends(get_db)):
    """Save the dashboard state to DB."""
    return crud_training.update_dashboard_state(db, body.data)


# --- Shared Dashboard ---

@router.get("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut | None)
def get_shared_dashboard(share_id: str, db: Session = Depends(get_db)):
    """Fetch a shared dashboard by its share_id. PUBLIC ROUTE."""
    return crud_training.get_shared_dashboard(db, share_id)


@router.put("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut)
def update_shared_dashboard(share_id: str, body: schemas.SharedDashboardUpdate, db: Session = Depends(get_db)):
    """Update or create a shared dashboard by its share_id. PUBLIC ROUTE."""
    return crud_training.update_shared_dashboard(db, share_id, body.data, body.title)


@router.post("/log", response_model=schemas.WorkoutLogOut, dependencies=[Depends(check_admin_access)])
def log_workout(body: schemas.WorkoutLogCreate, db: Session = Depends(get_db)):
    """Receive completed sets from the React ExerciseTable and save them."""
    log = crud_training.create_workout_log(db, body.template_id, body.sets)
    return log


@router.post("/recommendation", response_model=schemas.RecommendationResponse, dependencies=[Depends(check_admin_access)])
def recommendation(body: schemas.RecommendationRequest, db: Session = Depends(get_db)):
    """Dummy endpoint for future recommendation logic."""
    target = body.date or date.today()
    template = crud_training.get_today_template(db, target)
    if template:
        return schemas.RecommendationResponse(
            message="Placeholder: recommendation logic.",
            recommended_template_id=template.id,
        )
    return schemas.RecommendationResponse(
        message="No template for this day.",
        recommended_template_id=None,
    )


# --- Training Progression (StrengthTable2) ---

@router.get("/progression", response_model=list[schemas.TrainingProgressionOut])
def get_all_progressions(db: Session = Depends(get_db)):
    """Fetch all progression data for all exercises."""
    return crud_training.get_all_progressions(db)


@router.get("/progression/{exercise_id}", response_model=Optional[schemas.TrainingProgressionOut])
def get_progression(exercise_id: str, db: Session = Depends(get_db)):
    """Fetch 6-month progression data for an exercise."""
    return crud_training.get_training_progression(db, exercise_id)


@router.post("/progression/{exercise_id}", response_model=schemas.TrainingProgressionOut)
def update_progression(exercise_id: str, body: schemas.TrainingProgressionUpdate, db: Session = Depends(get_db)):
    """Save 6-month progression data for an exercise."""
    return crud_training.update_training_progression(db, exercise_id, body.data)


# --- Daily Schedule ---

@router.get("/schedule", response_model=list[schemas.DailyScheduleOut])
def get_schedule(
    start_date: Optional[date] = None, 
    days_count: int = 14, 
    db: Session = Depends(get_db)
):
    """Get the sliding schedule for training days."""
    target_date = start_date or date.today()
    return crud_training.get_daily_schedule(db, target_date, days_count)


@router.patch("/schedule/{schedule_date}", response_model=schemas.DailyScheduleOut)
def update_schedule_completion(
    schedule_date: date, 
    body: schemas.DailyScheduleUpdate, 
    db: Session = Depends(get_db)
):
    """Toggle completion for a specific date in the schedule."""
    sched = crud_training.update_daily_schedule_completion(db, schedule_date, body.is_completed)
    return sched

@router.post("/schedule/skip-today", response_model=dict, dependencies=[Depends(check_admin_access)])
def skip_today(db: Session = Depends(get_db)):
    """Manually skip today's workout and slide everything by one day."""
    from app.db.models import DailySchedule
    from datetime import datetime, date, time
    
    today_date = date.today()
    today_dt = datetime.combine(today_date, time.min)
    
    # Cerchiamo se esiste già un record per oggi
    today_sched = db.query(DailySchedule).filter(DailySchedule.date_ == today_dt).first()
    
    if today_sched:
        # Se oggi era già completato, ignoriamo
        if today_sched.is_completed:
            return {"status": "ignored", "message": "Oggi è già completato."}
        
        # Altrimenti lo trasformiamo in un Rest Day completato (saltato)
        today_sched.template_id = None
        today_sched.is_completed = 1
    else:
        # Se non esiste, lo creiamo come Rest Day saltato
        new_rest = DailySchedule(date_=today_dt, template_id=None, is_completed=1)
        db.add(new_rest)
        
    db.commit()
    return {"status": "ok", "message": "Oggi saltato, la sequenza slitterà a domani."}
