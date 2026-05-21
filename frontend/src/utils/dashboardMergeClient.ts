import type { MergePayload } from './dashboardMerge';

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('../workers/dashboardMerge.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

/** Below ~32KB main-thread merge is faster than Worker spawn/postMessage overhead. */
const MERGE_WORKER_THRESHOLD_BYTES = 32_000;

export function shouldUseMergeWorker(payload: MergePayload): boolean {
  try {
    return JSON.stringify(payload).length >= MERGE_WORKER_THRESHOLD_BYTES;
  } catch {
    return false;
  }
}

export function mergeDashboardInWorker(
  local: MergePayload,
  incoming: MergePayload
): Promise<MergePayload> {
  const w = getWorker();
  if (!w) return Promise.resolve(local);

  const id = ++seq;
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<{ id: number; merged: MergePayload }>) => {
      if (event.data.id !== id) return;
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      resolve(event.data.merged);
    };
    const onError = (err: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      reject(err);
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ id, local, incoming });
  });
}
