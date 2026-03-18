import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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
import { loadState, buildDefaultLifeGoals, normalizeLifeGoals, toDateKey, removeNodeFromTree, collectNodeAndDescendantIds, createTaskNode, uid, PRAYER_SLOTS, getCurrentSlotKey } from '../components/dashboard/DashboardUtils';
import { haptic } from '../utils/haptics';
import { logTimelineEvent } from './storeHelpers';

const initialState = loadState() || {
  dailyTaskTemplates:[],
  dailyTaskLogs: {},
  projects: [],
  prayerLogs: {},
  top3Manual:[null, null, null],
  quickTasks:[],
  dailyCompletionLog: {},
  lifeGoals: buildDefaultLifeGoals(),
  timelineRoutines: {},
  timelinePanelExpanded: true,
};

export const useDashboardStore = create(
  subscribeWithSelector(
    syncMiddleware(
      immer((set, get) => ({
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
        projectTaskDrafts: {},
        projectDeadlineEditing: null,
        projectDeadlineInput: '',
        quickTaskDeadlineEditing: null,
        quickTaskDeadlineInput: '',
        goalTaskDrafts: {},
        goalDeadlineEditing: null,
        goalDeadlineInput: '',
        sharedDashboards:[],
        timelinePanelExpanded: initialState.timelinePanelExpanded !== false,

        // --- Slices (actions + some setters) ---
        ...createUISlice(set),
        ...createHabitSlice(set, get),
        /** Registra un completamento in "completati in questo slot" (es. goal/task da Top 3 che non passano da toggleQuickTask) */
        logTimelineCompletionEvent: (type, id, title, val) => set((s) => { logTimelineEvent(s, type, id, title, val); }),

        // --- Domain Setters (for syncWithServer) ---
        setProjects: (val) => set((s) => { 
          s.projects = typeof val === 'function' ? val(s.projects) : val; 
        }),
        setPrayerLogs: (val) => set((s) => { 
          s.prayerLogs = typeof val === 'function' ? val(s.prayerLogs) : val; 
        }),
        setTop3Manual: (val) => set((s) => { 
          s.top3Manual = typeof val === 'function' ? val(s.top3Manual) : val; 
        }),
        setQuickTasks: (val) => set((s) => { 
          s.quickTasks = typeof val === 'function' ? val(s.quickTasks) : val; 
        }),
        setDailyCompletionLog: (val) => set((s) => { 
          s.dailyCompletionLog = typeof val === 'function' ? val(s.dailyCompletionLog) : val; 
        }),
        setLifeGoals: (val) => set((s) => { 
          s.lifeGoals = typeof val === 'function' ? val(s.lifeGoals) : val; 
        }),

        // --- Global Actions ---
        syncWithServer: (data) => set((s) => {
          if (data.dailyTaskTemplates) s.dailyTaskTemplates = data.dailyTaskTemplates;
          if (data.dailyTaskLogs) s.dailyTaskLogs = data.dailyTaskLogs;
          if (data.prayerLogs) s.prayerLogs = data.prayerLogs;
          if (data.dailyCompletionLog) s.dailyCompletionLog = data.dailyCompletionLog;
          if (data.lifeGoals) s.lifeGoals = normalizeLifeGoals(data.lifeGoals, buildDefaultLifeGoals());
          if (data.timelineRoutines != null && typeof data.timelineRoutines === 'object') s.timelineRoutines = data.timelineRoutines;
          if (data.timelinePanelExpanded !== undefined) s.timelinePanelExpanded = data.timelinePanelExpanded;
          // Progetti: preserva lifeGoalId dallo stato corrente così "Sincronizza con Progetti" resta ricordato
          if (data.projects && Array.isArray(data.projects)) {
            const prev = s.projects || [];
            s.projects = data.projects.map((p) => {
              const cur = prev.find((x) => x.id === p.id);
              return cur?.lifeGoalId != null ? { ...p, lifeGoalId: cur.lifeGoalId } : p;
            });
          }
          // Quick tasks: preserva lifeGoalId così "Sincronizza con Quick Tasks" resta ricordato
          if (data.quickTasks && Array.isArray(data.quickTasks)) {
            const prev = s.quickTasks || [];
            s.quickTasks = data.quickTasks.map((t) => {
              const cur = prev.find((x) => x.id === t.id);
              return cur?.lifeGoalId != null ? { ...t, lifeGoalId: cur.lifeGoalId } : t;
            });
          }
          // Top 3: preserva slot con lg- o quickTaskId così i focus restano ricordati
          if (data.top3Manual && Array.isArray(data.top3Manual)) {
            const prev = s.top3Manual || [];
            s.top3Manual = data.top3Manual.map((slot, i) => {
              const curSlot = prev[i];
              if (curSlot && (curSlot.projectId?.startsWith?.('lg-') || curSlot.quickTaskId)) return curSlot;
              return slot;
            });
          }
        }),

        ...createQuickTaskSlice(set, get),
        ...createTop3Slice(set),

        togglePrayer: (name, val) => set((s) => {
          if (val) haptic([50]);
          const date = toDateKey(new Date());
          if (!s.prayerLogs[date]) s.prayerLogs[date] = {};
          s.prayerLogs[date][name] = val;
        }),

        ...createProjectSlice(set, get),
        ...createTimelineSlice(set),
        ...createLifeGoalsSlice(set, get),

      }))
    )
  )
);