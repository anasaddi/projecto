/**
 * CRDT (Yjs) document for dashboard state — conflict-free sync across devices.
 * Use this module to eventually replace the current queue + BroadcastChannel sync
 * with a Y.Doc that merges updates automatically (offline-first, multi-device).
 *
 * Current dashboard store remains the source of truth; this layer can be wired
 * to mirror state into the Y.Doc and apply remote updates back into the store.
 */
import * as Y from "yjs";

const DASHBOARD_KEY = "dashboard";

let doc: Y.Doc | null = null;
let map: Y.Map<unknown> | null = null;

function getDoc(): Y.Doc {
  if (!doc) {
    doc = new Y.Doc();
    map = doc.getMap(DASHBOARD_KEY);
  }
  return doc;
}

function getMap(): Y.Map<unknown> {
  if (!map) getDoc();
  return map!;
}

/** Get current state from the CRDT document (for sync/merge). */
export function getCrdtState(): Record<string, unknown> {
  const m = getMap();
  const out: Record<string, unknown> = {};
  m.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/** Apply a partial state update into the CRDT doc (merge, no overwrite). */
export function updateCrdtState(partial: Record<string, unknown>): void {
  const m = getMap();
  Object.entries(partial).forEach(([key, value]) => {
    m.set(key, value);
  });
}

/** Replace full dashboard state in the doc (e.g. after load from server). */
export function setCrdtState(full: Record<string, unknown>): void {
  const m = getMap();
  m.clear();
  Object.entries(full).forEach(([key, value]) => {
    m.set(key, value);
  });
}

/** Subscribe to changes (e.g. from another tab or provider). */
export function onCrdtUpdate(callback: (state: Record<string, unknown>) => void): () => void {
  const d = getDoc();
  const handler = () => callback(getCrdtState());
  d.on("update", handler);
  return () => d.off("update", handler);
}

/** Encode doc for persistence (IndexedDB) or sync to server. */
export function encodeCrdtState(): Uint8Array {
  return Y.encodeStateAsUpdate(getDoc());
}

/** Apply encoded update from remote (merge into local doc). */
export function applyCrdtUpdate(update: Uint8Array): void {
  Y.applyUpdate(getDoc(), update);
}

export { getDoc };
