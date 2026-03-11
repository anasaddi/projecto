from datetime import datetime, timezone, date, timedelta, time
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.db.models import (
    DashboardState, SharedDashboard, Project, Task, QuickTask, 
    Habit, HabitLog, ChatMessage, WorkoutLog, SetLog, TrainingProgression,
    Exercise, WorkoutDayTemplate, WorkoutDayExercise, DailySchedule
)
from app.schemas.training import SetLogItem, WeekDayUpdateData

logger = logging.getLogger(__name__)

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

    return {
        "dailyTaskTemplates": dailyTaskTemplates,
        "dailyTaskLogs": dailyTaskLogs,
        "projects": projects,
        "quickTasks": quickTasks,
        "prayerLogs": {}, "top3Manual": [None, None, None], "dailyCompletionLog": {}
    }

async def update_dashboard_from_json(db: AsyncSession, data: dict, key: str = "default"):
    if "dailyTaskTemplates" in data:
        await db.execute(delete(Habit))
        for h in data["dailyTaskTemplates"]:
            db.add(Habit(id=h["id"], title=h["title"], locked=1 if h.get("locked") else 0, ordinal=h.get("ordinal", 0)))
    if "dailyTaskLogs" in data:
        await db.execute(delete(HabitLog))
        for d_str, logs in data["dailyTaskLogs"].items():
            for l in logs: db.add(HabitLog(habit_id=l["id"], date=d_str, status=1 if l.get("done") else 0))
    if "quickTasks" in data:
        await db.execute(delete(QuickTask))
        for q in data["quickTasks"]:
            db.add(QuickTask(id=q["id"], title=q["title"], done=1 if q.get("done") else 0, deadline=q.get("deadline")))
    if "projects" in data:
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
    return {"share_id": shared.share_id, "title": shared.title, "data": {"projects": projects, "quickTasks": [], "chat": chat}, "updated_at": shared.updated_at}

async def update_shared_dashboard_from_json(db: AsyncSession, share_id: str, data: dict, title: str | None = None):
    res = await db.execute(select(SharedDashboard).filter(SharedDashboard.share_id == share_id))
    shared = res.scalar_one_or_none()
    if not shared:
        shared = SharedDashboard(share_id=share_id, title=title or "Progetti Condivisi")
        db.add(shared)
    elif title: shared.title = title
    await db.execute(delete(Project).filter(Project.share_id == share_id))
    p_data = data.get("projects", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    for p in p_data:
        db.add(Project(id=p["id"], title=p["title"], share_id=share_id))
        async def add_t(tasks, pid, parent=None):
            for t in tasks:
                db.add(Task(id=t["id"], project_id=pid, parent_id=parent, title=t["title"], done=1 if t.get("done") else 0, deadline=t.get("deadline")))
                if t.get("children"): await add_t(t["children"], pid, t["id"])
        await add_t(p.get("tasks", []), p["id"])
    if isinstance(data, dict) and "chat" in data:
        await db.execute(delete(ChatMessage).filter(ChatMessage.share_id == share_id))
        for msg in data["chat"]:
            db.add(ChatMessage(id=msg["id"], share_id=share_id, sender_id=msg["senderId"], text=msg["text"], 
                               timestamp=datetime.fromtimestamp(msg["timestamp"]/1000, tz=timezone.utc) if msg.get("timestamp") else datetime.now(timezone.utc)))
    await db.commit()
    return await get_shared_dashboard_aggregated(db, share_id)

async def get_all_shared_dashboards_aggregated(db: AsyncSession):
    res = await db.execute(select(SharedDashboard).order_by(SharedDashboard.updated_at.desc()))
    return [await get_shared_dashboard_aggregated(db, sd.share_id) for sd in res.scalars().all()]

# --- Training Async CRUD ---

async def get_all_exercises(db: AsyncSession):
    res = await db.execute(select(Exercise))
    return res.scalars().all()

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
            "primary_muscles": ex.primary_muscles, "secondary_muscles": ex.secondary_muscles,
            "cns_fatigue": ex.cns_fatigue, "joint_stress": ex.joint_stress, "is_active": ex.is_active
        }
        if ex.category == "HYPERTROPHY": hyp.append(d)
        else: str_aw.append(d)
    return hyp, str_aw

async def get_week_templates(db: AsyncSession):
    res = await db.execute(select(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday))
    days = []
    for t in res.scalars().all():
        ex_res = await db.execute(select(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == t.id).order_by(WorkoutDayExercise.ordinal))
        exercises = []
        for we in ex_res.scalars().all():
            e_res = await db.execute(select(Exercise).filter(Exercise.id == we.exercise_id))
            e = e_res.scalar_one_or_none()
            if e: exercises.append({
                "exercise_id": e.id, "exercise_name": we.custom_name or e.name, "category": e.category,
                "instruction": we.instruction, "base_sets": we.base_sets, "base_reps": we.base_reps
            })
        days.append({"template_id": t.id, "day_name": t.day_name, "weekday": t.weekday, "exercises": exercises})
    return days

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

async def get_all_progressions(db: AsyncSession):
    res = await db.execute(select(TrainingProgression))
    return res.scalars().all()

async def get_training_progression(db: AsyncSession, ex_id: str):
    res = await db.execute(select(TrainingProgression).filter(TrainingProgression.exercise_id == ex_id))
    return res.scalar_one_or_none()

async def update_training_progression(db: AsyncSession, ex_id: str, data: dict):
    res = await db.execute(select(TrainingProgression).filter(TrainingProgression.exercise_id == ex_id))
    prog = res.scalar_one_or_none()
    if not prog:
        prog = TrainingProgression(exercise_id=ex_id, data=data)
        db.add(prog)
    else: prog.data = data
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
