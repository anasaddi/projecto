# Roadmap Architetturale — Migrazione e Refactoring

Roadmap in 7 fasi per TypeScript, separation of concerns, multi-tenant, auth, error handling, CRDT e Event Sourcing.

---

## Stato implementazione (aggiornato)

- **Fase 1 (parziale):** Store a slice (habit, quickTask, top3, project, lifeGoals, timeline, ui), tipi TS in `src/types/dashboard.ts`, Pydantic in `backend/app/schemas/dashboard.py`, helper `storeHelpers.ts` e `logTimelineEvent`/`findTaskTitle`.
- **Fase 2 (parziale):** Tabelle `users` e `user_profiles`, colonna `user_id` su `dashboard_states`; migrazioni 008 e 009.
- **Fase 3:** `get_current_user` (da JWT `sub`), API dashboard filtrate per `user_id` (GET/PUT dashboard-state).
- **Fase 4:** Toast (Sonner) + `logError`/`logAndToast` in `utils/errorLog.ts`; API client e sync middleware usano notifiche e log strutturati.
- **Fase 5 (strato iniziale):** Modulo CRDT `src/sync/crdtDoc.ts` (Yjs) con get/set/update/onUpdate e encode/apply per persistenza e sync; README per passaggio CRDT-first.
- **Fase 6:** Tabella `domain_events`, `append_dashboard_event`, `get_dashboard_state_at` (replay), endpoint `GET /dashboard-state/at?at=<ISO>` per Time Travel.

---

## Fase 1 — Fondamenta (TS + Pydantic + Store Slices)

**Obiettivo:** Eliminare l’80% dei bug da manipolazione dati con tipi rigorosi e store modulari.

### 1.1 Migrazione TypeScript (Frontend)
- Rinomina progressiva `.js`/`.jsx` → `.ts`/`.tsx` (partire da store, types, api, poi componenti).
- `tsconfig.json` già presente; abilitare `strict: true`, `noUnusedLocals`/`noUnusedParameters` quando stabile.
- Definire tipi in `src/types/` (dashboard, api, auth) allineati ai modelli Pydantic del backend.

### 1.2 Pydantic rigoroso (Backend)
- **Nuovo:** `app/schemas/dashboard.py` con modelli per:
  - `DailyTaskTemplate`, `DailyTaskLogEntry`, `Project`, `TaskNode`, `QuickTask`, `LifeGoal`, `LifeGoalTier`, `Top3Slot`, `TimelineEvent`, `DashboardStatePayload`.
- Usare questi schemi in:
  - Validazione body/response delle API dashboard (es. `GET/PUT /dashboard-state`).
  - Serializzazione/deserializzazione del JSON in `DashboardState.data` e `SharedDashboard.data`.
- Mantenere compatibilità con il payload attuale durante la transizione (validazione “leniente” dove serve).

### 1.3 Store Slices (Zustand)
- Spezzare `dashboardStore.js` in slice:
  - `createHabitSlice` (dailyTaskTemplates, dailyTaskLogs, toggleDailyTask, addHabitAction, …).
  - `createProjectSlice` (projects, createProject, updateProject, toggleProjectTask, …).
  - `createQuickTaskSlice`, `createTop3Slice`, `createLifeGoalsSlice`, `createTimelineSlice`, `createUISlice`.
- Store principale: `create` con `subscribeWithSelector` + `syncMiddleware` + `immer`, composto con le slice.
- Un solo store composto, nessun Context aggiuntivo per i dati dashboard (Zustand già globale).

### 1.4 Meno prop drilling (Context / store)
- Per componenti profondi (es. `DenseTaskNode`): usare `useDashboardStore.getState()` o selettori `useDashboardStore(selector)` invece di passare 15 funzioni come props.
- Opzionale: un piccolo `DashboardActionsContext` che espone solo le azioni (funzioni) se preferisci non importare lo store in ogni foglia.

**Deliverable Fase 1:** Frontend con tipi TS e store a slice; backend con schemi Pydantic per dashboard; stessi endpoint e comportamento, meno bug da tipo/dati.

---

## Fase 2 — Multi-Tenant e Config-Driven

**Obiettivo:** Niente più utente singolo hardcoded; template e configurazioni dal DB.

### 2.1 Users e UserProfiles
- Tabella `users` (id, email, auth_provider_id, created_at, …).
- Tabella `user_profiles` (user_id FK, weight_kg, timezone, preferences JSON, …).
- Tutte le entità “per utente” (dashboard state, progetti, habit, …) con `user_id` (o `owner_id`).

### 2.2 Template di allenamento nel DB
- Tabella `workout_templates` (o simile) con JSON Schema / struttura JSON ben definita (Pydantic).
- `AWMaxDayTable.jsx` (e simili) leggono la struttura da API/config invece di logica condizionale hardcoded.
- Migrazione: estrarre la logica attuale in “schema” salvato nel DB e adattare il frontend a render driven da quello schema.

**Deliverable Fase 2:** Ogni dato utente legato a `user_id`; template allenamento configurabili e salvati nel DB.

---

## Fase 3 — Autenticazione e Sicurezza

**Obiettivo:** OAuth2, API protette, filtri per utente.

