import json
import logging
from pathlib import Path
from datetime import date, datetime, timezone, time, timedelta
import jwt
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Response, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

# Minimal empty dashboard state when DB/cache fails
EMPTY_DASHBOARD = {
    "dailyTaskTemplates": [],
    "dailyTaskLogs": {},
    "projects": [],
    "quickTasks": [],
    "prayerLogs": {},
    "top3Manual": [None, None, None],
    "dailyCompletionLog": {},
    "lifeGoals": {"collapsed": False, "tiers": []},
}


def _has_meaningful_dashboard_data(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    life_goals = data.get("lifeGoals") if isinstance(data.get("lifeGoals"), dict) else None
    tiers = life_goals.get("tiers") if isinstance(life_goals, dict) else None
    return any(
        [
            isinstance(data.get("dailyTaskTemplates"), list) and len(data.get("dailyTaskTemplates") or []) > 0,
            isinstance(data.get("projects"), list) and len(data.get("projects") or []) > 0,
            isinstance(data.get("quickTasks"), list) and len(data.get("quickTasks") or []) > 0,
            isinstance(tiers, list) and any(isinstance(t, dict) and len(t.get("goals") or []) > 0 for t in tiers),
        ]
    )


def _dashboard_snapshot_or_empty(data: Any) -> dict:
    return data if isinstance(data, dict) and _has_meaningful_dashboard_data(data) else EMPTY_DASHBOARD
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.api.deps import get_current_admin, get_current_user, get_training_access

from app.db.session import get_db
from app import schemas
from app.repositories import training as crud_training
from app.services import dashboard_service
from app.repositories import migration as crud_migration
from app.websockets import manager

router = APIRouter()


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

@router.post("/reseed", dependencies=[Depends(get_current_admin)])
async def reseed_db(db: AsyncSession = Depends(get_db)):
    """Force re-seeding of training data, history, and progressions."""
    from app.db.seed_training import seed_training_if_empty, seed_fake_history, seed_fake_progressions
    from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise, DailySchedule, TrainingProgression, WorkoutLog, SetLog
    from sqlalchemy import text

    # Reseeding logic
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

@router.post("/migrate", dependencies=[Depends(get_current_admin)])
async def migrate_data(db: AsyncSession = Depends(get_db)):
    """Migrate data from old JSON blobs to relational tables."""
    return await crud_migration.migrate_json_to_relational(db)

@router.get("/exercises", response_model=list[schemas.ExerciseOut], dependencies=[Depends(get_training_access)])
async def get_exercises(db: AsyncSession = Depends(get_db)):
    """Public route for the muscle-exercise matrix."""
    return await crud_training.get_all_exercises(db)

_AW_PROGRAM_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "aw_training_program.json"

@router.get("/aw-program", dependencies=[Depends(get_training_access)])
async def get_aw_program():
    """Return AW training program data from aw_training_program.json."""
    try:
        if not _AW_PROGRAM_PATH.exists():
            return {}
        return json.loads(_AW_PROGRAM_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

@router.get("/today", response_model=schemas.TodayResponse, dependencies=[Depends(get_training_access)])
async def get_today(db: AsyncSession = Depends(get_db), for_date: Optional[date] = None):
    """Fetch the template for today (or for_date)."""
    try:
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
    except Exception as e:
        logger.exception("training/today failed: %s", e)
        return schemas.TodayResponse(
            template_id="",
            day_name="Nessun template per oggi",
            hypertrophy_exercises=[],
            strength_aw_exercises=[],
            is_fallback=False,
        )

@router.get("/week", response_model=list[schemas.WeekDayData], dependencies=[Depends(get_training_access)])
async def get_week(db: AsyncSession = Depends(get_db)):
    """Fetch the full week's templates."""
    return await crud_training.get_week_templates(db)

@router.put("/week", response_model=dict, dependencies=[Depends(get_training_access)])
async def update_week(body: schemas.WeekUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update the full week's exercises."""
    await crud_training.update_week_templates(db, body.days)
    return {"status": "ok"}

@router.patch("/exercise/active", response_model=dict, dependencies=[Depends(get_training_access)])
async def update_exercise_active(body: schemas.ExerciseActiveUpdate, db: AsyncSession = Depends(get_db)):
    """Enable or disable an exercise globally."""
    ok = await crud_training.update_exercise_active(db, body.exercise_id, body.is_active)
    return {"status": "ok" if ok else "not_found"}

@router.patch("/day-exercise", response_model=dict, dependencies=[Depends(get_training_access)])
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

@router.get("/history", response_model=schemas.ExerciseHistoryResponse, dependencies=[Depends(get_training_access)])
async def get_exercise_history_route(exercise_id: str, limit: int = 15, db: AsyncSession = Depends(get_db)):
    """Get workout history for an exercise."""
    return await crud_training.get_exercise_history(db, exercise_id, limit=limit)

@router.post("/log", response_model=schemas.WorkoutLogOut, dependencies=[Depends(get_training_access)])
async def log_workout(body: schemas.WorkoutLogCreate, db: AsyncSession = Depends(get_db)):
    """Log a workout session."""
    return await crud_training.create_workout_log(db, body.template_id, body.sets)

@router.get("/progression", response_model=list[schemas.TrainingProgressionOut], dependencies=[Depends(get_training_access)])
async def get_all_progressions(db: AsyncSession = Depends(get_db)):
    """Get all training progressions (TMs, monthly data)."""
    try:
        return await crud_training.get_all_progressions(db)
    except Exception as e:
        logger.exception("training/progression failed: %s", e)
        return []

@router.get("/progression/{exercise_id}", response_model=Optional[schemas.TrainingProgressionOut], dependencies=[Depends(get_training_access)])
async def get_progression(exercise_id: str, db: AsyncSession = Depends(get_db)):
    """Get progression for a specific exercise."""
    return await crud_training.get_training_progression(db, exercise_id)

@router.post("/progression/{exercise_id}", response_model=schemas.TrainingProgressionOut, dependencies=[Depends(get_training_access)])
async def update_progression(exercise_id: str, body: schemas.TrainingProgressionUpdate, db: AsyncSession = Depends(get_db)):
    """Update progression for a specific exercise."""
    try:
        return await crud_training.update_training_progression(db, exercise_id, body.data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/schedule", response_model=list[schemas.DailyScheduleOut], dependencies=[Depends(get_training_access)])
async def get_schedule(start_date: Optional[date] = None, days_count: int = 14, db: AsyncSession = Depends(get_db)):
    """Get the daily schedule."""
    target_date = start_date or date.today()
    try:
        return await crud_training.get_daily_schedule(db, target_date, days_count)
    except Exception as e:
        logger.exception("get_schedule failed: %s", e)
        return []

@router.patch("/schedule/{schedule_date}", response_model=schemas.DailyScheduleOut, dependencies=[Depends(get_training_access)])
async def update_schedule_completion(schedule_date: date, body: schemas.DailyScheduleUpdate, db: AsyncSession = Depends(get_db)):
    """Update completion status for a schedule date."""
    try:
        sched = await crud_training.update_daily_schedule_completion(db, schedule_date, body.is_completed)
        if not sched:
            raise HTTPException(status_code=404, detail="Schedule non trovato per questa data")
        return sched
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update schedule completion: %s", e)
        raise HTTPException(status_code=500, detail=f"Errore interno durante l'aggiornamento: {str(e)}")

@router.post("/schedule/skip-today", response_model=dict, dependencies=[Depends(get_training_access)])
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

@router.get("/dashboard-state", response_model=schemas.DashboardStateOut | None)
async def get_dashboard_state(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Fetch the dashboard state — Redis-first, DB fallback. Filtered by user_id when present."""
    from app.cache import get_cached_dashboard, set_cached_dashboard
    try:
        cached = await get_cached_dashboard(user_id)
        if _has_meaningful_dashboard_data(cached):
            return {"key": "default", "data": cached, "updated_at": datetime.now(timezone.utc)}
        if cached:
            logger.info("Ignoring empty dashboard cache hit; fetching DB snapshot")
        data = await dashboard_service.get_dashboard(db, user_id=user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("get_dashboard_state failed: %s", e)
        return {"key": "default", "data": EMPTY_DASHBOARD, "updated_at": datetime.now(timezone.utc)}

@router.get("/dashboard-state/at", response_model=schemas.DashboardStateOut | None)
async def get_dashboard_state_at(
    at: str,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Time Travel: return dashboard state as it was at the given ISO timestamp."""
    from app.services.event_sourcing import get_dashboard_state_at as get_state_at
    try:
        at_dt = datetime.fromisoformat(at.replace("Z", "+00:00"))
        if at_dt.tzinfo is None:
            at_dt = at_dt.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid 'at' timestamp (use ISO 8601)")
    agg_id = user_id or "default"
    data = await get_state_at(db, agg_id, at=at_dt)
    if not _has_meaningful_dashboard_data(data):
        logger.info("Dashboard time-travel snapshot empty; falling back to current DB state")
        data = await dashboard_service.get_dashboard(db, user_id=user_id)
    return {"key": "default", "data": _dashboard_snapshot_or_empty(data), "updated_at": at_dt}

@router.put("/dashboard-state", response_model=schemas.DashboardStateOut)
async def update_dashboard_state(
    body: schemas.DashboardStateUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Save the dashboard state to DB and invalidate cache. Scoped by user_id when present."""
    from app.cache import invalidate_dashboard, set_cached_dashboard
    try:
        data = await dashboard_service.update_dashboard(db, body.data, user_id=user_id)
        await invalidate_dashboard(user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("update_dashboard_state failed: %s", e)
        fallback_data = body.data if isinstance(body.data, dict) else {}
        return Response(
            content=json.dumps({
                "key": "default",
                "data": fallback_data,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }),
            media_type="application/json",
            headers={"X-Degraded": "true"},
        )

# --- Batch Operations ---

@router.post("/dashboard-reset-daily", response_model=schemas.DashboardStateOut)
async def reset_daily_logs(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Reset all daily logs (dailyTaskLogs, prayerLogs, dailyCompletionLog, timelineRoutines) for the current user."""
    from app.repositories.dashboard import HabitLog, PrayerLog, DailyCompletionLog
    from app.cache import invalidate_dashboard, set_cached_dashboard

    try:
        # Delete daily logs for the current user
        if user_id:
            await db.execute(delete(HabitLog).filter(HabitLog.user_id == user_id))
            await db.execute(delete(PrayerLog).filter(PrayerLog.user_id == user_id))
            await db.execute(delete(DailyCompletionLog).filter(DailyCompletionLog.user_id == user_id))
        else:
            # Legacy: no user_id, delete all (backward compatibility)
            await db.execute(delete(HabitLog))
            await db.execute(delete(PrayerLog))
            await db.execute(delete(DailyCompletionLog))

        # Clear timelineRoutines from DashboardState JSON blob
        from app.repositories.dashboard import DashboardState
        q = select(DashboardState).filter(DashboardState.key == "default")
        if user_id is not None:
            q = q.filter(DashboardState.user_id == user_id)
        else:
            q = q.filter(DashboardState.user_id.is_(None))
        res_ds = await db.execute(q.order_by(DashboardState.updated_at.desc()))
        ds = res_ds.scalar_one_or_none()

        if ds:
            from app.repositories.dashboard import _parse_json
            data = _parse_json(ds.data, {}) or {}
            if "timelineRoutines" in data:
                data["timelineRoutines"] = {}
                ds.data = data
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(ds, "data")

        await db.commit()

        # Invalidate cache and return updated dashboard state
        data = await dashboard_service.get_dashboard(db, user_id=user_id)
        await invalidate_dashboard(user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("reset_daily_logs failed: %s", e)
        await db.rollback()
        raise HTTPException(status_code=503, detail=str(e))

@router.patch("/dashboard-state/batch", dependencies=[Depends(get_current_admin)])
async def batch_update_dashboard(body: dict, db: AsyncSession = Depends(get_db)):
    """Process multiple dashboard mutations in a single transaction.
    
    Body format: { "operations": [ { "type": "toggle_task", "projectId": "...", "taskId": "...", "done": true }, ... ] }
    """
    from app.repositories.audit import record_event
    operations = body.get("operations", [])
    if not operations:
        return {"status": "ok", "processed": 0}
    
    results = []
    for op in operations:
        op_type = op.get("type")
        try:
            if op_type == "toggle_task":
                # Record audit event
                await record_event(db, "task", op.get("taskId", ""), "toggled",
                                   new_data={"done": op.get("done")})
            elif op_type == "toggle_quick_task":
                await record_event(db, "quick_task", op.get("taskId", ""), "toggled",
                                   new_data={"done": op.get("done")})
            results.append({"type": op_type, "status": "ok"})
        except Exception as e:
            results.append({"type": op_type, "status": "error", "message": str(e)})
    
    # Apply the full state update after batch
    if body.get("state"):
        await dashboard_service.update_dashboard(db, body["state"])
        from app.cache import invalidate_dashboard
        await invalidate_dashboard()

    return {"status": "ok", "processed": len(results), "results": results}

# --- Audit Events ---

@router.get("/audit-events")
async def get_audit_events(
    entity_type: str | None = None,
    entity_id: str | None = None,
    share_id: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """Query audit trail for dashboard changes."""
    from app.repositories.audit import get_events
    return await get_events(db, entity_type=entity_type, entity_id=entity_id, share_id=share_id, limit=limit)

# --- Shared Dashboard ---

def create_share_token(share_id: str, secret_key: str):
    payload = {
        "share_id": share_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")

def verify_share_token(token: str, share_id: str, secret_key: str) -> bool:
    if not token: return False
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload.get("share_id") == share_id
    except Exception:
        return False

@router.get("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut | None)
async def get_shared_dashboard(
    share_id: str, 
    db: AsyncSession = Depends(get_db),
    x_share_token: str | None = Header(None, alias="x-share-token")
):
    """Fetch a shared dashboard — Redis-first, DB fallback. PUBLIC ROUTE with password protection."""
    from app.cache import get_cached_shared_dashboard, set_cached_shared_dashboard, invalidate_shared_dashboard
    from app.config import get_settings
    settings = get_settings()
    
    try:
        cached = await get_cached_shared_dashboard(share_id)
        if cached is not None and not isinstance(cached, dict):
            logger.warning("Ignoring malformed shared dashboard cache for %s (type=%s)", share_id, type(cached).__name__)
            await invalidate_shared_dashboard(share_id)
            cached = None
        data = cached if cached else await dashboard_service.get_shared_dashboard(db, share_id)
        
        # Auto-create if doesn't exist (v2 - return direct response)
        if not data:
            logger.info("Auto-creating shared dashboard: %s", share_id)  # v3
            created = await dashboard_service.update_shared_dashboard(db, share_id, {}, title="Progetti Condivisi")
            created_response = {
                "share_id": share_id,
                "title": created.get("title") or "Progetti Condivisi",
                "data": created.get("data") or {"projects": [], "quickTasks": [], "notes": [], "chat": [], "bonifici": []},
                "updated_at": created.get("updated_at") or datetime.now(timezone.utc),
                "is_protected": False,
            }
            await set_cached_shared_dashboard(share_id, created_response)
            # Build response directly to avoid race condition
            return created_response
        
        if not cached:
            await set_cached_shared_dashboard(share_id, data)

        payload_data = data.get("data") or {}
        pwd_hash = payload_data.get("passwordHash")
        
        is_protected = bool(pwd_hash)
        if is_protected:
            is_unlocked = x_share_token and verify_share_token(x_share_token, share_id, settings.secret_key)
            if not is_unlocked:
                return {
                    "share_id": share_id,
                    "title": data.get("title", "Progetti Condivisi"),
                    "is_protected": True,
                    "data": None,
                    "updated_at": data.get("updated_at")
                }

        clean_data = dict(payload_data)
        clean_data.pop("passwordHash", None)
        clean_data.pop("sectionPasswords", None)
        
        return {
            "share_id": share_id,
            "title": data.get("title"),
            "data": clean_data,
            "updated_at": data.get("updated_at"),
            "is_protected": is_protected
        }
    except Exception as e:
        logger.exception("Error fetching shared dashboard %s: %s", share_id, e)
        try:
            await invalidate_shared_dashboard(share_id)
        except Exception:
            pass
        return {
            "share_id": share_id,
            "title": "Progetti Condivisi",
            "data": {
                "projects": [],
                "quickTasks": [],
                "notes": [],
                "chat": [],
                "bonifici": [],
            },
            "updated_at": datetime.now(timezone.utc),
            "is_protected": False,
        }

@router.get("/shared-dashboards", response_model=list[schemas.SharedDashboardOut], dependencies=[Depends(get_current_admin)])
async def list_shared_dashboards(db: AsyncSession = Depends(get_db)):
    """Fetch all shared dashboards. ADMIN ONLY."""
    try:
        return await dashboard_service.get_all_shared_dashboards(db)
    except Exception as e:
        logger.exception("training/shared-dashboards failed: %s", e)
        return []

@router.post("/shared-dashboard/{share_id}/unlock", response_model=schemas.SharedDashboardUnlockResponse)
async def unlock_shared_dashboard(share_id: str, body: schemas.SharedDashboardUnlockRequest, db: AsyncSession = Depends(get_db)):
    """Verify password and return a temporary access token for a shared dashboard."""
    import hashlib
    from app.config import get_settings
    settings = get_settings()
    
    dashboard = await dashboard_service.get_shared_dashboard(db, share_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trovato")
    
    payload_data = dashboard.get("data") or {}
    pwd_hash = payload_data.get("passwordHash")
    
    if not pwd_hash:
        raise HTTPException(status_code=400, detail="Questa dashboard non è protetta da password")
        
    # Frontend prefix: "km-shared:"
    incoming_hash = hashlib.sha256(f"km-shared:{body.password}".encode()).hexdigest()
    if incoming_hash != pwd_hash and body.password != pwd_hash: 
        raise HTTPException(status_code=403, detail="Password errata")
        
    token = create_share_token(share_id, settings.secret_key)
    return {"token": token}

async def get_shared_write_access(
    share_id: str,
    x_share_token: str | None = Header(None, alias="x-share-token"),
    x_km_access: str | None = Header(None, alias="x-km-access"),
    db: AsyncSession = Depends(get_db)
):
    """Dependency to allow write access if either admin or valid share token is provided."""
    from app.config import get_settings
    settings = get_settings()
    
    # 1. Admin check
    if x_km_access == settings.admin_access_key:
        return True
        
    # 2. Shared token check
    dashboard = await dashboard_service.get_shared_dashboard(db, share_id)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trovato")
        
    payload_data = dashboard.get("data") or {}
    pwd_hash = payload_data.get("passwordHash")
    
    if not pwd_hash:
        # If not protected, anyone can write? For now, yes, keeping it open if no pwd.
        return True
        
    if verify_share_token(x_share_token, share_id, settings.secret_key):
        return True
        
    raise HTTPException(status_code=403, detail="Accesso negato. Token mancante o non valido.")

@router.put("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut)
async def update_shared_dashboard(
    share_id: str, 
    body: schemas.SharedDashboardUpdate, 
    db: AsyncSession = Depends(get_db),
    access=Depends(get_shared_write_access)
):
    """Update or create a shared dashboard. Invalidates cache + broadcasts. ADMIN OR TOKEN."""
    from app.cache import invalidate_shared_dashboard, set_cached_shared_dashboard
    from app.repositories.audit import record_event

    try:
        dashboard = await dashboard_service.update_shared_dashboard(db, share_id, body.data, body.title)
    except Exception as e:
        logger.exception("Error updating shared dashboard %s: %s", share_id, e)
        try:
            await invalidate_shared_dashboard(share_id)
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Impossibile salvare la shared dashboard")

    await invalidate_shared_dashboard(share_id)
    await set_cached_shared_dashboard(share_id, dashboard)
    
    try:
        await record_event(
            db,
            "shared_dashboard",
            share_id,
            "updated",
            new_data={"share_id": share_id, "title": body.title, "updated": True},
        )
    except Exception as e:
        logger.warning("Failed to record shared dashboard audit event for %s: %s", share_id, e)
    
    payload = {
        "type": "sync",
        "share_id": share_id,
        "title": body.title or dashboard["title"],
        "data": body.data
    }
    try:
        await manager.broadcast(payload, share_id)
    except Exception as e:
        logger.warning("Failed to broadcast shared dashboard update for %s: %s", share_id, e)
    return {
        "share_id": share_id,
        "title": dashboard["title"],
        "data": body.data,
        "updated_at": datetime.now(timezone.utc)
    }

@router.websocket("/ws/shared-dashboard/{share_id}")
async def websocket_shared_dashboard(websocket: WebSocket, share_id: str, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger("km.ws")
    
    from app.config import get_settings
    settings = get_settings()
    from fastapi.encoders import jsonable_encoder
    from app.cache import get_cached_shared_dashboard, set_cached_shared_dashboard

    # 1. Fetch dashboard to check protection
    dashboard = await get_cached_shared_dashboard(share_id)
    if not dashboard:
        dashboard = await dashboard_service.get_shared_dashboard(db, share_id)
        if dashboard:
            await set_cached_shared_dashboard(share_id, dashboard)

    if not dashboard:
        await websocket.close(code=1008)
        return

    payload_data = dashboard.get("data") or {}
    pwd_hash = payload_data.get("passwordHash")
    
    # 2. Token verification if protected
    if pwd_hash:
        token = websocket.query_params.get("token")
        if not verify_share_token(token, share_id, settings.secret_key):
            await websocket.close(code=1008, reason="Unauthorized")
            return

    # 3. Connect and send initial sanitized state
    await manager.connect(websocket, share_id)
    try:
        dashboard_to_send = dict(dashboard)
        dashboard_to_send["type"] = "sync"
        
        if pwd_hash:
            clean_data = dict(payload_data)
            clean_data.pop("passwordHash", None)
            clean_data.pop("sectionPasswords", None)
            dashboard_to_send["data"] = clean_data

        await websocket.send_json(jsonable_encoder(dashboard_to_send))

        while True:
            payload = await websocket.receive_json()
            # Rate limit check
            if not manager.check_rate_limit(websocket):
                await websocket.send_json({"type": "error", "message": "Rate limit exceeded. Slow down."})
                await websocket.close(code=1008, reason="Rate limit exceeded")
                return
                    
            if payload.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue
            
            if payload.get("type") == "chat":
                # Optimizzazione: solo un messaggio invece di tutta la history
                msg_data = payload.get("data")
                if msg_data:
                    from app.services.dashboard_service import add_chat_msg
                    new_msg = await add_chat_msg(db, share_id, msg_data)
                    await manager.broadcast({
                        "type": "chat",
                        "share_id": share_id,
                        "data": jsonable_encoder(new_msg)
                    }, share_id, exclude=websocket)
                continue

            # Security: if dashboard is protected, allow only chat if no token, 
            # and block full data updates unless token/admin
            payload_data = dashboard.get("data") or {}
            pwd_hash = payload_data.get("passwordHash")
            
            if pwd_hash:
                token = payload.get("token") or websocket.query_params.get("token")
                from app.config import get_settings
                if not verify_share_token(token, share_id, get_settings().secret_key):
                    # Only allow chat messages if they are from someone who at least can see the chat? 
                    # No, usually if protected, everything is protected.
                    if payload.get("type") != "chat":
                        await websocket.send_json({"type": "error", "message": "Dashboard protetta. Sblocca per modificare."})
                        continue

            await dashboard_service.update_shared_dashboard(
                db, share_id, payload.get("data"), payload.get("title")
            )
            from app.cache import invalidate_shared_dashboard
            await invalidate_shared_dashboard(share_id)
            # Broadcast AFTER successful DB write to avoid spreading uncommitted state
            await manager.broadcast(jsonable_encoder(payload), share_id, exclude=websocket)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}", extra={"share_id": share_id, "action": "error"})
        try:
            await websocket.close()
        except Exception:
            pass
    finally:
        manager.disconnect(websocket, share_id)
