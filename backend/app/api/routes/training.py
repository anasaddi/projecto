import json
from pathlib import Path
from datetime import date, datetime, timezone, time
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.db.session import get_db
from app import schemas
from app.crud import training as crud_training
from app.crud import dashboard as crud_dashboard
from app.crud import migration as crud_migration
from app.websockets import manager

router = APIRouter()

# --- Security Dependency ---
def check_admin_access(x_km_access: Optional[str] = Header(None)):
    """Simple header check to block unauthorized access to private routes."""
    if x_km_access != "master-key":
        raise HTTPException(status_code=403, detail="Accesso negato: sezione privata.")
    return True

@router.get("/ping")
async def ping(db: AsyncSession = Depends(get_db)):
    from app.db.models import Exercise, WorkoutDayTemplate, DailySchedule
    ex_count = (await db.execute(select(func.count(Exercise.id)))).scalar()
    tmpl_count = (await db.execute(select(func.count(WorkoutDayTemplate.id)))).scalar()
    sched_count = (await db.execute(select(func.count(DailySchedule.id)))).scalar()
    return {
        "status": "pong",
        "db_stats": {
            "exercises": ex_count,
            "templates": tmpl_count,
            "schedule_entries": sched_count
        }
    }

@router.post("/reseed", dependencies=[Depends(check_admin_access)])
async def reseed_db(db: AsyncSession = Depends(get_db)):
    """Force re-seeding of training data, history, and progressions."""
    from app.db.seed_training import seed_training_if_empty, seed_fake_history, seed_fake_progressions
    from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise, DailySchedule, TrainingProgression, WorkoutLog, SetLog
    from sqlalchemy import text

    # Manual schema fix for existing exercises table
    try:
        await db.execute(text("ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1"))
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Schema fix error: {e}")

    try:
        # Delete dependent data first
        await db.execute(delete(DailySchedule))
        await db.execute(delete(WorkoutDayExercise))
        await db.execute(delete(SetLog))
        await db.execute(delete(WorkoutLog))
        await db.execute(delete(TrainingProgression))
        await db.execute(delete(WorkoutDayTemplate))
        await db.execute(delete(Exercise))
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"Cleanup error: {e}")

    # Seed data
    n_ex = await seed_training_if_empty(db)
    n_hist = await seed_fake_history(db, force=True)
    n_prog = await seed_fake_progressions(db, force=True)
    
    # Generate schedule for next 21 days
    await crud_training.get_daily_schedule(db, date.today(), 21)
    
    return {
        "status": "ok", 
        "seeded": {
            "exercises": n_ex,
            "history_logs": n_hist,
            "progressions": n_prog
        }
    }

@router.post("/migrate", dependencies=[Depends(check_admin_access)])
async def migrate_data(db: AsyncSession = Depends(get_db)):
    """Migrate data from old JSON blobs to relational tables."""
    return await crud_migration.migrate_json_to_relational(db)

@router.get("/exercises", response_model=list[schemas.ExerciseOut])
async def get_exercises(db: AsyncSession = Depends(get_db)):
    """Public route for the muscle-exercise matrix."""
    return await crud_training.get_all_exercises(db)

_AW_PROGRAM_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "aw_training_program.json"

