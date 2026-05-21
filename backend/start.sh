#!/bin/bash
# Run Alembic migrations before starting the app.
# IMPORTANT: if migrations fail, do NOT start the server with an old schema.
echo "Running Alembic migrations..."
if ! alembic upgrade head 2>&1; then
  echo "Alembic migration failed. Aborting startup to avoid schema drift."
  exit 1
fi
echo "Starting Gunicorn..."
gunicorn app.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8080} \
  --timeout 120 \
  --max-requests 1000 \
  --max-requests-jitter 50
