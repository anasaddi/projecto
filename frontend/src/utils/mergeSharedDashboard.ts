import { mergeById } from './mergeById';

export type SharedDashboardData = {
  projects?: unknown[];
  quickTasks?: Array<{ id?: string; done?: boolean; title?: string }>;
  chat?: Array<{ id?: string }>;
  notes?: unknown[];
  bonifici?: unknown[];
};

/** Merge incoming WS/BC payload into local shared state (local wins on id collision). */
export function mergeSharedDashboardData(
  prev: SharedDashboardData,
  incoming: unknown
): SharedDashboardData {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return prev;
  }
  const remote = incoming as SharedDashboardData;
  const base: SharedDashboardData = {
    projects: prev.projects ?? [],
    quickTasks: prev.quickTasks ?? [],
    chat: prev.chat ?? [],
    notes: prev.notes ?? [],
    bonifici: prev.bonifici ?? [],
  };

  const merged: SharedDashboardData = { ...base };

  if (Array.isArray(remote.projects)) {
    merged.projects = mergeById(
      (base.projects ?? []) as Array<{ id?: string }>,
      remote.projects as Array<{ id?: string }>,
      'local'
    );
  }
  if (Array.isArray(remote.quickTasks)) {
    merged.quickTasks = mergeById(base.quickTasks ?? [], remote.quickTasks, 'local');
  }
  if (Array.isArray(remote.chat)) {
    const chat = [...(base.chat ?? [])];
    const ids = new Set(chat.map((m) => m?.id).filter(Boolean));
    for (const m of remote.chat) {
      if (m?.id && !ids.has(m.id)) {
        chat.push(m);
        ids.add(m.id);
      }
    }
    merged.chat = chat.slice(-100);
  }
  if (Array.isArray(remote.notes)) merged.notes = remote.notes;
  if (Array.isArray(remote.bonifici)) merged.bonifici = remote.bonifici;

  return merged;
}
