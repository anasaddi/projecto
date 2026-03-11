from datetime import datetime, timezone, date, timedelta, time
import json
import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage, WorkoutLog, SetLog, TrainingProgression,
    Exercise, WorkoutDayTemplate, WorkoutDayExercise, DailySchedule
)
from app.schemas.training import SetLogItem, WeekDayUpdateData

logger = logging.getLogger(__name__)

def _parse_json(val: Any, default: Any = None) -> Any:
    if val is None: return default
    if isinstance(val, (dict, list)): return val
    if isinstance(val, str):
        try: return json.loads(val)
        except Exception: return default
    return default

# --- Dashboard (Aggregated View for Frontend) ---

async def get_dashboard_state_aggregated(db: AsyncSession, key: str = "default"):
    # 1. Habits
    habits_result = await db.execute(select(Habit).order_by(Habit.ordinal))
    habits = habits_result.scalars().all()
    dailyTaskTemplates = [{"id": h.id, "title": h.title, "locked": bool(h.locked), "ordinal": h.ordinal} for h in habits]

    # 2. Habit Logs
    logs_result = await db.execute(select(HabitLog))
    logs = logs_result.scalars().all()
    dailyTaskLogs = {}
    for l in logs:
        if l.date not in dailyTaskLogs: dailyTaskLogs[l.date] = []
        dailyTaskLogs[l.date].append({"id": l.habit_id, "done": bool(l.status)})

    # 3. Quick Tasks
    qt_result = await db.execute(select(QuickTask).order_by(QuickTask.created_at.desc()))
    quickTasks = [{"id": q.id, "title": q.title, "done": bool(q.done), "deadline": q.deadline} for q in qt_result.scalars().all()]

    # 4. Personal Projects
    projs_result = await db.execute(select(Project).filter(Project.share_id == None).order_by(Project.created_at.desc()))
    projs = projs_result.scalars().all()
    
    async def get_task_tree(project_id, parent_id=None):
        res = await db.execute(select(Task).filter(Task.project_id == project_id, Task.parent_id == parent_id).order_by(Task.created_at))
        tree = []
        for t in res.scalars().all():
            tree.append({"id": t.id, "title": t.title, "done": bool(t.done), "deadline": t.deadline, "children": await get_task_tree(project_id, t.id)})
        return tree

    projects = []
    for p in projs:
        projects.append({"id": p.id, "title": p.title, "tasks": await get_task_tree(p.id)})

    # DashboardState for other fields (prayerLogs, etc.)
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    ds_data = _parse_json(ds.data, {}) if ds else {}

    return {
        "dailyTaskTemplates": dailyTaskTemplates,
        "dailyTaskLogs": dailyTaskLogs,
        "projects": projects,
        "quickTasks": quickTasks,
        "prayerLogs": ds_data.get("prayerLogs", {}),
        "top3Manual": ds_data.get("top3Manual", [None, None, None]),
        "dailyCompletionLog": ds_data.get("dailyCompletionLog", {})
    }

