/**
 * Zustand store slice: Habits (dailyTaskTemplates, dailyTaskLogs).
 * Compose in the main dashboard store to avoid prop drilling and keep concerns separate.
 */
import type {
  DailyTaskTemplate,
  DailyTaskLogEntry,
  DayCompletionPayload,
  TimelineEventType,
} from '../../types/dashboard';
import {
  toDateKey,
  getCurrentSlotKey,
} from '../../components/dashboard/DashboardUtils';
import { haptic } from '../../utils/haptics';

/** Minimal store shape needed by this slice (avoids circular deps). */
export interface HabitSliceDeps {
  dailyTaskTemplates: DailyTaskTemplate[];
  dailyTaskLogs: Record<string, DailyTaskLogEntry[]>;
  dailyCompletionLog: Record<string, DayCompletionPayload>;
  lifeGoals: { tiers: Array<{ goals: Array<{ id: string; done: boolean }> }> } | null;
}

export type HabitSliceSet = (fn: (state: HabitSliceDeps & HabitSliceActions) => void) => void;
export type HabitSliceGet = () => HabitSliceDeps & HabitSliceActions;

function logTimelineEvent(
  s: HabitSliceDeps & { dailyCompletionLog: Record<string, DayCompletionPayload> },
  type: TimelineEventType,
  id: string,
  title: string,
  val: boolean
): void {
  if (!title) return;
  const todayKey = toDateKey(new Date());
  const slotKey = getCurrentSlotKey();
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
        projectName: null,
      });
    }
  } else {
    day.events = day.events.filter((e) => e.id !== id);
  }
}

export interface HabitSliceActions {
  setDailyTaskTemplates: (val: DailyTaskTemplate[] | ((prev: DailyTaskTemplate[]) => DailyTaskTemplate[])) => void;
  setDailyTaskLogs: (val: Record<string, DailyTaskLogEntry[]> | ((prev: Record<string, DailyTaskLogEntry[]>) => Record<string, DailyTaskLogEntry[]>)) => void;
  toggleDailyTask: (id: string, done: boolean) => void;
  toggleHabitLock: (id: string) => void;
  toggleHabitInTimeline: (id: string) => void;
  removeDailyTask: (id: string) => void;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
  addHabitAction: (title: string) => void;
}

/**
 * Creates the habit slice: state is in the store; this returns only actions.
 * Usage: ...createHabitSlice(set, get), in the main store.
 */
export function createHabitSlice(
  set: HabitSliceSet,
  get: HabitSliceGet
): HabitSliceActions {
  return {
    setDailyTaskTemplates: (val) =>
      set((s) => {
        s.dailyTaskTemplates =
          typeof val === 'function' ? val(s.dailyTaskTemplates) : val;
      }),

    setDailyTaskLogs: (val) =>
      set((s) => {
        s.dailyTaskLogs =
          typeof val === 'function' ? val(s.dailyTaskLogs) : val;
      }),

    toggleDailyTask: (id, done) =>
      set((s) => {
        if (done) haptic([50]);
        const t = s.dailyTaskTemplates.find((x) => x.id === id);
        if (t) logTimelineEvent(s, 'habit', id, t.title, done);

        const date = toDateKey(new Date());
        if (!s.dailyTaskLogs[date]) s.dailyTaskLogs[date] = [];
        if (done) {
          const existing = s.dailyTaskLogs[date].find((x) => x.id === id);
          if (!existing) {
            s.dailyTaskLogs[date].push({ id, done: true });
          }
        } else {
          s.dailyTaskLogs[date] = s.dailyTaskLogs[date].filter((x) => x.id !== id);
        }
      }),

    toggleHabitLock: (id) =>
      set((s) => {
        const h = s.dailyTaskTemplates.find((x) => x.id === id);
        if (h) h.locked = !h.locked;
      }),

    toggleHabitInTimeline: (id) =>
      set((s) => {
        const h = s.dailyTaskTemplates.find((x) => x.id === id);
        if (h) h.inTimeline = (h.inTimeline === false) ? true : false;
      }),

    removeDailyTask: (id) =>
      set((s) => {
        s.dailyTaskTemplates = s.dailyTaskTemplates.filter((x) => x.id !== id);
        Object.keys(s.dailyTaskLogs).forEach((date) => {
          if (Array.isArray(s.dailyTaskLogs[date])) {
            s.dailyTaskLogs[date] = s.dailyTaskLogs[date].filter((x) => x.id !== id);
          }
        });
      }),

    reorderHabits: (fromIndex, toIndex) =>
      set((s) => {
        if (fromIndex === toIndex) return;
        const [removed] = s.dailyTaskTemplates.splice(fromIndex, 1);
        s.dailyTaskTemplates.splice(toIndex, 0, removed);
        s.dailyTaskTemplates.forEach((h, i) => (h.ordinal = i));
      }),

    addHabitAction: (title) =>
      set((s) => {
        const t = title.trim();
        if (t) {
          s.dailyTaskTemplates.push({
            id: `daily-${Date.now()}`,
            title: t,
            locked: false,
            ordinal: s.dailyTaskTemplates.length,
          });
          (s as { habitDraft?: string }).habitDraft = '';
        }
      }),
  };
}
