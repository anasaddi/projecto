import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { syncMiddleware } from './syncMiddleware';
import {
  createHabitSlice,
  createQuickTaskSlice,
  createTop3Slice,
  createProjectSlice,
  createLifeGoalsSlice,
  createTimelineSlice,
  createUISlice,
} from './slices';
import {
  loadDashboardStateFromStorage as loadState,
  buildDefaultLifeGoals,
  normalizeLifeGoals,
  toDateKey,
  startOfDay,
  parseSelectedDate,
} from '../components/dashboard/DashboardUtils';
import { haptic } from '../utils/haptics';
import { logTimelineEvent } from './storeHelpers';
import type { DayCompletionPayload, LifeGoalsState } from '../types/dashboard';
import type { Project, Top3Slot } from '../types/dashboard';
import type { QuickTask } from '../types/dashboard';

interface SyncData {
  dailyTaskTemplates?: unknown[];
  dailyTaskLogs?: Record<string, unknown>;
  projects?: Project[];
  prayerLogs?: Record<string, unknown>;
  selectedDate?: Date | string;
  top3Manual?: (Top3Slot | null)[];
  quickTasks?: QuickTask[];
  dailyCompletionLog?: Record<string, DayCompletionPayload>;
  lifeGoals?: LifeGoalsState;
  timelineRoutines?: Record<string, unknown>;
  timelinePanelExpanded?: boolean;
  todayTrainingExpanded?: boolean;
  projectExpandedState?: Record<string, boolean>;
  activePomodoroTask?: { taskId: string; projectId?: string; quickTaskId?: string; shareId?: string; title: string } | null;
  sectionOrder?: Record<string, string[]>;
  lockedHabitsCollapsed?: boolean;
}

const defaultInitial = {
  dailyTaskTemplates: [] as unknown[],
  dailyTaskLogs: {} as Record<string, unknown>,
  projects: [] as Project[],
  prayerLogs: {} as Record<string, unknown>,
  top3Manual: [null, null, null] as (Top3Slot | null)[],
  quickTasks: [] as QuickTask[],
  dailyCompletionLog: {} as Record<string, DayCompletionPayload>,
  lifeGoals: buildDefaultLifeGoals() as LifeGoalsState,
  timelineRoutines: {} as Record<string, unknown>,
  timelinePanelExpanded: true,
  todayTrainingExpanded: true,
  projectExpandedState: {} as Record<string, boolean>,
  activePomodoroTask: null as { taskId: string; projectId?: string; quickTaskId?: string; shareId?: string; title: string } | null,
  sectionOrder: {
    left: ['pomodoro', 'quickTasks', 'focusHeatmap'],
    center: ['top3', 'habits'],
    right: ['projects'],
  } as Record<string, string[]>,
  lockedHabitsCollapsed: false,
  selectedDate: new Date(),
};

const loaded = loadState() as Partial<SyncData> | null;
// selectedDate è sempre resettato a oggi al refresh, non salvato in localStorage
const initialState = loaded 
  ? { ...defaultInitial, ...loaded, selectedDate: new Date() } 
  : defaultInitial;

function clampSelectedDateToToday(value: Date | string | undefined, fallback = new Date()): Date {
  const parsed = parseSelectedDate(value, fallback);
  const today = startOfDay(new Date());
  const normalized = startOfDay(parsed);
  return normalized > today ? today : parsed;
}

