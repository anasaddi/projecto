# PROJECTO - Knowledge Management

Local-first personal knowledge platform: Dashboard produttività, Learning (Transcript YouTube), sources, search.

## Quick start

1. Backend (from `backend/`):
   ```bash
   cp .env.example .env
   # Aggiungi ASSEMBLYAI_API_KEY e OPENROUTER_API_KEY in .env per Transcript/Learning
   pip install -r requirements.txt
   alembic upgrade head  # se usi DB
   uvicorn app.main:app --reload --port 8000
   ```

2. Frontend (from `frontend/`):
   ```bash
   npm install && npm run dev
   ```

- **Apri il frontend:** http://localhost:3000 (non la porta 8000).
- API: http://localhost:8000 (usata in proxy dal frontend).

**Se vedi "Failed to load resource: 404" in console:** avvia anche il backend sulla porta 8000 (il frontend in dev invia le richieste `/api/*` al backend in proxy). Se apri solo http://localhost:8000 vedrai la risposta JSON dell'API, non l'interfaccia.

## Produzione (Vercel + Render)

Vedi **[DEPLOY.md](DEPLOY.md)** e **[DEPLOY_RENDER.md](DEPLOY_RENDER.md)** per la guida completa.

- **Frontend**: Vercel (root `frontend`, variabile `VITE_API_BASE` se serve override)
- **Backend**: Render (root `backend`, `bash start.sh` — Alembic + Gunicorn)

Locally:

```bash
# Backend
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run build && npm run preview
```

**Reset**: Dashboard → pulsante Reset; Transcript cache → `POST /api/youtube/cache/clear`

## Stack

- **Backend:** FastAPI, SQLAlchemy, yt-dlp, AssemblyAI, OpenRouter
- **Frontend:** React, TailwindCSS
