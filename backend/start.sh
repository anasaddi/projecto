#!/bin/bash
# Run Alembic migrations before starting the app.
# IMPORTANT: if migrations fail, do NOT start the server with an old schema.
echo "Running Alembic migrations..."
alembic upgrade head 2>&1 || {
  echo "Alembic migration failed. Trying recovery stamp+upgrade once..."
  alembic stamp 009_domain_events 2>&1 || true
  alembic upgrade head 2>&1 || {
    echo "Alembic migration failed again. Aborting startup to avoid schema drift."
    exit 1
  }
}
echo "Starting Gunicorn..."
# Avvia il server con Gunicorn + multi-worker Uvicorn per migliorare performance
# 2 workers per Render free tier (512MB RAM) - 4 workers causano OOM
gunicorn app.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8080} \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 50
