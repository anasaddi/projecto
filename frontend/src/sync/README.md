# CRDT Sync (Yjs)

This folder contains the Yjs-based CRDT layer for conflict-free dashboard sync.

## Current state

- `crdtDoc.ts` exposes a single Y.Doc with a map keyed by dashboard state. You can:
  - `getCrdtState()` / `setCrdtState()` / `updateCrdtState()` to read/write.
  - `onCrdtUpdate(callback)` to react to changes (e.g. from another tab).
  - `encodeCrdtState()` / `applyCrdtUpdate()` for persistence or server sync.

- The main app still uses the Zustand store + `syncMiddleware` (localStorage, BroadcastChannel, REST). The CRDT doc is **not** yet wired as the source of truth.

## How to switch to CRDT-first

1. **Persistence**: On every store change, call `updateCrdtState(partial)` and persist `encodeCrdtState()` to IndexedDB (e.g. via Dexie or a Yjs persistence adapter).
2. **Load**: On app load, read the persisted update(s), `applyCrdtUpdate()`, then hydrate the Zustand store from `getCrdtState()`.
3. **Cross-tab**: Use `Y.BroadcastChannel` or a custom provider so that updates in one tab are applied to the doc in others; `onCrdtUpdate` can then push into the store.
4. **Server**: Send `encodeCrdtState()` (or delta updates) to the backend; receive updates from other devices and call `applyCrdtUpdate()`.

Optionally replace the REST “full state” API with a Yjs sync protocol (e.g. Yjs WebSocket provider) for real-time collaboration.