const dashboardStore = create<any>()(
  syncMiddleware(
    immer((set: any, get: any) => ({
        // --- Dashboard Data ---
        dailyTaskTemplates: initialState.dailyTaskTemplates,
        dailyTaskLogs: initialState.dailyTaskLogs,
        projects: initialState.projects,
        prayerLogs: initialState.prayerLogs,
        top3Manual: initialState.top3Manual,
        quickTasks: initialState.quickTasks,
        dailyCompletionLog: initialState.dailyCompletionLog,
        lifeGoals: initialState.lifeGoals,
        timelineRoutines: initialState.timelineRoutines ?? {},

        // --- UI State ---
        isLoaded: false,
        lastSavedAt: null,
        confirmState: null,
        quickTaskDraft: '',
        quickTaskEditingId: null,
        quickTaskEditingTitle: '',
        habitDraft: '',
        habitEditingId: null,
        habitEditingTitle: '',
        projectTaskDrafts: {} as Record<string, string>,
        projectDeadlineEditing: null,
        projectDeadlineInput: '',
        quickTaskDeadlineEditing: null,
        quickTaskDeadlineInput: '',
        goalTaskDrafts: {} as Record<string, string>,
        goalDeadlineEditing: null,
        goalDeadlineInput: '',
        sharedDashboards: [] as unknown[],
        timelinePanelExpanded: initialState.timelinePanelExpanded !== false,
        todayTrainingExpanded: initialState.todayTrainingExpanded !== false,
        lockedHabitsCollapsed: !!(initialState as any).lockedHabitsCollapsed,
        projectExpandedState: (initialState as any).projectExpandedState ?? {},
        activePomodoroTask: initialState.activePomodoroTask ?? null,
        sectionOrder: (initialState as any).sectionOrder ?? defaultInitial.sectionOrder,
        selectedDate: clampSelectedDateToToday(initialState.selectedDate, new Date()),

        setActivePomodoroTask: (task: { taskId: string; projectId?: string; quickTaskId?: string; shareId?: string; title: string } | null) =>
          set((s: unknown) => {
            const state = s as { activePomodoroTask: { taskId: string; projectId?: string; quickTaskId?: string; shareId?: string; title: string } | null };
            state.activePomodoroTask = task;
          }),

        reorderSection: (column: string, fromIndex: number, toIndex: number) =>
          set((s: unknown) => {
            const state = s as { sectionOrder: Record<string, string[]> };
            const sections = state.sectionOrder[column];
            if (!sections || fromIndex === toIndex) return;
            const [removed] = sections.splice(fromIndex, 1);
            sections.splice(toIndex, 0, removed);
          }),

        setSelectedDate: (date: Date) =>
          set((s: unknown) => {
            const state = s as { selectedDate: Date };
            state.selectedDate = clampSelectedDateToToday(date, new Date());
          }),

        navigateToPreviousDay: () =>
          set((s: unknown) => {
            const state = s as { selectedDate: Date };
            const newDate = new Date(state.selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            state.selectedDate = newDate;
          }),

        navigateToNextDay: () =>
          set((s: unknown) => {
            const state = s as { selectedDate: Date };
            const newDate = new Date(state.selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            state.selectedDate = clampSelectedDateToToday(newDate, new Date());
          }),

        ...createUISlice(set),
        ...createHabitSlice(set, get),
        logTimelineCompletionEvent: (type: string, id: string, title: string, val: boolean) =>
          set((s: unknown) => {
            const state = s as { dailyCompletionLog: Record<string, DayCompletionPayload>; selectedDate?: Date | string };
            logTimelineEvent(
              state,
              type as 'habit' | 'quick' | 'project' | 'shared_quick',
              id,
              title,
              val,
              undefined,
              undefined,
              toDateKey(parseSelectedDate(state.selectedDate, new Date()))
            );
          }),

        setProjects: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { projects: Project[] };
            state.projects = typeof val === 'function' ? (val as (p: Project[]) => Project[])(state.projects) : (val as Project[]);
          }),
        setPrayerLogs: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { prayerLogs: Record<string, unknown> };
            state.prayerLogs = typeof val === 'function' ? (val as (p: Record<string, unknown>) => Record<string, unknown>)(state.prayerLogs) : (val as Record<string, unknown>);
          }),
        setTop3Manual: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { top3Manual: (Top3Slot | null)[] };
            state.top3Manual = typeof val === 'function' ? (val as (p: (Top3Slot | null)[]) => (Top3Slot | null)[])(state.top3Manual) : (val as (Top3Slot | null)[]);
          }),
        setQuickTasks: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { quickTasks: QuickTask[] };
            state.quickTasks = typeof val === 'function' ? (val as (p: QuickTask[]) => QuickTask[])(state.quickTasks) : (val as QuickTask[]);
          }),
        setDailyCompletionLog: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { dailyCompletionLog: Record<string, unknown> };
            state.dailyCompletionLog = typeof val === 'function' ? (val as (p: Record<string, unknown>) => Record<string, unknown>)(state.dailyCompletionLog) : (val as Record<string, unknown>);
          }),
        setLifeGoals: (val: unknown) =>
          set((s: unknown) => {
            const state = s as { lifeGoals: LifeGoalsState };
            state.lifeGoals = typeof val === 'function' ? (val as (p: LifeGoalsState) => LifeGoalsState)(state.lifeGoals) : (val as LifeGoalsState);
          }),

        syncWithServer: (data: SyncData) =>
          set((s: Record<string, unknown>) => {
            const state = s as Record<string, unknown> & SyncData;
            // Only sync if backend has data (non-empty arrays or non-empty objects)
            if (data.dailyTaskTemplates && data.dailyTaskTemplates.length > 0) state.dailyTaskTemplates = data.dailyTaskTemplates;
            if (data.dailyTaskLogs && Object.keys(data.dailyTaskLogs).length > 0) state.dailyTaskLogs = data.dailyTaskLogs;
            if (data.prayerLogs && Object.keys(data.prayerLogs).length > 0) state.prayerLogs = data.prayerLogs;
            // selectedDate is UI-only (navigation state); do not overwrite from server sync
            if (data.dailyCompletionLog && Object.keys(data.dailyCompletionLog).length > 0) state.dailyCompletionLog = data.dailyCompletionLog;
            if (data.lifeGoals && ((data.lifeGoals.tiers && data.lifeGoals.tiers.length > 0) || (data.lifeGoals as any).collapsed !== undefined)) state.lifeGoals = normalizeLifeGoals(data.lifeGoals, buildDefaultLifeGoals()) as LifeGoalsState;
            if (data.timelineRoutines != null && typeof data.timelineRoutines === 'object' && Object.keys(data.timelineRoutines).length > 0) state.timelineRoutines = data.timelineRoutines;
            if (data.timelinePanelExpanded !== undefined) state.timelinePanelExpanded = data.timelinePanelExpanded;
            if (data.todayTrainingExpanded !== undefined) state.todayTrainingExpanded = data.todayTrainingExpanded;
            if (data.lockedHabitsCollapsed !== undefined) state.lockedHabitsCollapsed = data.lockedHabitsCollapsed;
            if (data.projectExpandedState && typeof data.projectExpandedState === 'object' && Object.keys(data.projectExpandedState).length > 0) state.projectExpandedState = data.projectExpandedState;
            if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
              const prev = (state.projects || []) as Project[];
              state.projects = data.projects.map((p) => {
                const cur = prev.find((x) => x.id === p.id);
                return cur?.lifeGoalId != null ? { ...p, lifeGoalId: cur.lifeGoalId } : p;
              });
            }
            if (data.quickTasks && Array.isArray(data.quickTasks) && data.quickTasks.length > 0) {
              const prev = (state.quickTasks || []) as QuickTask[];
              state.quickTasks = data.quickTasks.map((t) => {
                const cur = prev.find((x) => x.id === t.id);
                return cur?.lifeGoalId != null ? { ...t, lifeGoalId: cur.lifeGoalId } : t;
              });
            }
            if (data.top3Manual && Array.isArray(data.top3Manual) && data.top3Manual.some((s: any) => s !== null)) {
              const prev = (state.top3Manual || []) as (Top3Slot | null)[];
              state.top3Manual = data.top3Manual.map((slot: Top3Slot | null, i: number) => {
                const curSlot = prev[i];
                if (curSlot && (curSlot.projectId?.startsWith?.('lg-') || curSlot.quickTaskId)) return curSlot;
                return slot;
              });
            }
          }),

        ...createQuickTaskSlice(set, get),
        ...createTop3Slice(set),

        togglePrayer: (name: string, val: boolean) =>
          set((s: unknown) => {
            const state = s as { prayerLogs: Record<string, Record<string, any>>; selectedDate?: Date | string };
            if (val) haptic([50]);
            const selected = parseSelectedDate(state.selectedDate, new Date());
            const date = toDateKey(selected);
            const todayKey = toDateKey(new Date());
            if (!state.prayerLogs[date]) state.prayerLogs[date] = {};
            if (!val) {
              state.prayerLogs[date][name] = null;
            } else if (date === todayKey) {
              // Today: store real timestamp so we can classify on-time / late / early
              state.prayerLogs[date][name] = { completedAt: new Date().toISOString() };
            } else {
              // Past day: retroactive tick — store true (legacy format) so it’s shown as “Completata”
              // without misleading “In ritardo” classification based on current wall-clock time
              state.prayerLogs[date][name] = true;
            }
          }),

        ...createProjectSlice(set, get),
        ...createTimelineSlice(set),
        ...createLifeGoalsSlice(set, get),
      }))
  )
);

export const useDashboardStore = ((selector: (state: any) => any) => dashboardStore(selector)) as {
  <T>(selector: (state: any) => T): T;
  getState: () => any;
  setState: (...args: any[]) => void;
  subscribe: (...args: any[]) => void;
};

useDashboardStore.getState = dashboardStore.getState;
useDashboardStore.setState = dashboardStore.setState;
useDashboardStore.subscribe = dashboardStore.subscribe;
