import os
import sys

# Aggiungi backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise
from app.db.seed_training import seed_training_if_empty

db = SessionLocal()

print("Wiping existing training data...")
db.query(WorkoutDayExercise).delete()
db.query(WorkoutDayTemplate).delete()
db.query(Exercise).delete()
db.commit()

print("Re-seeding from training_seed.json...")
n = seed_training_if_empty(db)
print(f"Seeded {n} exercises.")

db.close()
