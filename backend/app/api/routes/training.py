import json
import logging
from pathlib import Path
from datetime import date, datetime, timezone, time, timedelta
import jwt
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Response, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

logger = logging.getLogger(__name__)

from app.api._dashboard_helpers import (
    EMPTY_DASHBOARD,
    dashboard_etag,
    dashboard_snapshot_or_empty,
    has_meaningful_dashboard_data,
    safe_shared_dashboard_data,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.api.deps import get_current_admin, get_current_user, get_training_access, resolve_access_token

from app.db.session import get_db
from app import schemas
from app.repositories import training as crud_training
from app.services import dashboard_service
from app.schemas.dashboard_events import DashboardPatchRequest
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

def _validate_template_exercises(rows: list[dict]) -> list[schemas.TemplateExerciseOut]:
    return [schemas.TemplateExerciseOut.model_validate(row) for row in rows]


@router.get("/exercises", response_model=list[schemas.ExerciseOut], dependencies=[Depends(get_training_access)])
async def get_exercises(db: AsyncSession = Depends(get_db)):
    """Public route for the muscle-exercise matrix."""
    try:
        raw = await crud_training.get_all_exercises(db)
        return [schemas.ExerciseOut.model_validate(row) for row in raw]
    except ValidationError:
        logger.exception("training/exercises response validation failed")
        raise HTTPException(status_code=500, detail="Exercise serialization failed")
    except Exception as e:
        logger.exception("training/exercises failed: %s", e)
        raise HTTPException(status_code=503, detail="Exercise list unavailable")

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
            template_id=str(template.id),
            day_name=str(template.day_name),
            hypertrophy_exercises=_validate_template_exercises(hyp),
            strength_aw_exercises=_validate_template_exercises(strength_aw),
            is_fallback=is_fallback,
        )
    except ValidationError:
        logger.exception("training/today response validation failed")
        raise HTTPException(status_code=500, detail="Today template serialization failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("training/today failed: %s", e)
        raise HTTPException(status_code=503, detail="Today template unavailable")

@router.get("/week", response_model=list[schemas.WeekDayData], dependencies=[Depends(get_training_access)])
async def get_week(db: AsyncSession = Depends(get_db)):
    """Fetch the full week's templates."""
    try:
        raw = await crud_training.get_week_templates(db)
        return [schemas.WeekDayData.model_validate(day) for day in raw]
    except ValidationError:
        logger.exception("training/week response validation failed")
        raise HTTPException(status_code=500, detail="Week template serialization failed")
    except Exception as e:
        logger.exception("training/week failed: %s", e)
        raise HTTPException(status_code=503, detail="Week templates unavailable")

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
        raise HTTPException(status_code=503, detail="Progressions unavailable") from e

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
        raise HTTPException(status_code=503, detail="Schedule unavailable") from e

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
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Fetch dashboard — Redis-first, then 1-query document snapshot, ETag/304 supported."""
    from app.services.dashboard_read import dashboard_read_to_response, read_dashboard_for_client

    try:
        result = await read_dashboard_for_client(
            db,
            user_id=user_id,
            if_none_match=request.headers.get("if-none-match"),
            log_label="get_dashboard_state",
        )
        if result.not_modified:
            return Response(status_code=304, headers={"ETag": result.etag})
        response.headers["ETag"] = result.etag
        return dashboard_read_to_response(result)
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
    if not has_meaningful_dashboard_data(data):
        logger.info("Dashboard time-travel snapshot empty; falling back to current DB state")
        data = await dashboard_service.get_dashboard(db, user_id=user_id)
    return {"key": "default", "data": dashboard_snapshot_or_empty(data), "updated_at": at_dt}

@router.put("/dashboard-state", response_model=schemas.DashboardStateOut)
async def update_dashboard_state(
    body: schemas.DashboardStateUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Save the dashboard state to DB and invalidate cache. Scoped by user_id when present."""
    from app.cache import invalidate_dashboard, set_cached_dashboard
    from app.schemas.dashboard import validate_dashboard_data
    from pydantic import ValidationError

    if not isinstance(body.data, dict):
        raise HTTPException(status_code=400, detail="Invalid dashboard payload")
    try:
        validated = validate_dashboard_data(body.data)
        payload = validated.model_dump(by_alias=True, mode="json")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors()) from e

    try:
        data = await dashboard_service.update_dashboard(db, payload, user_id=user_id)
        await invalidate_dashboard(user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("update_dashboard_state failed: %s", e)
        await db.rollback()
        raise HTTPException(status_code=503, detail="Dashboard save failed") from e


@router.patch("/dashboard-state", response_model=schemas.DashboardStateOut)
async def patch_dashboard_state(
    body: DashboardPatchRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
):
    """Apply small delta events (habit/prayer/quick-task toggles) without full PUT payload."""
    from app.cache import invalidate_dashboard, set_cached_dashboard

    try:
        data = await dashboard_service.patch_dashboard(db, body.events, user_id=user_id)
        await invalidate_dashboard(user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("patch_dashboard_state failed: %s", e)
        await db.rollback()
        raise HTTPException(status_code=503, detail="Dashboard patch failed") from e

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
        # Scoped deletes by user_id when available
        del_h = delete(HabitLog)
        del_p = delete(PrayerLog)
        del_d = delete(DailyCompletionLog)
        if user_id is not None:
            del_h = del_h.filter(HabitLog.user_id == user_id)
            del_p = del_p.filter(PrayerLog.user_id == user_id)
            del_d = del_d.filter(DailyCompletionLog.user_id == user_id)
        await db.execute(del_h)
        await db.execute(del_p)
        await db.execute(del_d)

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
            from sqlalchemy.orm.attributes import flag_modified
            data = dict(_parse_json(ds.data, {}) or {})
            data["dailyTaskLogs"] = {}
            data["prayerLogs"] = {}
            data["dailyCompletionLog"] = {}
            data["timelineRoutines"] = {}
            data["top3Manual"] = [None, None, None]
            ds.data = data
            flag_modified(ds, "data")

        # Also clear Top3 slots scoped for user
        from app.repositories.dashboard import Top3Item
        del_top3 = delete(Top3Item)
        if user_id is not None:
            del_top3 = del_top3.filter(Top3Item.user_id == user_id)
        await db.execute(del_top3)

        # Invalidate Redis BEFORE commit so any concurrent GET misses cache and hits DB
        await invalidate_dashboard(user_id)
        try:
            from app.simple_cache import invalidate_dashboard_fallback
            await invalidate_dashboard_fallback(user_id)
        except Exception:
            pass

        await db.commit()

        # Re-fetch clean state from DB and populate cache
        data = await dashboard_service.get_dashboard(db, user_id=user_id)
        await set_cached_dashboard(data, user_id)
        return {"key": "default", "data": data, "updated_at": datetime.now(timezone.utc)}
    except Exception as e:
        logger.exception("reset_daily_logs failed: %s", e)
        await db.rollback()
        return JSONResponse(status_code=503, content={"detail": "Daily reset failed"})

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

@router.get("/audit-events", dependencies=[Depends(get_current_admin)])
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

def _shared_dashboard_out(
    share_id: str,
    title: str,
    payload_data: dict,
    updated_at,
    *,
    include_data: bool,
    is_protected: bool,
) -> dict:
    if include_data:
        clean_data = dict(payload_data)
        clean_data.pop("passwordHash", None)
        clean_data.pop("sectionPasswords", None)
        data = clean_data
    else:
        data = None
    return {
        "share_id": share_id,
        "title": title or "Progetti Condivisi",
        "data": data,
        "updated_at": updated_at,
        "is_protected": is_protected,
    }


@router.get("/shared-dashboard/{share_id}", response_model=schemas.SharedDashboardOut | None)
async def get_shared_dashboard(
    share_id: str,
    db: AsyncSession = Depends(get_db),
    x_share_token: str | None = Header(None, alias="x-share-token"),
    access_token: str | None = Depends(resolve_access_token),
):
    """Fetch shared dashboard: admin JWT, share unlock token, or password-protected shell."""
    from app.cache import invalidate_shared_dashboard
    from app.config import get_settings
    from app.api.deps import is_admin_access
    from app.services.shared_dashboard_access import (
        auto_create_shared_dashboard,
        fetch_shared_dashboard_internal,
        shared_dashboard_out,
    )

    settings = get_settings()
    is_admin = is_admin_access(access_token, settings)

    try:
        record = await fetch_shared_dashboard_internal(db, share_id)

        if not record:
            if not is_admin:
                raise HTTPException(status_code=404, detail="Dashboard non trovato")
            logger.info("Auto-creating shared dashboard (admin): %s", share_id)
            record = await auto_create_shared_dashboard(db, share_id)
            return shared_dashboard_out(record, include_data=True)

        payload_data = safe_shared_dashboard_data(record.get("data"))
        is_protected = bool(payload_data.get("passwordHash"))

        if is_admin:
            return shared_dashboard_out(record, include_data=True)

        if is_protected:
            is_unlocked = x_share_token and verify_share_token(x_share_token, share_id, settings.secret_key)
            return shared_dashboard_out(record, include_data=is_unlocked)

        raise HTTPException(
            status_code=403,
            detail="Accesso negato. Lettura consentita solo con JWT admin.",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching shared dashboard %s: %s", share_id, e)
        try:
            await invalidate_shared_dashboard(share_id)
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Impossibile caricare la shared dashboard") from e

@router.get("/shared-dashboards", response_model=list[schemas.SharedDashboardOut], dependencies=[Depends(get_current_admin)])
async def list_shared_dashboards(db: AsyncSession = Depends(get_db)):
    """Fetch all shared dashboards. ADMIN ONLY."""
    try:
        return await dashboard_service.get_all_shared_dashboards(db)
    except Exception as e:
        logger.exception("training/shared-dashboards failed: %s", e)
        raise HTTPException(status_code=503, detail="Shared dashboards list unavailable") from e

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
    if incoming_hash != pwd_hash:
        raise HTTPException(status_code=403, detail="Password errata")
        
    token = create_share_token(share_id, settings.secret_key)
    return {"token": token}

async def get_shared_write_access(
    share_id: str,
    x_share_token: str | None = Header(None, alias="x-share-token"),
    access_token: str | None = Depends(resolve_access_token),
    db: AsyncSession = Depends(get_db)
):
    """Write access: admin JWT (or dev raw key), or valid share token when password-protected."""
    from app.config import get_settings
    from app.api.deps import is_admin_access

    settings = get_settings()

    if is_admin_access(access_token, settings):
        return True

    try:
        dashboard = await dashboard_service.get_shared_dashboard(db, share_id)
        if not dashboard:
            raise HTTPException(
                status_code=403,
                detail="Accesso negato. Solo admin può creare una shared dashboard senza password.",
            )

        payload_data = safe_shared_dashboard_data(dashboard.get("data"))
        pwd_hash = payload_data.get("passwordHash")

        if not pwd_hash:
            raise HTTPException(
                status_code=403,
                detail="Accesso negato. Scrittura consentita solo con JWT admin.",
            )

        if verify_share_token(x_share_token, share_id, settings.secret_key):
            return True

        raise HTTPException(status_code=403, detail="Accesso negato. Token mancante o non valido.")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Shared write access check failed for %s: %s", share_id, e)
        try:
            await db.rollback()
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Impossibile verificare i permessi di scrittura")

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
    from app.repositories.dashboard import upsert_shared_dashboard_metadata

    degraded = False
    dashboard = None
    try:
        dashboard = await dashboard_service.update_shared_dashboard(db, share_id, body.data, body.title)
    except Exception as e:
        logger.exception("Error updating shared dashboard %s: %s", share_id, e)
        try:
            await db.rollback()
            dashboard = await upsert_shared_dashboard_metadata(db, share_id, body.data, body.title)
        except Exception as fallback_error:
            logger.exception("Fallback save for shared dashboard %s also failed: %s", share_id, fallback_error)
            try:
                await db.rollback()
            except Exception:
                pass
            degraded = True
            dashboard = {
                "share_id": share_id,
                "title": body.title or "Progetti Condivisi",
                "data": body.data if isinstance(body.data, dict) else {},
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

    try:
        await invalidate_shared_dashboard(share_id)
        if not degraded:
            await set_cached_shared_dashboard(share_id, dashboard)
    except Exception as e:
        logger.warning("Cache update failed for shared dashboard %s: %s", share_id, e)
    
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
        "data": dashboard.get("data") if isinstance(dashboard, dict) and dashboard.get("data") is not None else body.data
    }
    try:
        await manager.broadcast(payload, share_id)
    except Exception as e:
        logger.warning("Failed to broadcast shared dashboard update for %s: %s", share_id, e)
    
    response_data = dashboard.get("data") if isinstance(dashboard, dict) else body.data
    return {
        "share_id": share_id,
        "title": dashboard["title"],
        "data": response_data,
        "updated_at": datetime.now(timezone.utc)
    }

@router.websocket("/ws/shared-dashboard/{share_id}")
async def websocket_shared_dashboard(websocket: WebSocket, share_id: str, db: AsyncSession = Depends(get_db)):
    import logging
    logger = logging.getLogger("km.ws")
    
    from app.config import get_settings
    settings = get_settings()
    from fastapi.encoders import jsonable_encoder
    from app.services.shared_dashboard_access import fetch_shared_dashboard_internal, shared_dashboard_out

    # 1. Fetch dashboard (unified cache+DB internal shape)
    try:
        record = await fetch_shared_dashboard_internal(db, share_id)

        if not record:
            logger.info("Auto-creating shared dashboard for websocket: %s", share_id)
            from app.services.shared_dashboard_access import auto_create_shared_dashboard
            record = await auto_create_shared_dashboard(db, share_id)
    except Exception as e:
        logger.exception("WebSocket pre-connect fetch failed for %s: %s", share_id, e)
        record = None

    if not record:
        try:
            await websocket.accept()
            await websocket.close(code=1008)
        except Exception:
            pass
        return

    payload_data = safe_shared_dashboard_data(record.get("data"))
    pwd_hash = payload_data.get("passwordHash")
    
    # 2. Token verification if protected
    if pwd_hash:
        token = websocket.query_params.get("token")
        if not verify_share_token(token, share_id, settings.secret_key):
            try:
                await websocket.accept()
            except Exception:
                pass
            await websocket.close(code=1008, reason="Unauthorized")
            return

    # 3. Connect and send initial sanitized state
    await manager.connect(websocket, share_id)
    try:
        out = shared_dashboard_out(record, include_data=True)
        dashboard_to_send = {**out, "type": "sync"}
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
            payload_data = safe_shared_dashboard_data(dashboard.get("data"))
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
