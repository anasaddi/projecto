/**
 * Shared helpers for dashboard store slices (timeline logging, task tree utils).
 */
import type { DayCompletionPayload, TimelineEventType } from '../types/dashboard';
import { toDateKey, getCurrentSlotKey } from '../components/dashboard/DashboardUtils';

export function logTimelineEvent(
  s: { dailyCompletionLog: Record<string, DayCompletionPayload> },
  type: TimelineEventType,
  id: string,
  title: string,
  val: boolean,
  projectName: string | null = null,
  slotKeyOverride?: string
): void {
  if (val && !title) return;
  const todayKey = toDateKey(new Date());
  const slotKey = slotKeyOverride ?? getCurrentSlotKey();
  if (!s.dailyCompletionLog[todayKey]) {
    s.dailyCompletionLog[todayKey] = { quick: [], project: [], events: [] };
  }
  const day = s.dailyCompletionLog[todayKey];
  if (!day.events) day.events = [];

  if (val) {
    if (!day.events.find((e) => e.id === id)) {
      day.events.push({
        id,
        title,
        type,
        timestamp: Date.now(),
        slotKey,
        projectName: projectName ?? undefined,
      });
    }
  } else {
    day.events = day.events.filter((e) => e.id !== id);
  }
}

export function findTaskTitle(
  nodes: Array<{ id: string; title: string; children?: unknown[] }> | null | undefined,
  id: string
): string | null {
  for (const n of nodes ?? []) {
    if (n.id === id) return n.title;
    if (n.children?.length) {
      const found = findTaskTitle(n.children as typeof nodes, id);
      if (found) return found;
    }
  }
  return null;
}
