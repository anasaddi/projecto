# Cosa fare tu — guida rapida

Cose che **devi fare tu** dopo il refactoring, in ordine e in modo sintetico.

---

## 0. Accesso Training solo per Flavio (già implementato)

**Cosa:** Tu (chiave admin) e Flavio (chiave Training) avete entrambi accesso a Training. Se in futuro vorrai dare Training solo a Flavio, si può limitare lato backend la chiave admin a `training: false`.

**Come attivarlo:** Nel backend (`.env`) imposta una chiave da dare solo a Flavio:
```env
TRAINING_ACCESS_KEY=una-chiave-segreta-per-flavio
```
- **Chiave admin** (la tua): Dashboard, Condivisi, Transcript, **e Training**.
- **Chiave Training** (Flavio): stesso accesso (dashboard, condivisi, transcript, training) ma con una chiave diversa dalla tua.

---

## 1. Migrazioni database (subito, se usi il backend)

**Cosa:** Creare le nuove tabelle `users`, `user_profiles`, `domain_events` e la colonna `user_id` su `dashboard_states`.

**Quando:** Prima di usare auth multi-utente o time travel (o subito per avere lo schema allineato).

**Come:**
```bash
cd backend
alembic upgrade head
```
Se algo fallisce, controlla che la catena delle revisioni sia corretta (008 → 009). In locale puoi anche fare `Base.metadata.create_all()` all’avvio (le tabelle si creano da zero).

---

## 2. JWT con `sub` per multi-utente (quando vuoi più utenti)

**Cosa:** Oggi il login usa una chiave admin unica. Per avere un utente per persona serve che il token contenga un identificativo utente (`sub`).

**Quando:** Quando decidi di usare Auth0, Supabase Auth, Clerk o un tuo login che distingue gli utenti.

**Come:**
- **Opzione A – Solo backend:** Nel login che emette il JWT, metti `sub: user_id` (es. `auth0|xxx` o un UUID) nel payload. `get_current_user` già legge `sub` e lo usa per filtrare i dati.
- **Opzione B – OAuth2 esterno:** Integri un provider (es. Auth0). Il frontend fa login lato provider; il backend verifica il JWT del provider e usa il suo `sub` come `user_id`. In quel caso potresti sostituire `get_current_admin` con una verifica JWT del provider (es. JWKS di Auth0).

Nessun cambio obbligatorio nel frontend per “chi è loggato”: continua a inviare il token in `x-km-access`; il backend filtra già per `user_id` quando `sub` è presente.

---

## 3. (Opzionale) Ridurre il prop drilling in `DenseTaskNode`

**Cosa:** Oggi a `DenseTaskNode` passi molte props (onToggle, onDelete, onRename, …). Puoi ridurle leggendo lo store direttamente nel componente.

**Quando:** Quando ti dà fastidio mantenere tutte quelle props o quando aggiungi nuove azioni.

**Come:** Nel componente usa `useDashboardStore(selector)` per leggere solo ciò che serve (es. `toggleProjectTask`, `updateProject`) invece di riceverli come props. Le props restano solo per dati “locali” (es. `projectId`, `node`, `depth`).

---

## 4. (Opzionale) Passare a CRDT come fonte di verità

**Cosa:** Oggi lo stato vive nello store Zustand e viene sincronizzato con REST. Il modulo Yjs in `frontend/src/sync/crdtDoc.ts` è pronto ma non è ancora la fonte di verità.

**Quando:** Quando vuoi sync offline multi-dispositivo senza conflitti (tipo Notion/Google Docs).

**Come:** Segui i passi in `frontend/src/sync/README.md`: ad ogni cambio nello store scrivi anche nel doc Yjs, persisti `encodeCrdtState()` in IndexedDB, al load leggi e applica gli update al doc e idrata lo store. Poi puoi aggiungere un provider (es. WebSocket) per sincronizzare il doc con il server.

---

## Riepilogo ordine consigliato

| Ordine | Cosa | Obbligatorio? |
|--------|------|----------------|
| 1 | `alembic upgrade head` | Sì, se usi backend con le nuove funzionalità |
| 2 | JWT con `sub` (o OAuth2) | Solo se vuoi multi-utente |
| 3 | Meno props in DenseTaskNode (store in componente) | No, refactor quando vuoi |
| 4 | CRDT come fonte di verità | No, solo se vuoi sync avanzato |

Se non fai i passi opzionali, l’app continua a funzionare come ora (con un solo utente “legacy” e sync attuale).
