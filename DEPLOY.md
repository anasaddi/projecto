# Guida Deploy – KM Personal (prima volta)

Questa guida ti porta passo passo da zero fino all’app online. Non serve averlo mai fatto prima.

---

## Cosa otterrai

- **Un link tipo** `https://km-personal.vercel.app` → la tua Dashboard e la pagina Transcript.
- **Un link tipo** `https://km-personal-production.up.railway.app` → il backend (API).  
L’utente userà solo il primo link; il secondo serve “dietro le quinte”.

---

## Parte 1 – Mettere il codice su GitHub

GitHub è dove tieni il codice. Vercel e Railway lo prenderanno da lì.

### 1.1 Account GitHub

1. Vai su [github.com](https://github.com).
2. Se non hai account: **Sign up** (email, password).
3. Accedi.

### 1.2 Creare un nuovo repository

1. Clicca **+** in alto a destra → **New repository**.
2. **Repository name**: `km-personal` (o come preferisci).
3. **Public**.
4. **Non** spuntare “Add a README” (il progetto ce l’ha già).
5. Clicca **Create repository**.

### 1.3 Caricare il progetto da Windows

Apri **PowerShell** (o il terminale che usi) nella cartella del progetto:

```powershell
cd C:\Users\Anas\Desktop\projecto
```

Se non hai mai usato Git sul PC:

```powershell
git config --global user.name "Il Tuo Nome"
git config --global user.email "tua@email.com"
```

Poi:

```powershell
git init
git add .
git status
```

Controlla che ci siano molti file elencati e **nessun** `.env` (deve essere ignorato dal `.gitignore`).

```powershell
git commit -m "Primo commit - app KM Personal"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/km-personal.git
```

Sostituisci **TUO_USERNAME** con il tuo username GitHub (es. se il link del repo è `github.com/anas123/km-personal`, usa `anas123`).

```powershell
git push -u origin main
```

Ti chiederà di accedere a GitHub (browser o token). Completa l’accesso.  
Dopo il push, su GitHub vedrai tutti i file del progetto.

---

## Parte 2 – Backend online (Railway)

Railway farà girare il backend Python (FastAPI).

### 2.1 Account e primo progetto

1. Vai su [railway.app](https://railway.app).
2. **Login** → **Login with GitHub** e autorizza Railway.
3. **New Project**.
4. Scegli **Deploy from GitHub repo**.
5. Se richiesto, autorizza l’accesso ai repository e seleziona **km-personal** (o il nome che hai usato).
6. Railway creerà un “servizio” e proverà a fare il deploy. Per ora può anche fallire: dobbiamo dirgli dove sta il backend.

### 2.2 Dire a Railway dove sta il backend

1. Clicca sul servizio (il riquadro con il nome del repo).
2. Vai su **Settings** (o la rotellina).
3. Trova **Root Directory** (o **Source**).
4. In **Root Directory** scrivi: `backend` e salva.
5. Clicca **Redeploy** (o aspetta che rifaccia il deploy da solo).

### 2.3 Variabili d’ambiente (le “password” del backend)

1. Nello stesso progetto Railway, apri la scheda **Variables** (o **Environment**).
2. Clicca **New Variable** o **Add Variable** e aggiungi una per una:

| Nome               | Valore (incolla il tuo) |
|--------------------|--------------------------|
| `ASSEMBLYAI_API_KEY` | `228c3a02b348418b832ba2b350de3a2a` |
| `OPENROUTER_API_KEY` | `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` |

3. **CORS_ORIGINS** per ora lascialo vuoto; lo aggiungeremo dopo aver l’URL del frontend.

4. Salva e fai **Redeploy** se serve.

### 2.4 Ottenere l’URL pubblico del backend

1. In Railway, nel tuo servizio, cerca **Settings** → **Networking** o **Public Networking**.
2. Clicca **Generate Domain** (o **Expose**).
3. Ti verrà assegnato un link tipo:  
   `https://km-personal-production-xxxx.up.railway.app`
4. **Copia questo link** e aggiungi `/api` alla fine per le chiamate dal frontend.  
   Esempio: `https://km-personal-production-xxxx.up.railway.app/api`  
   Tienilo da parte per il passo successivo.

---

## Parte 3 – Frontend online (Vercel)

Vercel farà girare la parte React (Dashboard, Transcript, ecc.).

### 3.1 Account e import del progetto

1. Vai su [vercel.com](https://vercel.com).
2. **Sign Up** o **Login** → **Continue with GitHub** e autorizza Vercel.
3. **Add New…** → **Project**.
4. Importa il repository **km-personal** (se non lo vedi, collega prima il tuo account GitHub).
5. Clicca **Import** sul repo km-personal.

### 3.2 Configurare la cartella e il build

Prima di fare **Deploy**:

1. **Root Directory**: clicca **Edit** e imposta **frontend** (solo quella cartella).
2. **Framework Preset**: Vite (dovrebbe rilevarlo).
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### 3.3 Variabile per l’URL del backend

1. Nella stessa schermata, apri **Environment Variables**.
2. **Name**: `VITE_API_BASE`
3. **Value**: l’URL del backend Railway che hai copiato **con** `/api` alla fine.  
   Esempio: `https://km-personal-production-xxxx.up.railway.app/api`
4. Salva.

### 3.4 Deploy

1. Clicca **Deploy**.
2. Attendi 1–2 minuti.
3. Quando finisce, Vercel ti mostrerà un link tipo:  
   `https://km-personal-xxxx.vercel.app`  
   **Copia questo link** (è la tua app che userai tu e gli altri).

---

## Parte 4 – Collegare frontend e backend (CORS)

Il browser blocca le richieste da un sito (Vercel) a un altro (Railway) se il backend non lo permette. Si fa con CORS.

1. Torna su **Railway** → tuo progetto → **Variables**.
2. Aggiungi (o modifica) la variabile:
   - **Name**: `CORS_ORIGINS`
   - **Value**: l’URL del frontend Vercel **senza** slash finale.  
     Esempio: `https://km-personal-xxxx.vercel.app`
3. Se usi anche un dominio personalizzato su Vercel, aggiungilo separato da virgola:  
   `https://km-personal-xxxx.vercel.app,https://tuodominio.com`
4. Salva e fai **Redeploy** del backend su Railway.

Dopo un minuto, riapri il link Vercel: la Dashboard e la pagina Transcript dovrebbero funzionare e parlare con il backend su Railway.

---

## Riepilogo

| Cosa        | Dove   | URL tipo |
|------------|--------|----------|
| App (UI)   | Vercel | `https://km-personal-xxxx.vercel.app` |
| API        | Railway| `https://km-personal-xxxx.up.railway.app` |

- **Utente** usa solo il link Vercel.
- **Aggiornare l’app**: modifichi il codice, poi:
  ```powershell
  git add .
  git commit -m "Descrizione modifica"
  git push
  ```
  Vercel e Railway rifaranno il deploy da soli.

---

## Problemi comuni

- **“Failed to fetch” / errore di rete sulla Transcript**  
  Controlla che `VITE_API_BASE` su Vercel sia esattamente l’URL Railway + `/api` e che `CORS_ORIGINS` su Railway contenga l’URL del frontend Vercel.

- **404 su “Dashboard” o “Transcript”**  
  Su Vercel deve esserci il file `frontend/vercel.json` con le rewrite verso `index.html` (così il routing della SPA funziona).

- **Build Railway fallisce**  
  Verifica che **Root Directory** sia `backend` e che nel repo ci siano `backend/requirements.txt` e `backend/Procfile`.

Se mi dici a che passo sei (GitHub, Railway o Vercel) e che messaggio di errore vedi, posso indicarti il fix preciso.
