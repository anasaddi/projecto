from datetime import datetime, date, time, timezone
from typing import Optional
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

from app.db.models import (
    Exercise,
    WorkoutDayTemplate,
    WorkoutDayExercise,
    WorkoutLog,
    SetLog,
)
from app.schemas.training import TemplateExerciseOut, SetLogItem


def get_today_template(db: Session, for_date: Optional[date] = None) -> Optional[WorkoutDayTemplate]:
    """Return the template for the given weekday (0=Monday .. 6=Sunday). Default: today. If none, returns first available (fallback)."""
    d = for_date or date.today()
    weekday = d.weekday()
    template = db.query(WorkoutDayTemplate).filter(WorkoutDayTemplate.weekday == weekday).first()
    if template:
        return template
    # Fallback: mostra comunque un template così la pagina non è vuota
    return db.query(WorkoutDayTemplate).order_by(WorkoutDayTemplate.id).first()


def get_today_exercises_grouped(db: Session, for_date: Optional[date] = None):
    """Returns (hypertrophy_exercises, strength_aw_exercises) for the frontend grid."""
    template = get_today_template(db, for_date)
    if not template:
        return [], []

    hypertrophy = []
    strength_aw = []
    for wde in template.exercises:
        ex = wde.exercise
        out = TemplateExerciseOut(
            exercise_id=ex.id,
            exercise_name=(wde.custom_name or ex.name),
            category=ex.category,
            instruction=wde.instruction,
            base_sets=wde.base_sets,
            base_reps=wde.base_reps,
            primary_muscles=ex.primary_muscles or [],
            secondary_muscles=ex.secondary_muscles or [],
            cns_fatigue=ex.cns_fatigue,
            joint_stress=ex.joint_stress or {},
            is_active=ex.is_active,
        )
        if ex.category == "HYPERTROPHY":
            hypertrophy.append(out)
        else:
            strength_aw.append(out)

    return hypertrophy, strength_aw


def get_all_exercises(db: Session):
    """Return all exercises for the muscle-exercise matrix."""
    return db.query(Exercise).order_by(Exercise.category, Exercise.name).all()


