import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise, WorkoutLog, SetLog, TrainingProgression


def _seed_path() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "training_seed.json"


async def sync_missing_exercises(db: AsyncSession) -> int:
    """Insert exercises from training_seed.json that are missing from the DB. Safe to run on a live DB. Returns number of new exercises added."""
    path = _seed_path()
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    seed_exercises = data.get("exercises", [])
    if not seed_exercises:
        return 0

    res = await db.execute(select(Exercise.id))
    existing_ids = {row[0] for row in res.all()}

    added = 0
    for ex in seed_exercises:
        if ex["id"] not in existing_ids:
            db.add(Exercise(
                id=ex["id"],
                name=ex["name"],
                category=ex["category"],
                primary_muscles=ex.get("primary_muscles", []),
                secondary_muscles=ex.get("secondary_muscles", []),
                cns_fatigue=float(ex.get("cns_fatigue", 0)),
                joint_stress=ex.get("joint_stress", {}),
            ))
            added += 1

    if added:
        await db.commit()
    return added


async def seed_training_if_empty(db: AsyncSession) -> int:
    """Seed exercises and day templates from training_seed.json if no exercises exist. Returns number of exercises seeded."""
    count_res = await db.execute(select(func.count(Exercise.id)))
    exercises_exist = count_res.scalar() > 0

    tmpl_count = await db.execute(select(func.count(WorkoutDayTemplate.id)))
    templates_exist = tmpl_count.scalar() > 0

    if exercises_exist and templates_exist:
        return 0

    path = _seed_path()
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))

    if not exercises_exist:
        for ex in data.get("exercises", []):
            db.add(Exercise(
                id=ex["id"],
                name=ex["name"],
                category=ex["category"],
                primary_muscles=ex.get("primary_muscles", []),
                secondary_muscles=ex.get("secondary_muscles", []),
                cns_fatigue=float(ex.get("cns_fatigue", 0)),
                joint_stress=ex.get("joint_stress", {}),
            ))

    if not templates_exist:
        for tmpl in data.get("day_templates", []):
            db.add(WorkoutDayTemplate(
                id=tmpl["id"],
                day_name=tmpl["day_name"],
                weekday=tmpl.get("weekday"),
            ))

        await db.commit()

        ex_categories = {e["id"]: e.get("category") for e in data.get("exercises", [])}
        for tmpl in data.get("day_templates", []):
            for ord_val, ex in enumerate(tmpl.get("exercises", [])):
                ex_id = ex.get("exercise_id") if isinstance(ex, dict) else ex
                default_sets = 2 if ex_categories.get(ex_id) == "HYPERTROPHY" else 4
                base_sets = ex.get("base_sets", default_sets) if isinstance(ex, dict) else default_sets
                base_reps = ex.get("base_reps") if isinstance(ex, dict) else None
                db.add(WorkoutDayExercise(
                    template_id=tmpl["id"],
                    exercise_id=ex_id,
                    base_sets=base_sets,
                    base_reps=base_reps,
                    instruction=ex.get("instruction") if isinstance(ex, dict) else None,
                    custom_name=ex.get("custom_name") if isinstance(ex, dict) else None,
                    ordinal=ord_val,
                ))
        await db.commit()

    return len(data.get("exercises", [])) if not exercises_exist else 0