### 3.1 OAuth2
- Integrare **Auth0**, **Supabase Auth** o **Clerk** (frontend: redirect/login; backend: verifica JWT e estrazione `user_id`/`sub`).
- Deprecare login “solo API key” dove non adatto a multi-tenant.

### 3.2 Protezione API
- Dependency `get_current_user` che legge il JWT e restituisce `User` (o user_id).
- Ogni query che espone dati utente: filtrare per `user_id` (es. dashboard state, progetti, habit, quick tasks).
- Audit log delle azioni sensibili (già abbozzo con `audit_events`).

**Deliverable Fase 3:** Login OAuth2; tutte le API dashboard/utente filtrate per `user_id`; nessun dato cross-user.

---

## Fase 4 — Gestione errori e notifiche (Frontend)

**Obiettivo:** Niente più `try/catch` vuoti o solo `console.error`; UX coerente.

### 4.1 Toast e notifiche
- Libreria leggera (es. `sonner`, `react-hot-toast`) o componente interno.
- Pattern: ogni chiamata LLM / API che può fallire → onError: mostra toast + log strutturato.

### 4.2 Log strutturati
- Helper `logError(context, error, extra)` che invia a servizio (es. backend log, o Sentry) con contesto (pagina, azione, user_id se disponibile).
- Sostituire progressivamente i `console.error` sparsi con questo helper.

**Deliverable Fase 4:** Toast coerenti su errori utente; errori loggati in modo strutturato.

---

## Fase 5 — Sync offline con CRDT

**Obiettivo:** Offline-first, multi-device senza conflitti “last write wins”.

### 5.1 Scelta stack
- **Yjs** o **Automerge** per strutture CRDT.
- **RxDB** (con Yjs/Automerge come storage) per query e sync con backend.
- Valutare complessità vs benefici: Yjs è molto usato (es. collaborative editing); RxDB aggiunge persistenza e sync.

### 5.2 Strategia
- Sostituire il sync attuale (queue + BroadcastChannel + eventuale REST) con:
  - Stato documento CRDT (es. Yjs Doc) per dashboard/progetti/habit.
  - Persistenza locale (IndexedDB) + sync con backend (WebSocket o REST con merge CRDT).
- Mantenere compatibilità con backend attuale in una fase intermedia (adapter che legge/scrive il JSON attuale da/verso il doc CRDT).

**Deliverable Fase 5:** App funzionante offline; modifiche su due device si fondono senza perdite; collaborazione stile Notion/Google Docs possibile in seguito.

---

## Fase 6 — Event Sourcing (Backend)

**Obiettivo:** Backend CQRS: stato derivato dagli eventi; time travel e audit perfetti.

### 6.1 Modello eventi
- Tabella `audit_events` (o `domain_events`) come unica fonte di verità per le azioni:
  - `HabitChecked`, `ProjectCreated`, `TaskCompleted`, `QuickTaskAdded`, `LifeGoalUpdated`, …
- Ogni evento: `id`, `user_id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload` (JSON), `timestamp`, `version`.

### 6.2 Read model (stato dashboard)
- Lo “stato” della dashboard non si salva più come blob; si ricostruisce:
  - **Proiezione:** da eventi → snapshot (es. stato attuale) salvato in cache/table per performance.
  - **Query:** lettura da snapshot; aggiornamento snapshot in risposta a nuovi eventi (worker o inline).

### 6.3 Time travel
- API tipo `GET /dashboard-state?at=2024-11-12T15:00:00`: ricostruire stato riapplicando eventi fino a `at`.

**Deliverable Fase 6:** Nessuno stato “denormalizzato” come fonte di verità; stato = proiezione da eventi; time travel e audit completi.

---

## Fase 7 — Allineamento finale e ottimizzazioni

- Allineare frontend CRDT (Fase 5) con backend Event Sourcing (Fase 6): gli eventi inviati dal client possono diventare gli stessi eventi che il backend persiste.
- Performance: indici DB, caching, paginazione dove serve.
- Testing: unit su slice/store, integrazione su API con Pydantic, E2E su flussi critici.

---

## Ordine consigliato e dipendenze

| Fase | Dipende da | Note |
|------|------------|------|
| 1    | —          | Fondamenta; fare per prima. |
| 2    | 1          | User_id ovunque richiede modelli e tipi stabili. |
| 3    | 2          | Auth e filtri per user_id dopo che il modello utente esiste. |
| 4    | 1          | Può essere parallela a 2/3; solo frontend. |
| 5    | 1, 3       | CRDT dopo che auth e stato “chi è l’utente” sono chiari. |
| 6    | 2, 3       | Event Sourcing dopo multi-tenant e auth. |
| 7    | 5, 6       | Allineamento CRDT ↔ Event Sourcing e polish. |

---

## File chiave (riferimento)

- **Frontend:** `src/store/dashboardStore.js` → slice in `src/store/slices/`, tipi in `src/types/dashboard.ts`.
- **Backend:** `app/schemas/dashboard.py` (nuovo), `app/schemas/training.py` (DashboardStateOut/Update), `app/api/routes/training.py` (dashboard-state), `app/db/models.py` (User, UserProfile quando Fase 2).
- **Sync:** `frontend/src/store/syncMiddleware.js` → da sostituire/integrare con CRDT in Fase 5.
