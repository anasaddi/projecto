import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import AsyncSessionLocal
from app.db.seed_training import seed_fake_history

async def main():
    async with AsyncSessionLocal() as db:
        try:
            n = await seed_fake_history(db, force=True)
            print(f"Fake history: inseriti {n} workout logs.")
        except Exception as e:
            print(f"Error seeding history: {e}")

if __name__ == "__main__":
    asyncio.run(main())