async def seed_fake_history(db: AsyncSession, *, force: bool = False) -> int:
    """Seed fake workout history for HYPERTROPHY exercises. Returns number of logs created.
    If force=False (default), skips when WorkoutLog already exists. Use force=True to add anyway."""
    count_res = await db.execute(select(func.count(WorkoutLog.id)))
    if not force and count_res.scalar() > 0:
        return 0
    
    hyp_res = await db.execute(select(Exercise.id).filter(Exercise.category == "HYPERTROPHY"))
    hyp_ids = [r[0] for r in hyp_res.all()]
    if not hyp_ids:
        return 0
    
    tmpl_res = await db.execute(select(WorkoutDayTemplate))
    template = tmpl_res.scalars().first()
    template_id = template.id if template else None

    # Fake data: exercise_id -> list of (weight, reps) for ~10 sessions
    fake_data = {
        "inc_db_press": [(18, 12), (20, 10), (20, 11), (22, 10), (22, 10), (20, 12), (22, 10), (24, 8), (22, 10), (24, 9)],
        "rear_raise": [(8, 15), (9, 12), (9, 14), (10, 12), (10, 13), (9, 15), (10, 12), (11, 10), (10, 12), (11, 11)],
        "lat_raise": [(6, 15), (7, 12), (7, 14), (8, 12), (8, 13), (7, 15), (8, 12), (9, 10), (8, 12), (9, 11)],
        "ez_bar_reverse_curl": [(12, 12), (14, 10), (14, 11), (16, 10), (16, 10), (14, 12), (16, 10), (18, 8), (16, 10), (18, 9)],
        "curl_ez": [(14, 12), (16, 10), (16, 11), (18, 10), (18, 10), (16, 12), (18, 10), (20, 8), (18, 10), (20, 9)],
        "bp_el": [(12, 15), (14, 12), (14, 14), (16, 12), (16, 13), (14, 15), (16, 12), (18, 10), (16, 12), (18, 11)],
        "bp_pause": [(40, 8), (42, 6), (42, 7), (44, 6), (44, 6), (42, 8), (44, 6), (46, 5), (44, 6), (46, 5)],
        "sq_hypertrophy": [(60, 12), (65, 10), (65, 11), (70, 10), (70, 10), (65, 12), (70, 10), (75, 8), (70, 10), (75, 9)],
        "jm_press": [(25, 12), (28, 10), (28, 11), (30, 10), (30, 10), (28, 12), (30, 10), (32, 8), (30, 10), (32, 9)],
        "flyes": [(10, 15), (12, 12), (12, 14), (14, 12), (14, 13), (12, 15), (14, 12), (16, 10), (14, 12), (16, 11)],
    }

    now = datetime.now(timezone.utc)
    count = 0
    for i in range(10):
        log_date = now - timedelta(days=i * 3)  # ogni 3 giorni
        log = WorkoutLog(template_id=template_id, logged_at=log_date)
        db.add(log)
        await db.flush()
        count += 1
        for ex_id in hyp_ids[:6]:
            data = fake_data.get(ex_id, [(10, 12)])
            w, r = data[min(i, len(data) - 1)]
            for set_num in [1, 2]:
                db.add(SetLog(
                    workout_log_id=log.id,
                    exercise_id=ex_id,
                    set_number=set_num,
                    weight_kg=float(w),
                    reps=r,
                    completed=1,
                ))

    await db.commit()
    return count


async def seed_fake_progressions(db: AsyncSession, *, force: bool = False) -> int:
    """Seed fake training progressions (Strength Table) for STRENGTH exercises. Returns number of progressions created."""
    count_res = await db.execute(select(func.count(TrainingProgression.id)))
    if not force and count_res.scalar() > 0:
        return 0
    
    str_res = await db.execute(select(Exercise.id).filter(Exercise.category == "STRENGTH"))
    str_ids = [r[0] for r in str_res.all()]
    if not str_ids:
        return 0
    
    # Example data for StrengthTable2 (5/3/1 or similar TMs)
    def _create_empty_data_by_month():
        return [
            [
                {"week": w, "anas": {"weight": "", "reps": "", "completed": False}, "flavio": {"weight": "", "reps": "", "completed": False}}
                for w in [1, 2, 3, 4]
            ]
            for _ in range(6)
        ]

    fake_prog = {
        "sq_str": {"tmAnas": 80, "tmFlavio": 70, "tmByMonth": [{"anas": "", "flavio": ""} for _ in range(5)], "dataByMonth": _create_empty_data_by_month()},
        "bp_str": {"tmAnas": 60, "tmFlavio": 50, "tmByMonth": [{"anas": "", "flavio": ""} for _ in range(5)], "dataByMonth": _create_empty_data_by_month()},
        "dl_str": {"tmAnas": 100, "tmFlavio": 90, "tmByMonth": [{"anas": "", "flavio": ""} for _ in range(5)], "dataByMonth": _create_empty_data_by_month()},
        "ohp_str": {"tmAnas": 40, "tmFlavio": 35, "tmByMonth": [{"anas": "", "flavio": ""} for _ in range(5)], "dataByMonth": _create_empty_data_by_month()},
    }

    count = 0
    for ex_id in str_ids:
        data = fake_prog.get(ex_id, {
            "tmAnas": 50, 
            "tmFlavio": 50, 
            "tmByMonth": [{"anas": "", "flavio": ""} for _ in range(5)],
            "dataByMonth": _create_empty_data_by_month()
        })
        db.add(TrainingProgression(exercise_id=ex_id, data=data))
        count += 1
    
    await db.commit()
    return count
