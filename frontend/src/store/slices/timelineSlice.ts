import type { TimelineRoutineItem } from '../../types/dashboard';
import { uid } from '../../components/dashboard/DashboardUtils';
import { haptic } from '../../utils/haptics';

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
        const state = s as { timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>> };
        const list = state.timelineRoutines[dateKey]?.[slotKey];
        if (!Array.isArray(list)) return;
        const r = list.find((x) => x.id === routineId);
        if (r) {
          r.done = done;
          if (done) haptic([50]);
        }
      }),

    removeTimelineRoutine: (dateKey: string, slotKey: string, routineId: string) =>
      set((s: unknown) => {
        const state = s as { timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>> };
        if (!state.timelineRoutines[dateKey]?.[slotKey]) return;
        state.timelineRoutines[dateKey][slotKey] = state.timelineRoutines[dateKey][slotKey].filter(
          (x) => x.id !== routineId
        );
      }),
  };
}