def update_exercise_primary_muscles(db: Session, exercise_id: str, primary_muscles: list[str]) -> bool:
    """Update primary_muscles for an exercise."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        return False
    ex.primary_muscles = primary_muscles or []
    db.commit()
    return True


def update_exercise_active(db: Session, exercise_id: str, is_active: int) -> bool:
    """Enable/disable an exercise globally."""
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        return False
    ex.is_active = is_active
    db.commit()
    return True


def get_week_templates(db: Session):
    """Returns all templates ordered by weekday."""
    db.expire_all()  # Forza ricaricamento dei dati dal DB per evitare cache obsoleta
    templates = db.query(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday).all()
    week_data = []
    for tmpl in templates:
        exercises_out = []
        for wde in tmpl.exercises:
            ex = wde.exercise
            exercises_out.append(
                TemplateExerciseOut(
                    exercise_id=ex.id,
                    exercise_name=(wde.custom_name or ex.name),
                    category=ex.category,
                    instruction=wde.instruction,
                    base_sets=wde.base_sets,
                    base_reps=wde.base_reps,
                    primary_muscles=ex.primary_muscles or [],
                    secondary_muscles=ex.secondary_muscles or [],
                    cns_fatigue=ex.cns_fatigue,
                    joint_stress=ex.joint_stress or {},
                    is_active=ex.is_active,
                )
            )
        week_data.append({
            "template_id": tmpl.id,
            "day_name": tmpl.day_name,
            "weekday": tmpl.weekday,
            "exercises": exercises_out
        })
    return week_data

def update_day_exercise(
    db: Session,
    template_id: str,
    exercise_id: str,
    custom_name: str | None = None,
    instruction: str | None = None,
    base_sets: int | None = None,
    base_reps: int | None = None,
) -> bool:
    """Update custom_name/instruction/base_sets/base_reps for an exercise in a day template."""
    wde = (
        db.query(WorkoutDayExercise)
        .filter(
            WorkoutDayExercise.template_id == template_id,
            WorkoutDayExercise.exercise_id == exercise_id,
        )
        .first()
    )
    if not wde:
        return False
    if custom_name is not None:
        wde.custom_name = custom_name.strip() or None
    if instruction is not None:
        wde.instruction = instruction
    if base_sets is not None:
        wde.base_sets = base_sets
    if base_reps is not None:
        wde.base_reps = base_reps
    db.commit()
    return True


def update_week_templates(db: Session, updates: list):
    """Updates the exercises for each template, preserving custom_name/instruction/base_sets/base_reps."""
    for update in updates:
        template_id = update.template_id
        db.query(WorkoutDayExercise).filter(WorkoutDayExercise.template_id == template_id).delete()
        for ordinal, item in enumerate(update.exercises):
            ex = db.query(Exercise).filter(Exercise.id == item.exercise_id).first()
            default_sets = 2 if ex and ex.category == "HYPERTROPHY" else 4
            base_sets = item.base_sets if item.base_sets is not None else default_sets
            db.add(WorkoutDayExercise(
                template_id=template_id,
                exercise_id=item.exercise_id,
                ordinal=ordinal,
                custom_name=None if item.custom_name is None else (item.custom_name.strip() or None),
                instruction=item.instruction,
                base_sets=base_sets,
                base_reps=item.base_reps,
            ))
    db.commit()


def get_exercise_history(db: Session, exercise_id: str, limit: int = 20):
    """Return past workout entries for an exercise, one per session (date)."""
    from sqlalchemy import func
    from app.schemas.training import ExerciseHistoryEntry

    rows = (
        db.query(
            func.date(WorkoutLog.logged_at).label("log_date"),
            SetLog.weight_kg,
            SetLog.reps,
            SetLog.completed,
        )
        .join(SetLog, SetLog.workout_log_id == WorkoutLog.id)
        .filter(SetLog.exercise_id == exercise_id)
        .order_by(WorkoutLog.logged_at.desc())
        .all()
    )
    seen = set()
    entries = []
    for r in rows:
        d = r.log_date.isoformat() if hasattr(r.log_date, "isoformat") else str(r.log_date)
        if d in seen:
            continue
        seen.add(d)
        entries.append(
            ExerciseHistoryEntry(
                date=d,
                weight_kg=r.weight_kg,
                reps=r.reps,
                completed=bool(r.completed),
            )
        )
        if len(entries) >= limit:
            break
    return {"exercise_id": exercise_id, "entries": entries}


# --- Dashboard ---

def get_dashboard_state(db: Session, key: str = "default"):
    from app.db.models import DashboardState
    return db.query(DashboardState).filter(DashboardState.key == key).first()


def update_dashboard_state(db: Session, data: dict, key: str = "default"):
    from app.db.models import DashboardState
    state = db.query(DashboardState).filter(DashboardState.key == key).first()
    if not state:
        state = DashboardState(key=key, data=data)
        db.add(state)
    else:
        state.data = data
    db.commit()
    db.refresh(state)
    return state


def get_shared_dashboard(db: Session, share_id: str):
    from app.db.models import SharedDashboard
    return db.query(SharedDashboard).filter(SharedDashboard.share_id == share_id).first()


def update_shared_dashboard(db: Session, share_id: str, data: list, title: str | None = None):
    from app.db.models import SharedDashboard
    shared = db.query(SharedDashboard).filter(SharedDashboard.share_id == share_id).first()
    if not shared:
        shared = SharedDashboard(share_id=share_id, data=data, title=title or "Progetti Condivisi")
        db.add(shared)
    else:
        shared.data = data
        if title:
            shared.title = title
    db.commit()
    db.refresh(shared)
    return shared


def create_workout_log(db: Session, template_id: str | None, sets: list[SetLogItem]) -> WorkoutLog:
    log = WorkoutLog(template_id=template_id, logged_at=datetime.now(timezone.utc))
    db.add(log)
    db.flush()
    for s in sets:
        db.add(SetLog(
            workout_log_id=log.id,
            exercise_id=s.exercise_id,
            set_number=s.set_number,
            weight_kg=s.weight_kg,
            reps=s.reps,
            completed=1 if s.completed else 0,
        ))
    db.commit()
    db.refresh(log)
    return log


def get_all_progressions(db: Session):
    from app.db.models import TrainingProgression
    return db.query(TrainingProgression).all()


def get_training_progression(db: Session, exercise_id: str):
    from app.db.models import TrainingProgression
    return db.query(TrainingProgression).filter(TrainingProgression.exercise_id == exercise_id).first()


def update_training_progression(db: Session, exercise_id: str, data: dict):
    from app.db.models import TrainingProgression
    prog = db.query(TrainingProgression).filter(TrainingProgression.exercise_id == exercise_id).first()
    if not prog:
        prog = TrainingProgression(exercise_id=exercise_id, data=data)
        db.add(prog)
    else:
        prog.data = data
    db.commit()
    db.refresh(prog)
    return prog


def get_daily_schedule(db: Session, start_date: date, days_count: int = 14):
    from app.db.models import DailySchedule, WorkoutDayTemplate
    from datetime import timedelta, datetime, time
    import logging

    logger = logging.getLogger(__name__)

    try:
        # 1. Recupera i template ordinati
        templates = db.query(WorkoutDayTemplate).order_by(WorkoutDayTemplate.weekday).all()
        if not templates:
            logger.warning("Nessun template trovato nel database. Genero dati vuoti per evitare crash.")
            # Restituiamo un array vuoto o generiamo dati placeholder se preferibile
            # In questo caso, torniamo una lista di Rest Days virtuali
            final_schedule = []
            for i in range(days_count):
                curr_date = start_date + timedelta(days=i)
                curr_dt = datetime.combine(curr_date, time.min)
                final_schedule.append(DailySchedule(date_=curr_dt, template_id=None, is_completed=0))
            return final_schedule

        # 2. Trova l'ultimo completato (per data) e l'ultimo template completato (per sequenza)
        last_completed = (
            db.query(DailySchedule)
            .filter(DailySchedule.is_completed == 1)
            .order_by(DailySchedule.date_.desc())
            .first()
        )
        
        last_workout = (
            db.query(DailySchedule)
            .filter(DailySchedule.is_completed == 1, DailySchedule.template_id.is_not(None))
            .order_by(DailySchedule.date_.desc())
            .first()
        )

        # 3. Determina da quale template dobbiamo ripartire
        today_date = date.today()
        next_template_idx = 0
        base_date = today_date

        if last_workout:
            try:
                last_idx = next(i for i, t in enumerate(templates) if t.id == last_workout.template_id)
                next_template_idx = (last_idx + 1) % len(templates)
            except (StopIteration, ValueError):
                next_template_idx = 0
                
        if last_completed:
            try:
                last_date = last_completed.date_
                if isinstance(last_date, datetime):
                    last_date = last_date.date()
                base_date = max(last_date + timedelta(days=1), today_date)
            except (StopIteration, ValueError):
                base_date = today_date

        # 4. Genera o aggiorna lo schedule basato sullo sliding
        # Puliamo i giorni non completati (così diventano "Rest Days" se non rigenerati)
        # Ripartiamo da OGGI per pulire eventuali residui non completati
        # NON puliamo più il passato (giorni < oggi) perché devono rimanere come sono (vuoti se non fatti)
        today_dt = datetime.combine(today_date, time.min)
        db.query(DailySchedule).filter(
            DailySchedule.date_ >= today_dt,
            DailySchedule.is_completed == 0
        ).delete(synchronize_session='fetch')
        
        # Generiamo lo schedule a partire da base_date
        # Se base_date > today_date, significa che i giorni tra today e base_date rimarranno "vuoti" (Rest)
        template_pointer = 0
        for i in range(days_count * 3): # Generiamo un range più ampio per coprire i buchi (domeniche)
            curr_date = base_date + timedelta(days=i)
            
            # Se è domenica, saltiamo l'assegnazione del template (rimane Rest Day)
            if curr_date.weekday() == 6: # 6 = Domenica in Python date.weekday()
                continue
                
            curr_dt = datetime.combine(curr_date, time.min)
            
            # Evitiamo duplicati
            existing = db.query(DailySchedule).filter(DailySchedule.date_ == curr_dt).first()
            if existing:
                continue
                
            template = templates[(next_template_idx + template_pointer) % len(templates)]
            new_sched = DailySchedule(date_=curr_dt, template_id=template.id, is_completed=0)
            db.add(new_sched)
            template_pointer += 1
            
            # Fermiamoci quando abbiamo generato abbastanza giorni futuri
            if template_pointer >= days_count * 2:
                break
        
        db.commit()
        
        # 5. Restituisci lo schedule
        # Assicuriamoci che tutte le date nel range richiesto esistano (anche le domeniche/vuoti)
        start_dt = datetime.combine(start_date, time.min)
        
        # Recuperiamo quelli esistenti nel DB
        existing_schedules = db.query(DailySchedule).filter(
            DailySchedule.date_ >= start_dt,
            DailySchedule.date_ < start_dt + timedelta(days=days_count)
        ).all()
        
        # Mappa per data
        sched_map = {s.date_.date(): s for s in existing_schedules}
        
        # Costruiamo la lista completa di giorni (7 giorni o days_count)
        final_schedule = []
        for i in range(days_count):
            curr_date = start_date + timedelta(days=i)
            if curr_date in sched_map:
                final_schedule.append(sched_map[curr_date])
            else:
                # Se non esiste nel DB, creiamo un oggetto "virtuale" (Rest Day)
                # senza salvarlo nel DB per ora, o possiamo salvarlo se preferiamo.
                # Lo salviamo per coerenza.
                curr_dt = datetime.combine(curr_date, time.min)
                new_rest = DailySchedule(date_=curr_dt, template_id=None, is_completed=0)
                # Se è nel passato rispetto a oggi, lo segnamo come vuoto ma non lo rigeneriamo
                final_schedule.append(new_rest)

        return final_schedule
    except Exception as e:
        db.rollback()
        logger.exception(f"Errore critico in get_daily_schedule: {e}")
        raise e


def update_daily_schedule_completion(db: Session, schedule_date: date, is_completed: bool):
    from app.db.models import DailySchedule, WorkoutDayTemplate
    from datetime import timedelta, datetime, time
    
    dt = datetime.combine(schedule_date, time.min)
    sched = db.query(DailySchedule).filter(DailySchedule.date_ == dt).first()
    
    if not sched:
        return None
        
    old_completed = bool(sched.is_completed)
    sched.is_completed = 1 if is_completed else 0
    
    # Se stiamo de-completando un giorno o se lo stiamo completando, 
    # potrebbe innescare uno slittamento dei giorni successivi.
    # LOGICA SLIDING:
    # Se completiamo un giorno, i giorni successivi rimangono come sono.
    # Se NON completiamo un giorno (lo saltiamo), i template slittano.
    
    if old_completed != is_completed and not is_completed:
        # Se abbiamo annullato un completamento, i giorni successivi devono slittare
        # per riprendere questo template.
        pass # Implementazione complessa, per ora facciamo update semplice
        
    db.commit()
    db.refresh(sched)
    return sched
