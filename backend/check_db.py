from app.db.session import SessionLocal
from app.db.models import WorkoutDayTemplate, DailySchedule
import logging

logging.basicConfig(level=logging.INFO)
db = SessionLocal()
try:
    templates_count = db.query(WorkoutDayTemplate).count()
    schedules_count = db.query(DailySchedule).count()
    print(f"Templates in DB: {templates_count}")
    print(f"Schedules in DB: {schedules_count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
