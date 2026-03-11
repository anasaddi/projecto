import logging
from typing import Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import (
    DashboardState, SharedDashboard, WorkoutLog, SetLog, Exercise, WorkoutDayTemplate, TrainingProgression
)
from app.crud.base import _parse_json
from app.crud.dashboard import update_dashboard_from_json, update_shared_dashboard_from_json
# Circular dependency avoidance: use training functions locally
from app.crud.training import update_training_progression

logger = logging.getLogger(__name__)

async def migrate_json_to_relational(db: AsyncSession):
    """
    Migrates data from old JSON blobs (DashboardState and SharedDashboard)
    to the new relational tables.
    """
    # 1. Personal Dashboard
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == "default"))
    ds = res_ds.scalar_one_or_none()
    if ds:
        data = _parse_json(ds.data, {})
        logger.info("Migrating personal dashboard...")
        await update_dashboard_from_json(db, data, key="default")
        
        # --- NEW: Extract Progressions (Strength Table / TMs) ---
        # Try both common keys used in older versions
        progressions = data.get("trainingProgressions") or data.get("progressions") or {}
        if progressions:
            logger.info(f"Found {len(progressions)} progressions to migrate.")
            for ex_id, prog_data in progressions.items():
                # Check if exercise exists to avoid FK error
                ex_check = await db.execute(select(Exercise).filter(Exercise.id == ex_id))
                if ex_check.scalar_one_or_none():
                    await update_training_progression(db, ex_id, prog_data)
                else:
                    logger.warning(f"Skipping progression for unknown exercise: {ex_id}")

    # 2. Shared Dashboards
    res_sd = await db.execute(select(SharedDashboard))
    shared_dashboards = res_sd.scalars().all()
    for sd in shared_dashboards:
        logger.info(f"Migrating shared dashboard: {sd.share_id}")
        data = _parse_json(sd.data, {})
        # update_shared_dashboard_from_json handles projects and chat
        await update_shared_dashboard_from_json(db, sd.share_id, data, sd.title)

    # 3. Training Logs (Historical Data)
    if ds:
        data = _parse_json(ds.data, {})
        old_logs = data.get("workoutLogs", [])
        if isinstance(old_logs, list) and old_logs:
            logger.info(f"Found {len(old_logs)} workout logs to migrate.")
            for log_entry in old_logs:
                # Basic structure check to avoid crashes
                tmpl_id = log_entry.get("template_id")
                log_date_str = log_entry.get("logged_at")
                sets_data = log_entry.get("sets", [])
                
                # Convert string date if needed
                log_date = datetime.now(timezone.utc)
                if log_date_str:
                    try: log_date = datetime.fromisoformat(log_date_str.replace("Z", "+00:00"))
                    except: pass
                
                # Check if template exists
                if tmpl_id:
                    t_check = await db.execute(select(WorkoutDayTemplate).filter(WorkoutDayTemplate.id == tmpl_id))
                    if not t_check.scalar_one_or_none(): tmpl_id = None

                new_log = WorkoutLog(template_id=tmpl_id, logged_at=log_date)
                db.add(new_log)
                await db.flush()
                
                for s in sets_data:
                    ex_id = s.get("exercise_id")
                    # Check if exercise exists
                    ex_check = await db.execute(select(Exercise).filter(Exercise.id == ex_id))
                    if ex_check.scalar_one_or_none():
                        db.add(SetLog(
                            workout_log_id=new_log.id,
                            exercise_id=ex_id,
                            set_number=s.get("set_number", 1),
                            weight_kg=float(s.get("weight_kg", 0)),
                            reps=int(s.get("reps", 0)),
                            completed=1 if s.get("completed") else 0
                        ))

    await db.commit()
    return {"status": "ok", "message": "Migration completed"}