async def update_dashboard_from_json(db: AsyncSession, data: dict, key: str = "default"):
    # First, save everything to the DashboardState blob for extra fields (prayerLogs, etc.)
    res_ds = await db.execute(select(DashboardState).filter(DashboardState.key == key))
    ds = res_ds.scalar_one_or_none()
    if not ds:
        ds = DashboardState(key=key, data=data)
        db.add(ds)
    else:
        ds.data = data
    
    # Sync habits
    if "dailyTaskTemplates" in data:
        await db.execute(delete(HabitLog))
        await db.execute(delete(Habit))
        for h in data["dailyTaskTemplates"]:
            db.add(Habit(id=h["id"], title=h["title"], locked=1 if h.get("locked") else 0, ordinal=h.get("ordinal", 0)))
    
    # Sync habit logs
    elif "dailyTaskLogs" in data: # Only delete logs if we didn't delete habits (which already deleted logs)
        await db.execute(delete(HabitLog))
        for d_str, logs in data["dailyTaskLogs"].items():
            for l in logs: db.add(HabitLog(habit_id=l["id"], date=d_str, status=1 if l.get("done") else 0))
    
    # Sync quick tasks
    if "quickTasks" in data:
        await db.execute(delete(QuickTask))
        for q in data["quickTasks"]:
            db.add(QuickTask(id=q["id"], title=q["title"], done=1 if q.get("done") else 0, deadline=q.get("deadline")))
    
    # Sync personal projects
    if "projects" in data:
        # Delete tasks first to avoid FK violation
        p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == None))
        p_ids = p_ids_res.scalars().all()
        if p_ids:
            await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
        await db.execute(delete(Project).filter(Project.share_id == None))
        for p in data["projects"]:
            db.add(Project(id=p["id"], title=p["title"], share_id=None))
            async def add_t(tasks, pid, parent=None):
                for t in tasks:
                    db.add(Task(id=t["id"], project_id=pid, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                    if t.get("children"): await add_t(t["children"], pid, t["id"])
            await add_t(p.get("tasks", []), p["id"])
    
    await db.commit()
    return await get_dashboard_state_aggregated(db, key)

# --- Shared Dashboards ---

async def get_shared_dashboard_aggregated(db: AsyncSession, share_id: str):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    if not shared: return None
    projs_res = await db.execute(select(Project).filter(Project.share_id == share_id))
    async def get_t(pid, parent=None):
        r = await db.execute(select(Task).filter(Task.project_id == pid, Task.parent_id == parent).order_by(Task.created_at))
        return [{"id": t.id, "title": t.title, "done": bool(t.done), "deadline": t.deadline, "children": await get_t(pid, t.id)} for t in r.scalars().all()]
    projects = [{"id": p.id, "title": p.title, "tasks": await get_t(p.id)} for p in projs_res.scalars().all()]
    chat_res = await db.execute(select(ChatMessage).filter(ChatMessage.share_id == share_id).order_by(ChatMessage.timestamp))
    chat = [{"id": m.id, "senderId": m.sender_id, "text": m.text, "timestamp": int(m.timestamp.timestamp()*1000)} for m in chat_res.scalars().all()]
    
    # data can be a list or a dict in the DB
    shared_data = _parse_json(shared.data, {})
    quickTasks = shared_data.get("quickTasks", []) if isinstance(shared_data, dict) else []

    return {
        "share_id": shared.share_id,
        "title": shared.title,
        "data": {
            "projects": projects,
            "quickTasks": quickTasks,
            "chat": chat
        },
        "updated_at": shared.updated_at
    }

async def update_shared_dashboard_from_json(db: AsyncSession, share_id: str, data: dict | list, title: str | None = None):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    
    # Se data è una lista (vecchio formato), la convertiamo internamente
    if isinstance(data, list):
        data = {"projects": data, "quickTasks": [], "chat": []}

    if not shared:
        shared = SharedDashboard(share_id=share_id, title=title or "Progetti Condivisi", data=data)
        db.add(shared)
    else:
        if title: shared.title = title
        shared.data = data # Keep the blob for non-relational fields if needed
    
    # Sync relational tables
    p_ids_res = await db.execute(select(Project.id).filter(Project.share_id == share_id))
    p_ids = p_ids_res.scalars().all()
    if p_ids:
        await db.execute(delete(Task).filter(Task.project_id.in_(p_ids)))
    await db.execute(delete(Project).filter(Project.share_id == share_id))
    p_data = data.get("projects", [])
    for p in p_data:
        db.add(Project(id=p["id"], title=p["title"], share_id=share_id))
        async def add_t(tasks, pid, parent=None):
            for t in tasks:
                db.add(Task(id=t["id"], project_id=pid, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                if t.get("children"): await add_t(t["children"], pid, t["id"])
        await add_t(p.get("tasks", []), p["id"])
    
    if "chat" in data:
        await db.execute(delete(ChatMessage).filter(ChatMessage.share_id == share_id))
        for msg in data["chat"]:
            db.add(ChatMessage(id=msg["id"], share_id=share_id, sender_id=msg["senderId"], text=msg["text"], 
                               timestamp=datetime.fromtimestamp(msg["timestamp"]/1000, tz=timezone.utc) if msg.get("timestamp") else datetime.now(timezone.utc)))
    
    await db.commit()
    return await get_shared_dashboard_aggregated(db, share_id)

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    return [await get_shared_dashboard_aggregated(db, sd.share_id) for sd in res.scalars().all()]

# --- Migration Logic ---

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

async def get_all_exercises(db: AsyncSession):
    try:
        res = await db.execute(select(Exercise))
        exercises = res.scalars().all()
        out = []
        for ex in exercises:
            d = {
                "id": str(ex.id) if ex.id else "",
                "name": str(ex.name) if ex.name else "Unnamed",
                "category": str(ex.category) if ex.category else "HYPERTROPHY",
                "primary_muscles": _parse_json(ex.primary_muscles, []),
                "secondary_muscles": _parse_json(ex.secondary_muscles, []),
                "cns_fatigue": float(ex.cns_fatigue) if ex.cns_fatigue is not None else 0.0,
                "joint_stress": _parse_json(ex.joint_stress, {}),
                "is_active": int(ex.is_active) if ex.is_active is not None else 1
            }
            out.append(d)
        return out
    except Exception as e:
        logger.error(f"Error in get_all_exercises: {e}")
        return []

async def get_today_template(db: AsyncSession, for_date: date | None = None):
    target = for_date or date.today()
    dt = datetime.combine(target, time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == dt))
    sched = res.scalar_one_or_none()
    if sched and sched.template_id:
        r = await db.execute(select(WorkoutDayTemplate).filter(WorkoutDayTemplate.id == sched.template_id))
        return r.scalar_one_or_none()
    return None

async def get_today_exercises_grouped(db: AsyncSession, for_date: date | None = None):
    template = await get_today_template(db, for_date)
    if not template: return [], []
    res = await db.execute(select(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == template.id).order_by(WorkoutDayExercise.ordinal))
    exercises = res.scalars().all()
    hyp, str_aw = [], []
    for we in exercises:
        ex_res = await db.execute(select(Exercise).filter(Exercise.id == we.exercise_id))
        ex = ex_res.scalar_one_or_none()
        if not ex: continue
        d = {
            "exercise_id": ex.id, "exercise_name": we.custom_name or ex.name, "category": ex.category,
            "instruction": we.instruction, "base_sets": we.base_sets, "base_reps": we.base_reps,
            "primary_muscles": _parse_json(ex.primary_muscles, []), 
            "secondary_muscles": _parse_json(ex.secondary_muscles, []),
            "cns_fatigue": ex.cns_fatigue, 
            "joint_stress": _parse_json(ex.joint_stress, {}), 
            "is_active": ex.is_active
        }
        if ex.category == "HYPERTROPHY": hyp.append(d)
        else: str_aw.append(d)
    return hyp, str_aw

async def get_week_templates(db: AsyncSession):
    try:
        res = await db.execute(select(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday))
        days = []
        for t in res.scalars().all():
            ex_res = await db.execute(select(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == t.id).order_by(WorkoutDayExercise.ordinal))
            exercises = []
            for we in ex_res.scalars().all():
                e_res = await db.execute(select(Exercise).filter(Exercise.id == we.exercise_id))
                e = e_res.scalar_one_or_none()
                if e: 
                    exercises.append({
                        "exercise_id": str(e.id),
                        "exercise_name": str(we.custom_name or e.name),
                        "category": str(e.category),
                        "instruction": str(we.instruction or "") if we.instruction else "",
                        "base_sets": int(we.base_sets) if we.base_sets is not None else 4,
                        "base_reps": int(we.base_reps) if we.base_reps is not None else 0,
                        "primary_muscles": _parse_json(e.primary_muscles, []),
                        "secondary_muscles": _parse_json(e.secondary_muscles, []),
                        "cns_fatigue": float(e.cns_fatigue) if e.cns_fatigue is not None else 0.0,
                        "joint_stress": _parse_json(e.joint_stress, {}),
                        "is_active": int(e.is_active) if e.is_active is not None else 1
                    })
            days.append({
                "template_id": str(t.id),
                "day_name": str(t.day_name),
                "weekday": int(t.weekday) if t.weekday is not None else 0,
                "exercises": exercises
            })
        return days
    except Exception as e:
        logger.error(f"Error in get_week_templates: {e}")
        return []

async def update_week_templates(db: AsyncSession, days: list[WeekDayUpdateData]):
    for d in days:
        await db.execute(delete(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == d.template_id))
        for i, ex in enumerate(d.exercises):
            db.add(WorkoutDayExercise(template_id=d.template_id, exercise_id=ex.exercise_id, custom_name=ex.custom_name, 
                                      instruction=ex.instruction, base_sets=ex.base_sets or 4, base_reps=ex.base_reps, ordinal=i))
    await db.commit()

async def update_exercise_active(db: AsyncSession, ex_id: str, active: int):
    await db.execute(update(Exercise).where(Exercise.id == ex_id).values(is_active=active))
    await db.commit()
    return True

async def update_day_exercise(db: AsyncSession, template_id: str, exercise_id: str, **kwargs):
    filtered = {k: v for k, v in kwargs.items() if v is not None}
    if filtered:
        await db.execute(update(WorkoutDayExercise).where(WorkoutDayExercise.template_id == template_id, 
                                                         WorkoutDayExercise.exercise_id == exercise_id).values(**filtered))
        await db.commit()
    return True

async def get_exercise_history(db: AsyncSession, exercise_id: str, limit: int = 15):
    res = await db.execute(select(WorkoutLog).order_by(WorkoutLog.logged_at.desc()))
    entries = []
    for log in res.scalars().all():
        s_res = await db.execute(select(SetLog).filter(SetLog.workout_log_id == log.id, SetLog.exercise_id == exercise_id).order_by(SetLog.set_number))
        sets = s_res.scalars().all()
        for s in sets:
            entries.append({"date": log.logged_at.strftime("%Y-%m-%d"), "weight_kg": s.weight_kg, "reps": s.reps, "completed": bool(s.completed)})
        if len(entries) >= limit: break
    return {"exercise_id": exercise_id, "entries": entries}

async def create_workout_log(db: AsyncSession, template_id: str | None, sets: list[SetLogItem]):
    log = WorkoutLog(template_id=template_id, logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.flush()
    for s in sets:
        db.add(SetLog(workout_log_id=log.id, exercise_id=s.exercise_id, set_number=s.set_number, 
                      weight_kg=s.weight_kg, reps=s.reps, completed=1 if s.completed else 0))
    await db.commit()
    return log

def _sanitize_progression_data(data: Any) -> dict:
    if not isinstance(data, dict):
        data = {}
    if "tmByMonth" not in data or not isinstance(data["tmByMonth"], list):
        data["tmByMonth"] = [{"anas": "", "flavio": ""} for _ in range(5)]
    if "dataByMonth" not in data or not isinstance(data["dataByMonth"], list):
        data["dataByMonth"] = [[{"week": w, "anas": {"weight": "", "reps": "", "completed": False}, "flavio": {"weight": "", "reps": "", "completed": False}} for w in [1, 2, 3, 4]] for _ in range(6)]
    return data

async def get_all_progressions(db: AsyncSession):
    res = await db.execute(select(TrainingProgression))
    return [{"exercise_id": p.exercise_id, "data": _sanitize_progression_data(_parse_json(p.data, {})), "updated_at": p.updated_at} for p in res.scalars().all()]

async def get_training_progression(db: AsyncSession, ex_id: str):
    res = await db.execute(select(TrainingProgression).filter(TrainingProgression.exercise_id == ex_id))
    p = res.scalar_one_or_none()
    if not p: return None
    return {"exercise_id": p.exercise_id, "data": _sanitize_progression_data(_parse_json(p.data, {})), "updated_at": p.updated_at}

async def update_training_progression(db: AsyncSession, ex_id: str, data: dict):
    res = await db.execute(select(TrainingProgression).filter(TrainingProgression.exercise_id == ex_id))
    prog = res.scalar_one_or_none()
    
    # Ensure the data has the minimum required structure for the frontend
    data = _sanitize_progression_data(data)

    if not prog:
        prog = TrainingProgression(exercise_id=ex_id, data=data)
        db.add(prog)
    else: 
        prog.data = data
    await db.commit()
    return prog

async def get_daily_schedule(db: AsyncSession, start_date: date, days_count: int = 14):
    t_res = await db.execute(select(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday))
    templates = t_res.scalars().all()
    if not templates:
        return [DailySchedule(date_=datetime.combine(start_date + timedelta(days=i), time.min), template_id=None, is_completed=0) for i in range(days_count)]
    
    last_c_res = await db.execute(select(DailySchedule).filter(DailySchedule.is_completed == 1).order_by(DailySchedule.date_.desc()))
    last_completed = last_c_res.scalar_one_or_none()
    last_w_res = await db.execute(select(DailySchedule).filter(DailySchedule.is_completed == 1, DailySchedule.template_id.is_not(None)).order_by(DailySchedule.date_.desc()))
    last_workout = last_w_res.scalar_one_or_none()

    today = date.today()
    next_t_idx, base_date = 0, today
    if last_workout:
        try:
            l_idx = next(i for i, t in enumerate(templates) if t.id == last_workout.template_id)
            next_t_idx = (l_idx + 1) % len(templates)
        except StopIteration: pass
    if last_completed:
        base_date = max(last_completed.date_.date() + timedelta(days=1), today)

    today_dt = datetime.combine(today, time.min)
    await db.execute(delete(DailySchedule).filter(DailySchedule.date_ >= today_dt, DailySchedule.is_completed == 0))
    
    t_ptr = 0
    for i in range(days_count * 3):
        curr_d = base_date + timedelta(days=i)
        if curr_d.weekday() == 6: continue
        curr_dt = datetime.combine(curr_d, time.min)
        ex_res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == curr_dt))
        if ex_res.scalar_one_or_none(): continue
        t = templates[(next_t_idx + t_ptr) % len(templates)]
        db.add(DailySchedule(date_=curr_dt, template_id=t.id, is_completed=0))
        t_ptr += 1
        if t_ptr >= days_count * 2: break
    await db.commit()

    s_dt = datetime.combine(start_date, time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ >= s_dt, DailySchedule.date_ < s_dt + timedelta(days=days_count)))
    s_map = {s.date_.date(): s for s in res.scalars().all()}
    return [s_map.get(start_date + timedelta(days=i), DailySchedule(date_=datetime.combine(start_date + timedelta(days=i), time.min), template_id=None, is_completed=0)) for i in range(days_count)]

async def update_daily_schedule_completion(db: AsyncSession, s_date: date, completed: bool):
    dt = datetime.combine(s_date, time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == dt))
    sched = res.scalar_one_or_none()
    if sched:
        sched.is_completed = 1 if completed else 0
        await db.commit()
    return sched
