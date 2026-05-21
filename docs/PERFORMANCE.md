# Performance e keep-warm (Projecto)

## UptimeRobot / keep-alive

Render **free tier** mette il backend in sleep dopo ~15 minuti senza richieste HTTP dirette.

**Monitor corretto (UptimeRobot o simile):**

- URL: `https://projecto-backend-7we9.onrender.com/keepalive` (o `/health`)
- Intervallo: **5 minuti**
- Metodo: GET, atteso HTTP 200

**Non monitorare solo Vercel** (`projecto-indol.vercel.app`): il frontend e sempre up; il backend puo dormire lo stesso.

## Perche l'app puo restare lenta con UptimeRobot attivo

| Sintomo | Causa |
|---------|--------|
| 30-60s al primo click dopo ore | Cold start Render (ping su URL sbagliato o gap > 15 min) |
| UI scattosa con dashboard aperta | Re-render frontend (fix: timer 1s rimosso in Fase 5A) |
| Lento al primo load dashboard | Molte query DB su `GET /api/training/dashboard-state` |
| Lento dopo deploy | Alembic + seed in startup |

## Cache Redis (opzionale)

Su Render free non c'e Redis integrato. Per cache dashboard tra worker:

1. Crea database Redis su [Upstash](https://upstash.com/) (free tier)
2. Imposta `REDIS_URL` nelle env Render del backend
3. Verifica nei log: `get_dashboard_state cache hit in Xms`

Senza Redis, la cache in-memory e per-worker (Gunicorn 2 worker).

## Metriche semplici

1. **Network tab:** `GET .../dashboard-state` con backend gia sveglio — target &lt; 1.5s
2. **React Profiler:** niente spike ogni 1s su DashboardV2 (post Fase 5A)
3. **curl cold start:** dopo 20 min idle, `curl https://projecto-backend-7we9.onrender.com/keepalive` — target &lt; 5s se ping OK

## Secret in produzione

Verifica su Render che `ADMIN_ACCESS_KEY` e `SECRET_KEY` non siano i default di [`config.py`](backend/app/config.py).
