import type { TimelineRoutineItem, DailyTaskTemplate, DayCompletionPayload } from '../../types/dashboard';
import { uid } from '../../components/dashboard/DashboardUtils';
import { haptic } from '../../utils/haptics';
import { logTimelineEvent } from '../storeHelpers';

export type TimelineSet = (fn: (s: unknown) => void) => void;

export function createTimelineSlice(set: TimelineSet) {
  return {
    addTimelineRoutine: (dateKey: string, slotKey: string, habitId: string) =>
      set((s: unknown) => {
        const state = s as { timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>> };
        if (!state.timelineRoutines[dateKey]) state.timelineRoutines[dateKey] = {};
        if (!state.timelineRoutines[dateKey][slotKey]) state.timelineRoutines[dateKey][slotKey] = [];
        if (!state.timelineRoutines[dateKey][slotKey].some((r) => r.habitId === habitId)) {
          state.timelineRoutines[dateKey][slotKey].push({ id: uid('tl'), habitId, done: false });
        }
      }),

    toggleTimelineRoutine: (dateKey: string, slotKey: string, routineId: string, done: boolean) =>
      set((s: unknown) => {
        const state = s as {
          timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>>;
          dailyCompletionLog: Record<string, DayCompletionPayload>;
          dailyTaskTemplates: DailyTaskTemplate[];
        };
        const list = state.timelineRoutines[dateKey]?.[slotKey];
        if (!Array.isArray(list)) return;
        const r = list.find((x) => x.id === routineId);
        if (r) {
          r.done = done;
          if (done) haptic([50]);
          const habit = state.dailyTaskTemplates?.find((h) => h.id === r.habitId);
          const title = habit?.title ?? 'Micro-vittoria';
          logTimelineEvent(state, 'habit', routineId, title, done, null, slotKey);
        }
      }),

    removeTimelineRoutine: (dateKey: string, slotKey: string, routineId: string) =>
      set((s: unknown) => {
        const state = s as {
          timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>>;
          dailyCompletionLog: Record<string, DayCompletionPayload>;
        };
        if (!state.timelineRoutines[dateKey]?.[slotKey]) return;
        state.timelineRoutines[dateKey][slotKey] = state.timelineRoutines[dateKey][slotKey].filter(
          (x) => x.id !== routineId
        );
        logTimelineEvent(state, 'habit', routineId, '', false, null, slotKey);
      }),
  };
}
