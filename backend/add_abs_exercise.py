from app.db.session import SessionLocal
from app.db.models import Exercise

def add_abs():
    db = SessionLocal()
    try:
        # Check if already exists
        if db.query(Exercise).filter(Exercise.id == 'addominali').first():
            print("Exercise 'addominali' already exists.")
            return

        db.add(Exercise(
            id='addominali',
            name='Addominali',
            category='HYPERTROPHY',
            primary_muscles=['core'],
            secondary_muscles=[],
            cns_fatigue=0.2,
            joint_stress={}
        ))
        db.commit()
        print("Exercise 'addominali' added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_abs()
