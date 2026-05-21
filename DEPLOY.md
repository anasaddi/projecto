# Deploy (frontend vs backend)

Questo repo ha **due deploy separati**. Modifiche solo al frontend **non** passano da Render.

## Frontend (UI: Dashboard, Shared, ecc.)

- **Piattaforma:** [Vercel](https://vercel.com) collegata al repo Git.
- **Impostazione critica nel progetto Vercel:** **Root Directory = `frontend`**
  (altrimenti la build non usa `frontend/package.json` / `frontend/vercel.json` e le modifiche sembrano "non arrivare".)
- Dopo `git push` su `main`, controlla il dashboard **Vercel** → ultimo deployment e log build.
- In `frontend/vercel.json` le API sono proxate verso Render (`/api/*` → backend).

## Backend (API FastAPI)

- **Piattaforma:** [Render](https://render.com) con root `backend` e start command `bash start.sh` (Alembic + Gunicorn).
- Vedi **[DEPLOY_RENDER.md](DEPLOY_RENDER.md)** per variabili d'ambiente e checklist.
- I push che toccano **solo** il frontend non richiedono un nuovo deploy Render se l'API non cambia.

## Checklist rapida ("non vedo le modifiche online")

1. La modifica è nel **frontend**? → Vercel (root `frontend`), non Render.
2. Deploy Vercel fallito o in coda? → Log build su Vercel.
3. Cache browser: prova hard refresh o finestra anonima.
4. Stai aprendo l'URL **Vercel** aggiornato (non un vecchio preview)?
