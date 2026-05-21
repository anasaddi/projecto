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

// Boot: defaults only; IndexedDB + server sync via useDashboardSync (no localStorage legacy).
const initialState = defaultInitial;

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

            const logsResetPending =
              typeof window !== 'undefined' &&
              sessionStorage.getItem('dashboard_logs_reset') === '1';

            // Merge helper for date-keyed dictionaries (e.g. prayerLogs[date][prayer]).
            // Server fills dates local doesn't have, but NEVER clobbers dates local
            // already has entries for. Prevents stale backend snapshots (including
            // responses that pre-date an in-flight PUT) from erasing local ticks.
            const mergeByDate = (
              local: Record<string, unknown> | undefined,
              remote: Record<string, unknown> | undefined
            ): Record<string, unknown> => {
              const out: Record<string, unknown> = { ...(local || {}) };
              if (remote && typeof remote === 'object') {
                for (const dateKey of Object.keys(remote)) {
                  const localEntry = out[dateKey];
                  const remoteEntry = remote[dateKey];
                  // If local has no data for this date, take server's.
                  if (
                    localEntry == null ||
                    (typeof localEntry === 'object' && !Array.isArray(localEntry) && Object.keys(localEntry as object).length === 0) ||
                    (Array.isArray(localEntry) && localEntry.length === 0)
                  ) {
                    out[dateKey] = remoteEntry;
                    continue;
                  }
                  // Both sides have data for this date — merge per-key when both are plain objects.
                  if (
                    remoteEntry && typeof remoteEntry === 'object' && !Array.isArray(remoteEntry) &&
                    localEntry && typeof localEntry === 'object' && !Array.isArray(localEntry)
                  ) {
                    const merged: Record<string, unknown> = { ...(localEntry as Record<string, unknown>) };
                    for (const innerKey of Object.keys(remoteEntry as Record<string, unknown>)) {
                      // CRITICAL FIX: Local wins if key exists (even if false/null for unchecked)
                      // Only take server value if local key is completely missing (undefined)
                      // This prevents race condition: unchecked prayer reverting to checked
                      const localVal = merged[innerKey];
                      const remoteVal = (remoteEntry as Record<string, unknown>)[innerKey];
                      if (localVal === undefined) {
                        merged[innerKey] = remoteVal;
                      }
                      // else: keep local (even if null/false - user explicitly unchecked)
                    }
                    out[dateKey] = merged;
                  }
                  // Otherwise keep local — safer than clobbering.
                }
              }
              return out;
            };

            // Merge dailyTaskTemplates (habits): local wins over incoming
            // This prevents habit checkbox toggles from being reverted by stale server data
            if (data.dailyTaskTemplates && Array.isArray(data.dailyTaskTemplates) && data.dailyTaskTemplates.length > 0) {
              const prev = (state.dailyTaskTemplates || []);
              const byId = new Map<string, unknown>();
              // First add server entries
              for (const h of data.dailyTaskTemplates) if ((h as any).id) byId.set((h as any).id, h);
              // Local wins - overlay with local entries
              for (const h of prev) if ((h as any).id) byId.set((h as any).id, h);
              state.dailyTaskTemplates = Array.from(byId.values());
            }
            // Merge per-date instead of wholesale replacing — preserves local ticks
            // that haven't yet round-tripped to the backend.
            if (logsResetPending) {
              state.dailyTaskLogs =
                data.dailyTaskLogs && typeof data.dailyTaskLogs === 'object'
                  ? (data.dailyTaskLogs as Record<string, unknown>)
                  : {};
              state.prayerLogs =
                data.prayerLogs && typeof data.prayerLogs === 'object'
                  ? (data.prayerLogs as Record<string, unknown>)
                  : {};
              state.dailyCompletionLog =
                data.dailyCompletionLog && typeof data.dailyCompletionLog === 'object'
                  ? (data.dailyCompletionLog as Record<string, DayCompletionPayload>)
                  : {};
              state.timelineRoutines =
                data.timelineRoutines && typeof data.timelineRoutines === 'object'
                  ? (data.timelineRoutines as Record<string, unknown>)
                  : {};
            } else {
              if (data.dailyTaskLogs && typeof data.dailyTaskLogs === 'object') {
                state.dailyTaskLogs = mergeByDate(state.dailyTaskLogs as Record<string, unknown>, data.dailyTaskLogs as Record<string, unknown>);
              }
              if (data.prayerLogs && typeof data.prayerLogs === 'object') {
                state.prayerLogs = mergeByDate(state.prayerLogs as Record<string, unknown>, data.prayerLogs as Record<string, unknown>);
              }
              if (data.dailyCompletionLog && typeof data.dailyCompletionLog === 'object') {
                state.dailyCompletionLog = mergeByDate(state.dailyCompletionLog as Record<string, unknown>, data.dailyCompletionLog as Record<string, unknown>) as Record<string, DayCompletionPayload>;
              }
              if (data.timelineRoutines != null && typeof data.timelineRoutines === 'object') {
                state.timelineRoutines = mergeByDate(state.timelineRoutines as Record<string, unknown>, data.timelineRoutines as Record<string, unknown>);
              }
            }
            // selectedDate is UI-only (navigation state); do not overwrite from server sync
            if (data.lifeGoals && ((data.lifeGoals.tiers && data.lifeGoals.tiers.length > 0) || (data.lifeGoals as any).collapsed !== undefined)) state.lifeGoals = normalizeLifeGoals(data.lifeGoals, buildDefaultLifeGoals()) as LifeGoalsState;

            if (data.timelinePanelExpanded !== undefined) state.timelinePanelExpanded = data.timelinePanelExpanded;
            if (data.todayTrainingExpanded !== undefined) state.todayTrainingExpanded = data.todayTrainingExpanded;
            if (data.lockedHabitsCollapsed !== undefined) state.lockedHabitsCollapsed = data.lockedHabitsCollapsed;
            // sectionOrder: server wins only if local is still the default (fresh browser / no local state)
            if (data.sectionOrder && typeof data.sectionOrder === 'object') {
              const local = state.sectionOrder as Record<string, string[]> | undefined;
              const isDefault = JSON.stringify(local) === JSON.stringify(defaultInitial.sectionOrder);
              if (isDefault) {
                state.sectionOrder = data.sectionOrder as Record<string, string[]>;
              }
            }
            // projectExpandedState: merge per-key, local wins — server fills in
            // missing keys but never clobbers a recent local toggle.
            if (data.projectExpandedState && typeof data.projectExpandedState === 'object') {
              const local = (state.projectExpandedState || {}) as Record<string, unknown>;
              const remote = data.projectExpandedState as Record<string, unknown>;
              const merged: Record<string, unknown> = { ...local };
              for (const k of Object.keys(remote)) {
                if (!(k in merged) || merged[k] == null) merged[k] = remote[k];
              }
              state.projectExpandedState = merged as Record<string, boolean>;
            }
            // activePomodoroTask: don't let a stale server snapshot kill a
            // live local timer. Only accept server value when local is null.
            if (data.activePomodoroTask !== undefined) {
              const local = state.activePomodoroTask;
              if (local == null && data.activePomodoroTask != null) {
                state.activePomodoroTask = data.activePomodoroTask;
              }
            }
            // Merge projects: local wins over incoming for all properties
            // to prevent race conditions where stale server data overwrites recent local changes
            if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
              const prev = (state.projects || []) as Project[];
              const byId = new Map<string, Project>();
              // First add server entries
              for (const p of data.projects) if (p.id) byId.set(p.id, p);
              // Local wins - overlay with local entries
              for (const p of prev) if (p.id) byId.set(p.id, p);
              state.projects = Array.from(byId.values());
            }
            // Merge quickTasks: local wins over incoming for all properties
            // This prevents checkbox toggles from being reverted by stale server data
            if (data.quickTasks && Array.isArray(data.quickTasks) && data.quickTasks.length > 0) {
              const prev = (state.quickTasks || []) as QuickTask[];
              const byId = new Map<string, QuickTask>();
              // First add server entries
              for (const t of data.quickTasks) if (t.id) byId.set(t.id, t);
              // Local wins - overlay with local entries
              for (const t of prev) if (t.id) byId.set(t.id, t);
              state.quickTasks = Array.from(byId.values());
            }
            // Merge top3Manual: preserve local manual slots over incoming
            if (data.top3Manual && Array.isArray(data.top3Manual)) {
              const prev = (state.top3Manual || []) as (Top3Slot | null)[];
              state.top3Manual = data.top3Manual.map((slot: Top3Slot | null, i: number) => {
                const curSlot = prev[i];
                // Keep local slot if it exists (user may have manually set it)
                if (curSlot && (curSlot.projectId || curSlot.quickTaskId)) return curSlot;
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
              // Past day: retroactive tick — logically the prayer was done AFTER
              // its window expired. Store a timestamp pinned to 23:59 of that
              // day so getPrayerState classifies it as "In ritardo" (orange)
              // rather than plain green "Completata".
              const endOfDay = new Date(selected);
              endOfDay.setHours(23, 59, 59, 999);
              state.prayerLogs[date][name] = { completedAt: endOfDay.toISOString() };
            }
          }),

        resetDailyLogs: () =>
          set((s: unknown) => {
            const state = s as {
              dailyTaskLogs: Record<string, unknown>;
              prayerLogs: Record<string, unknown>;
              dailyCompletionLog: Record<string, unknown>;
              timelineRoutines: Record<string, unknown>;
            };
            state.dailyTaskLogs = {};
            state.prayerLogs = {};
            state.dailyCompletionLog = {};
            state.timelineRoutines = {};
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
