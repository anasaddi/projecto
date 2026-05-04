#!/bin/bash
# Run Alembic migrations. If the chain breaks (e.g. table already exists),
# stamp to the latest known revision and retry just the new migrations.
echo "Running Alembic migrations..."
alembic upgrade head 2>&1 || {
  echo "Alembic migration failed (likely tables already exist). Stamping and retrying..."
  # Mark 008 (users) and 009 (domain_events) as applied — these tables were
  # created by a previous deploy. Then run our new migration (010).
  alembic stamp 009_domain_events 2>&1 || true
  alembic upgrade head 2>&1 || { echo "Alembic migration failed again, continuing anyway..."; }
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
