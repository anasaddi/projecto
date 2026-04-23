#!/bin/bash
# Esegui le migrazioni per creare le tabelle nel nuovo DB
alembic upgrade head
# Avvia il server con Gunicorn + multi-worker Uvicorn per migliorare performance
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8080} \
  --timeout 120 \
  --keepalive 5 \
  --max-requests 1000 \
  --max-requests-jitter 50
