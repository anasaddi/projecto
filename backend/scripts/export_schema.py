#!/usr/bin/env python3
"""Esporta lo schema SQLite in formato PostgreSQL-compatibile."""
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "km_db.sqlite"


def export_schema():
    if not DB_PATH.exists():
        print(f"DB non trovato: {DB_PATH}")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    tables = cursor.fetchall()
    out = []
    for (t,) in tables:
        cursor.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (t,),
        )
        row = cursor.fetchone()
        if row and row[0]:
            out.append(row[0] + ";")
    conn.close()
    return "\n\n".join(out)


if __name__ == "__main__":
    print(export_schema())