@router.get("/aw-program")
async def get_aw_program():
    """Return AW training program data from aw_training_program.json."""
    try:
        if not _AW_PROGRAM_PATH.exists():
            return {}
        return json.loads(_AW_PROGRAM_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

@router.get("/today", response_model=schemas.TodayResponse, dependencies=[Depends(check_admin_access)])
async def get_today(db: AsyncSession = Depends(get_db), for_date: Optional[date] = None):
    """Fetch the template for today (or for_date)."""
    target = for_date or date.today()
    template = await crud_training.get_today_template(db, for_date)
    if not template:
        return schemas.TodayResponse(
            template_id="",
            day_name="Nessun template per oggi",
            hypertrophy_exercises=[],
            strength_aw_exercises=[],
        )
    hyp, strength_aw = await crud_training.get_today_exercises_grouped(db, for_date)
    is_fallback = template.weekday is not None and template.weekday != target.weekday()
    return schemas.TodayResponse(
        template_id=template.id,
        day_name=template.day_name,
        hypertrophy_exercises=hyp,
        strength_aw_exercises=strength_aw,
        is_fallback=is_fallback,
    )

@router.get("/week", response_model=list[schemas.WeekDayData])
async def get_week(db: AsyncSession = Depends(get_db)):
    """Fetch the full week's templates."""
    return await crud_training.get_week_templates(db)

@router.put("/week", response_model=dict, dependencies=[Depends(check_admin_access)])
async def update_week(body: schemas.WeekUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update the full week's exercises."""
    await crud_training.update_week_templates(db, body.days)
    return {"status": "ok"}

@router.patch("/exercise/active", response_model=dict, dependencies=[Depends(check_admin_access)])
async def update_exercise_active(body: schemas.ExerciseActiveUpdate, db: AsyncSession = Depends(get_db)):
    """Enable or disable an exercise globally."""
    ok = await crud_training.update_exercise_active(db, body.exercise_id, body.is_active)
    return {"status": "ok" if ok else "not_found"}

@router.patch("/day-exercise", response_model=dict, dependencies=[Depends(check_admin_access)])
async def update_day_exercise(body: schemas.DayExerciseUpdate, db: AsyncSession = Depends(get_db)):
    """Update instruction/base_sets/base_reps for an exercise in a day template."""
    ok = await crud_training.update_day_exercise(
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
async def get_exercise_history_route(exercise_id: str, limit: int = 15, db: AsyncSession = Depends(get_db)):
    """Get workout history for an exercise."""
    return await crud_training.get_exercise_history(db, exercise_id, limit=limit)

@router.post("/log", response_model=schemas.WorkoutLogOut, dependencies=[Depends(check_admin_access)])
async def log_workout(body: schemas.WorkoutLogCreate, db: AsyncSession = Depends(get_db)):
    """Log a workout session."""
    return await crud_training.create_workout_log(db, body.template_id, body.sets)

@router.get("/progression", response_model=list[schemas.TrainingProgressionOut])
async def get_all_progressions(db: AsyncSession = Depends(get_db)):
    """Get all training progressions (TMs, monthly data)."""
    return await crud_training.get_all_progressions(db)

@router.get("/progression/{exercise_id}", response_model=Optional[schemas.TrainingProgressionOut])
async def get_progression(exercise_id: str, db: AsyncSession = Depends(get_db)):
    """Get progression for a specific exercise."""
    return await crud_training.get_training_progression(db, exercise_id)

@router.post("/progression/{exercise_id}", response_model=schemas.TrainingProgressionOut)
async def update_progression(exercise_id: str, body: schemas.TrainingProgressionUpdate, db: AsyncSession = Depends(get_db)):
    """Update progression for a specific exercise."""
    try:
        return await crud_training.update_training_progression(db, exercise_id, body.data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/schedule", response_model=list[schemas.DailyScheduleOut])
async def get_schedule(start_date: Optional[date] = None, days_count: int = 14, db: AsyncSession = Depends(get_db)):
    """Get the daily schedule."""
    target_date = start_date or date.today()
    return await crud_training.get_daily_schedule(db, target_date, days_count)

@router.patch("/schedule/{schedule_date}", response_model=schemas.DailyScheduleOut)
async def update_schedule_completion(schedule_date: date, body: schemas.DailyScheduleUpdate, db: AsyncSession = Depends(get_db)):
    """Update completion status for a schedule date."""
    return await crud_training.update_daily_schedule_completion(db, schedule_date, body.is_completed)

@router.post("/schedule/skip-today", response_model=dict, dependencies=[Depends(check_admin_access)])
async def skip_today(db: AsyncSession = Depends(get_db)):
    """Skip today's workout in the schedule."""
    from app.db.models import DailySchedule
    today_dt = datetime.combine(date.today(), time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == today_dt).limit(1))
    today_sched = res.scalar_one_or_none()
    if today_sched:
        if today_sched.is_completed:
            return {"status": "ignored", "message": "Oggi è già completato."}
        today_sched.template_id = None
        today_sched.is_completed = 1
    else:
        db.add(DailySchedule(date_=today_dt, template_id=None, is_completed=1))
    await db.commit()
    return {"status": "ok", "message": "Oggi saltato, la sequenza slitterà a domani."}

# --- Dashboard ---

@router.get("/dashboard-state", response_model=schemas.DashboardStateOut | None, dependencies=[Depends(check_admin_access)])
async def get_dashboard_state(db: AsyncSession = Depends(get_db)):
    """Fetch the dashboard state (habits, projects, etc.) from DB."""
    data = await crud_dashboard.get_dashboard_state_aggregated(db)
    return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}

@router.put("/dashboard-state", response_model=schemas.DashboardStateOut, dependencies=[Depends(check_admin_access)])
async def update_dashboard_state(body: schemas.DashboardStateUpdate, db: AsyncSession = Depends(get_db)):
    """Save the dashboard state to DB."""
    data = await crud_dashboard.update_dashboard_from_json(db, body.data)
    return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}

# --- Shared Dashboard ---

@router.get("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut | None)
async def get_shared_dashboard(share_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a shared dashboard by its share_id. PUBLIC ROUTE."""
    return await crud_dashboard.get_shared_dashboard_aggregated(db, share_id)

@router.get("/shared-dashboards", response_model=list[schemas.SharedDashboardOut])
async def list_shared_dashboards(db: AsyncSession = Depends(get_db)):
    """Fetch all shared dashboards. PUBLIC ROUTE."""
    return await crud_dashboard.get_all_shared_dashboards_aggregated(db)

@router.put("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut)
async def update_shared_dashboard(share_id: str, body: schemas.SharedDashboardUpdate, db: AsyncSession = Depends(get_db)):
    """Update or create a shared dashboard by its share_id. PUBLIC ROUTE."""
    dashboard = await crud_dashboard.update_shared_dashboard_from_json(db, share_id, body.data, body.title)
    
    payload = {
        "type": "sync",
        "share_id": share_id,
        "title": body.title or dashboard["title"],
        "data": body.data
    }
    await manager.broadcast(payload, share_id)
    return dashboard

@router.websocket("/ws/shared-dashboard/{share_id}")
async def websocket_shared_dashboard(websocket: WebSocket, share_id: str, db: AsyncSession = Depends(get_db)):
    await manager.connect(websocket, share_id)
    try:
        dashboard = await crud_dashboard.get_shared_dashboard_aggregated(db, share_id)
        if dashboard:
            dashboard["type"] = "sync"
            await websocket.send_json(dashboard)
        else:
            await websocket.send_json({
                "type": "sync",
                "share_id": share_id, 
                "title": "Progetti Condivisi", 
                "data": {"projects": [], "quickTasks": [], "chat": []},
                "updated_at": None
            })

        while True:
            payload = await websocket.receive_json()
            if payload.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue
            await manager.broadcast(payload, share_id, exclude=websocket)
            await crud_dashboard.update_shared_dashboard_from_json(
                db, share_id, payload.get("data"), payload.get("title")
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, share_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, share_id)
