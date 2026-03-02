"""Script per inserire storico fake anche se il DB ha già dati. Esegui dalla root backend:
    python -m app.scripts.seed_fake_history
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.db.seed_training import seed_fake_history

db = SessionLocal()
try:
    n = seed_fake_history(db, force=True)
    print(f"Fake history: inseriti {n} workout logs.")
finally:
    db.close()
