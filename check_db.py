import sqlite3
import json

def check_curl():
    try:
        conn = sqlite3.connect('backend/km.db')
        cursor = conn.cursor()
        cursor.execute("SELECT data FROM training_progressions WHERE exercise_id='curl_str'")
        row = cursor.fetchone()
        if row:
            print(row[0])
        else:
            print("Not found")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_curl()
