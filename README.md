# KM Personal - Knowledge Management

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

- API: http://localhost:8000  
- Frontend: http://localhost:3000  

## Produzione (Vercel + Railway)

Vedi **[DEPLOY.md](DEPLOY.md)** per la guida completa.

- **Frontend**: Vercel (root `frontend`, variabile `VITE_API_BASE`)
- **Backend**: Railway (root `backend`, variabili `ASSEMBLYAI_API_KEY`, `OPENROUTER_API_KEY`, `CORS_ORIGINS`)

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
