import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from app.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.db.models import Habit, HabitLog, DailyStat, Top3Item, PrayerLog, DailyCompletionLog

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.precompute.precompute_daily_stats")
def precompute_daily_stats_task():
    """Nightly precomputation of streaks and scores."""
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    async def _run():
        async with AsyncSessionLocal() as db:
            await precompute_for_date(db, (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d"))
            await precompute_for_date(db, datetime.now(timezone.utc).strftime("%Y-%m-%d"))
            
    loop.run_until_complete(_run())

async def precompute_for_date(db, date_str: str):
    """Compute stats for a specific date and save to daily_stats table."""
    try:
        # 1. Habits Done
        res_h = await db.execute(select(Habit).filter(Habit.locked == 0))
        active_habits = res_h.scalars().all()
        h_ids = [h.id for h in active_habits]
        
        res_l = await db.execute(select(HabitLog).filter(HabitLog.date == date_str, HabitLog.habit_id.in_(h_ids), HabitLog.status == 1))
        habits_done = len(res_l.scalars().all())
        
        # 2. Top3 Done
        res_t3 = await db.execute(select(Top3Item).filter(Top3Item.done == 1))
        top3_done = len(res_t3.scalars().all())
        
        # 3. Prayers Done
        res_pr = await db.execute(select(PrayerLog).filter(PrayerLog.date == date_str, PrayerLog.completed == 1))
        prayers_done = len(res_pr.scalars().all())
        
        # 4. Focus Score
        total_items = len(h_ids) + 5 + 3 # habits + 5 prayers + 3 top3
        done_items = habits_done + prayers_done + top3_done
        score = done_items / total_items if total_items > 0 else 0
        
        # 5. Habit Streak (Simplified for now)
        streak = 0
        # In a real app we'd look back through daily_stats or habit_logs
        
        # Save to DailyStat
        res_ds = await db.execute(select(DailyStat).filter(DailyStat.date == date_str))
        stat = res_ds.scalar_one_or_none()
        if not stat:
            stat = DailyStat(date=date_str)
            db.add(stat)
            
        stat.focus_score = score
        stat.top3_done_count = top3_done
        stat.data = {
            "habits_done": habits_done,
            "prayers_done": prayers_done,
            "total_items": total_items
        }
        await db.commit()
        logger.info(f"Precomputed stats for {date_str}: score={score:.2f}")
        
    except Exception as e:
        logger.error(f"Error precomputing stats for {date_str}: {e}")
        await db.rollback()
