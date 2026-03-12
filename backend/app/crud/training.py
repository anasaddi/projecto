from datetime import datetime, timezone, date, timedelta, time
import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.db.models import (
    WorkoutLog, SetLog, TrainingProgression,
    Exercise, WorkoutDayTemplate, WorkoutDayExercise, DailySchedule
)
from app.schemas.training import SetLogItem, WeekDayUpdateData
from app.crud.base import _parse_json
from app.crud.progression_schema import sanitize_strength_progression, sanitize_generic_progression

logger = logging.getLogger(__name__)

# --- Training Management ---

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
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == dt).limit(1))
    sched = res.scalar_one_or_none()
    if sched and sched.template_id:
        r = await db.execute(select(WorkoutDayTemplate).filter(WorkoutDayTemplate.id == sched.template_id).limit(1))
        return r.scalar_one_or_none()
    return None

async def get_today_exercises_grouped(db: AsyncSession, for_date: date | None = None):
    template = await get_today_template(db, for_date)
    if not template: return [], []
    res = await db.execute(select(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == template.id).order_by(WorkoutDayExercise.ordinal))
    exercises = res.scalars().all()
    hyp, str_aw = [], []
    for we in exercises:
        ex_res = await db.execute(select(Exercise).filter(Exercise.id == we.exercise_id).limit(1))
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
                e_res = await db.execute(select(Exercise).filter(Exercise.id == we.exercise_id).limit(1))
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

# --- Progressions & Sanitization ---

def _sanitize_progression_data(data: Any, category: str | None = None) -> dict:
    if category == "STRENGTH":
        return sanitize_strength_progression(data)
    return sanitize_generic_progression(data)

async def get_all_progressions(db: AsyncSession):
    res = await db.execute(select(TrainingProgression, Exercise.category).join(Exercise, Exercise.id == TrainingProgression.exercise_id).order_by(TrainingProgression.updated_at.desc()))
    rows = res.all()
    seen = set()
    out = []
    for p, category in rows:
        if p.exercise_id in seen:
            continue
        seen.add(p.exercise_id)
        out.append({
            "exercise_id": p.exercise_id,
            "data": _sanitize_progression_data(_parse_json(p.data, {}), category),
            "updated_at": p.updated_at
        })
    return out

async def get_training_progression(db: AsyncSession, ex_id: str):
    res = await db.execute(
        select(TrainingProgression, Exercise.category)
        .join(Exercise, Exercise.id == TrainingProgression.exercise_id)
        .filter(TrainingProgression.exercise_id == ex_id)
        .limit(1)
    )
    row = res.first()
    if not row:
        return None
    p, category = row
    return {"exercise_id": p.exercise_id, "data": _sanitize_progression_data(_parse_json(p.data, {}), category), "updated_at": p.updated_at}

async def update_training_progression(db: AsyncSession, ex_id: str, data: dict):
    ex_res = await db.execute(select(Exercise).filter(Exercise.id == ex_id))
    exercise = ex_res.scalar_one_or_none()
    if not exercise:
        raise ValueError(f"Exercise not found: {ex_id}")

    res = await db.execute(select(TrainingProgression).filter(TrainingProgression.exercise_id == ex_id).limit(1))
    prog = res.scalar_one_or_none()
    
    # Ensure the data has a strict structure for the frontend
    data = _sanitize_progression_data(data, exercise.category)

    if not prog:
        prog = TrainingProgression(exercise_id=ex_id, data=data)
        db.add(prog)
    else: 
        prog.data = data
    await db.commit()
    return prog

# --- Schedule Management ---

async def get_daily_schedule(db: AsyncSession, start_date: date, days_count: int = 14):
    t_res = await db.execute(select(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday))
    templates = t_res.scalars().all()
    if not templates:
        return [DailySchedule(date_=datetime.combine(start_date + timedelta(days=i), time.min), template_id=None, is_completed=0) for i in range(days_count)]
    
    # 1. Clean ALL future incomplete entries to prevent "dead zones"
    today = date.today()
    today_dt = datetime.combine(today, time.min)
    await db.execute(delete(DailySchedule).filter(DailySchedule.date_ >= today_dt, DailySchedule.is_completed == 0))
    await db.flush()

    # 2. Get last completed workout to determine next template
    last_w_res = await db.execute(
        select(DailySchedule)
        .filter(DailySchedule.is_completed == 1, DailySchedule.template_id.is_not(None))
        .order_by(DailySchedule.date_.desc())
        .limit(1)
    )
    last_workout = last_w_res.scalar_one_or_none()

    next_t_idx = 0
    if last_workout:
        try:
            l_idx = next(i for i, t in enumerate(templates) if t.id == last_workout.template_id)
            next_t_idx = (l_idx + 1) % len(templates)
        except StopIteration: pass

    # 3. Fill gaps starting from today
    # We use a set of existing dates (completed ones) to avoid adding duplicates
    existing_res = await db.execute(select(DailySchedule.date_).filter(DailySchedule.is_completed == 1))
    existing_dates = {r[0].date() if isinstance(r[0], datetime) else r[0] for r in existing_res.all()}

    t_ptr = 0
    # Generate enough workouts to cover the request plus some buffer
    for i in range(days_count * 4):
        curr_d = today + timedelta(days=i)
        if curr_d.weekday() == 6: continue # Skip Sunday
        if curr_d in existing_dates: continue
        
        t = templates[(next_t_idx + t_ptr) % len(templates)]
        db.add(DailySchedule(date_=datetime.combine(curr_d, time.min), template_id=t.id, is_completed=0))
        t_ptr += 1
        if t_ptr >= days_count * 2: break
    
    await db.commit()

    # 4. Return the requested window
    s_dt = datetime.combine(start_date, time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ >= s_dt, DailySchedule.date_ < s_dt + timedelta(days=days_count)))
    s_map = {s.date_.date(): s for s in res.scalars().all()}
    return [s_map.get(start_date + timedelta(days=i), DailySchedule(date_=datetime.combine(start_date + timedelta(days=i), time.min), template_id=None, is_completed=0)) for i in range(days_count)]

async def update_daily_schedule_completion(db: AsyncSession, s_date: date, completed: bool):
    dt = datetime.combine(s_date, time.min)
    res = await db.execute(select(DailySchedule).filter(DailySchedule.date_ == dt).limit(1))
    sched = res.scalar_one_or_none()
    if sched:
        sched.is_completed = 1 if completed else 0
        await db.commit()
    return sched
