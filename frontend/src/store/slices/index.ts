/**
 * Zustand store slices for the dashboard.
 * Compose in dashboardStore: ...createHabitSlice(set, get), ...createProjectSlice(set, get), etc.
 */
export { createHabitSlice } from './habitSlice';
export { createQuickTaskSlice } from './quickTaskSlice';
export { createTop3Slice } from './top3Slice';
export { createProjectSlice } from './projectSlice';
export { createLifeGoalsSlice } from './lifeGoalsSlice';
export { createTimelineSlice } from './timelineSlice';
export { createUISlice } from './uiSlice';
export type { HabitSliceActions, HabitSliceDeps } from './habitSlice';
