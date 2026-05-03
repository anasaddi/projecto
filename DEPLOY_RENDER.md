# Render Deployment Guide

## 🚀 Deploy Backend su Render

### 1️⃣ Preparazione

1. **Pusha il codice su GitHub** (se non l'hai già fatto):
   ```bash
   git add .
   git commit -m "Setup for Render deployment"
   git push origin main
   ```

### 2️⃣ Crea Account su Render

1. Vai su https://render.com
2. Registrati con GitHub (consigliato)
3. Clicca **"New +"** → **"Blueprint"**

### 3️⃣ Deploy con Blueprint

1. Seleziona il repository GitHub del tuo progetto
2. Render leggerà automaticamente il file `render.yaml`
3. Configura le variabili d'ambiente:
   - `ADMIN_ACCESS_KEY`: `[YOUR_SECURE_PASSWORD]`
   - `ASSEMBLYAI_API_KEY`: (la tua key, se la usi)
   - `OPENROUTER_API_KEY`: (la tua key, se la usi)
   - `SECRET_KEY`: verrà generato automaticamente

4. Clicca **"Apply"** e aspetta il deploy (~5 min)

### 4️⃣ Aggiorna Frontend su Vercel

Una volta che il backend è live su Render:

1. Copia l'URL del backend (es: `https://projecto-backend-xxx.onrender.com`)
2. Modifica `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://projecto-backend-xxx.onrender.com/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Pusha su GitHub per triggerare il deploy su Vercel

### 5️⃣ Migrazione Database

Render creerà automaticamente il database PostgreSQL. Devi applicare le migrazioni:

1. Vai sulla dashboard di Render
2. Clicca sul servizio backend
3. Vai su **"Shell"**
4. Esegui:
   ```bash
   alembic upgrade head
   ```

### 6️⃣ Test

1. Visita: `https://projecto-backend-xxx.onrender.com/health`
   - Dovresti vedere: `{"status":"ok"}`
2. Visita il frontend su Vercel
3. Login con password: `Anasaddi2001`

---

## ⚙️ Variabili d'Ambiente Richieste

| Variabile | Valore | Note |
|---|---|---|
| `ADMIN_ACCESS_KEY` | `[YOUR_SECURE_PASSWORD]` | Password di accesso |
| `SECRET_KEY` | (auto-generato) | Per JWT tokens |
| `DATABASE_URL` | (auto da Render) | PostgreSQL connection |
| `ENVIRONMENT` | `production` | Modalità prod |
| `CORS_ORIGINS` | `https://projecto-indol.vercel.app` | Origine frontend |
| `ASSEMBLYAI_API_KEY` | (opzionale) | Per trascrizioni YouTube |
| `OPENROUTER_API_KEY` | (opzionale) | Per AI features |

---

## 🔧 Comandi Utili

### Seed del database (opzionale)
```bash
# Dalla shell di Render
python -m app.db.seed_training
```

### Logs
- Dashboard Render → Logs del servizio backend

### Restart
- Dashboard Render → Manual Deploy → Deploy latest commit

---

## ⚠️ Note Importanti

1. **Sleep dopo 15 min**: Il free tier va in sleep dopo 15 min di inattività
   - Primo accesso dopo sleep: 30-50 secondi di attesa
   - Soluzione: Usa servizi come UptimeRobot per pingare ogni 10 min

2. **Database gratuito**: 512MB, sufficiente per il tuo progetto

3. **Bandwidth**: 100GB/mese inclusi (più che Enough)

4. **Aggiornamenti**: Ogni push su GitHub triggerà un deploy automatico

---

## 🆘 Troubleshooting

### Il backend non parte
- Controlla i logs su Render
- Verifica che `DATABASE_URL` sia configurato
- Controlla che tutte le dipendenze siano in `requirements.txt`

### Error 404 su API
- Verifica che l'URL nel `vercel.json` sia corretto
- Controlla che il backend sia in stato "Live" su Render

### Database migration fallisce
- Dalla shell di Render: `alembic upgrade head`
- Controlla i logs per errori specifici

---

## 📞 Supporto

- Render Docs: https://render.com/docs
- FastAPI on Render: https://render.com/docs/deploy-fastapi
