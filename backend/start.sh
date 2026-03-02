#!/bin/bash
# Esegui le migrazioni per creare le tabelle nel nuovo DB
alembic upgrade head
# Avvia il server
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
