# Deploy (frontend vs backend)

Questo repo ha **due deploy separati**. Modifiche solo al frontend **non** passano da Railway.

## Frontend (UI: Dashboard, Shared, ecc.)

- **Piattaforma consigliata:** [Vercel](https://vercel.com) collegata al repo Git.
- **Impostazione critica nel progetto Vercel:** **Root Directory = `frontend`**  
  (altrimenti la build non usa `frontend/package.json` / `frontend/vercel.json` e le modifiche sembrano “non arrivare”.)
- Dopo `git push` su `main`, controlla il dashboard **Vercel** → ultimo deployment e log build.
- In `frontend/vercel.json` le API sono proxate verso Railway (`/api/*`).

## Backend (API FastAPI)

- **Piattaforma:** [Railway](https://railway.app) con `railway.json` in root (`build.rootDirectory`: `backend`).
- `watchPatterns: ["backend/**"]`: i push che toccano **solo** cartelle fuori da `backend/` **non** innescano un nuovo deploy Railway (comportamento voluto: l’API non cambia).
- Se aggiorni solo React/JS/CSS, devi vedere un nuovo deploy su **Vercel**, non su Railway.

## Checklist rapida (“non vedo le modifiche online”)

1. La modifica è nel **frontend**? → Vercel (root `frontend`), non Railway.  
2. Deploy Vercel fallito o in coda? → Log build su Vercel.  
3. Cache browser: prova hard refresh o finestra anonima.  
4. Stai aprendo l’URL **Vercel** aggiornato (non un vecchio preview)?
