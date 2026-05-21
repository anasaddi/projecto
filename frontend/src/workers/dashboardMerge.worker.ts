import { mergeDashboardServerPayload, type MergePayload } from '../utils/dashboardMerge';

export type WorkerMergeRequest = { id: number; local: MergePayload; incoming: MergePayload };
export type WorkerMergeResponse = { id: number; merged: MergePayload };

self.onmessage = (event: MessageEvent<WorkerMergeRequest>) => {
  const { id, local, incoming } = event.data;
  const merged = mergeDashboardServerPayload(local, incoming);
  self.postMessage({ id, merged } satisfies WorkerMergeResponse);
};

export {};
