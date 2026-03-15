import os
import sys
import asyncio

# Aggiungi backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import AsyncSessionLocal
from app.db.models import Exercise, WorkoutDayTemplate, WorkoutDayExercise
from app.db.seed_training import seed_training_if_empty
from sqlalchemy import delete

async def main():
    async with AsyncSessionLocal() as db:
        print("Wiping existing training data...")
        await db.execute(delete(WorkoutDayExercise))
        await db.execute(delete(WorkoutDayTemplate))
        await db.execute(delete(Exercise))
        await db.commit()

        print("Re-seeding from training_seed.json...")
        n = await seed_training_if_empty(db)
        print(f"Seeded {n} exercises.")

if __name__ == "__main__":
    asyncio.run(main())
