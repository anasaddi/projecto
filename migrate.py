
import sqlite3

def migrate():
    db_path = 'backend/km.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking schema...")
    cursor.execute("PRAGMA table_info(daily_schedules);")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
        
    # SQLite doesn't support ALTER TABLE ALTER COLUMN easily.
    # We have to recreate the table if we want to change NOT NULL to NULL.
    # But often SQLite allows NULL if not explicitly NOT NULL.
    
    # Let's try to just insert a NULL to see if it fails.
    try:
        print("Testing NULL insert...")
        cursor.execute("INSERT INTO daily_schedules (date, template_id, is_completed) VALUES ('2020-01-01', NULL, 1)")
        conn.commit()
        print("NULL insert succeeded!")
        cursor.execute("DELETE FROM daily_schedules WHERE date = '2020-01-01'")
        conn.commit()
    except Exception as e:
        print(f"NULL insert failed: {e}")
        print("Migrating table...")
        
        # Backup
        cursor.execute("CREATE TABLE daily_schedules_backup AS SELECT * FROM daily_schedules;")
        cursor.execute("DROP TABLE daily_schedules;")
        
        # Recreate with nullable template_id
        cursor.execute("""
            CREATE TABLE daily_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATETIME NOT NULL UNIQUE,
                template_id VARCHAR(64),
                is_completed INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(template_id) REFERENCES workout_day_templates (id)
            );
        """)
        
        # Restore
        cursor.execute("INSERT INTO daily_schedules (id, date, template_id, is_completed) SELECT id, date, template_id, is_completed FROM daily_schedules_backup;")
        cursor.execute("DROP TABLE daily_schedules_backup;")
        conn.commit()
        print("Migration complete!")

    conn.close()

if __name__ == "__main__":
    migrate()
