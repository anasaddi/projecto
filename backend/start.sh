#!/bin/bash
# Esegui le migrazioni per creare le tabelle nel nuovo DB (ignora errori se tabelle esistono)
alembic upgrade head
# Avvia il server con Gunicorn + multi-worker Uvicorn per migliorare performance
# 2 workers per Render free tier (512MB RAM) - 4 workers causano OOM
gunicorn app.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8080} \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 50
