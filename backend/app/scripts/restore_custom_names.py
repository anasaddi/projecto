"""Script per ripristinare i nomi personalizzati nel calendario.
Esegui dalla root backend: python -m app.scripts.restore_custom_names

Applica: FacePull (high_row), Panca Elastico/Panca Fermi (bp_el, bp_pause)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.db.models import WorkoutDayExercise

CUSTOM_NAMES = {
    "high_row": "FacePull",
    "bp_el": "Panca Elastico/Panca Fermi",
    "bp_pause": "Panca Elastico/Panca Fermi",
}

def main():
    db = SessionLocal()
    try:
        updated = 0
        for wde in db.query(WorkoutDayExercise).all():
            custom = CUSTOM_NAMES.get(wde.exercise_id)
            if custom and wde.custom_name != custom:
                wde.custom_name = custom
                updated += 1
        db.commit()
        print(f"Restore custom names: aggiornati {updated} esercizi.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
