import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { syncMiddleware } from './syncMiddleware';
import { loadState, buildDefaultLifeGoals, normalizeLifeGoals, toDateKey, updateNodeInTree, removeNodeFromTree, collectNodeAndDescendantIds, createTaskNode, uid } from '../components/dashboard/DashboardUtils';
import { haptic } from '../utils/haptics';

const initialState = loadState() || {
  dailyTaskTemplates: [],
  dailyTaskLogs: {},
  projects: [],
  prayerLogs: {},
  top3Manual: [null, null, null],
  quickTasks: [],
  dailyCompletionLog: {},
  lifeGoals: buildDefaultLifeGoals(),
  timelineRoutines: {},
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
        sharedDashboards: [],

        // --- Basic Setters ---
        setIsLoaded: (val) => set((s) => { s.isLoaded = val; }),
        setLastSavedAt: (val) => set((s) => { s.lastSavedAt = val; }),
        setConfirmState: (val) => set((s) => { s.confirmState = val; }),
        
        // --- Domain Setters (These trigger syncMiddleware via 'set') ---
        setDailyTaskTemplates: (val) => set((s) => { 
          s.dailyTaskTemplates = typeof val === 'function' ? val(s.dailyTaskTemplates) : val; 
        }),
        setDailyTaskLogs: (val) => set((s) => { 
          s.dailyTaskLogs = typeof val === 'function' ? val(s.dailyTaskLogs) : val; 
        }),
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

        // --- UI Setters ---
        setQuickTaskDraft: (val) => set((s) => { s.quickTaskDraft = val; }),
        setQuickTaskEditingId: (val) => set((s) => { s.quickTaskEditingId = val; }),
        setQuickTaskEditingTitle: (val) => set((s) => { s.quickTaskEditingTitle = val; }),
        setHabitDraft: (val) => set((s) => { s.habitDraft = val; }),
        setHabitEditingId: (val) => set((s) => { s.habitEditingId = val; }),
        setHabitEditingTitle: (val) => set((s) => { s.habitEditingTitle = val; }),
        setProjectTaskDrafts: (val) => set((s) => { 
          s.projectTaskDrafts = typeof val === 'function' ? val(s.projectTaskDrafts) : val; 
        }),
        setProjectDeadlineEditing: (val) => set((s) => { s.projectDeadlineEditing = val; }),
        setProjectDeadlineInput: (val) => set((s) => { s.projectDeadlineInput = val; }),
        setQuickTaskDeadlineEditing: (val) => set((s) => { s.quickTaskDeadlineEditing = val; }),
        setQuickTaskDeadlineInput: (val) => set((s) => { s.quickTaskDeadlineInput = val; }),
        setGoalTaskDrafts: (val) => set((s) => { 
          s.goalTaskDrafts = typeof val === 'function' ? val(s.goalTaskDrafts) : val; 
        }),
        setGoalDeadlineEditing: (val) => set((s) => { s.goalDeadlineEditing = val; }),
        setGoalDeadlineInput: (val) => set((s) => { s.goalDeadlineInput = val; }),
        setSharedDashboards: (val) => set((s) => { 
          s.sharedDashboards = typeof val === 'function' ? val(s.sharedDashboards) : val; 
        }),

        // --- Global Actions ---
        syncWithServer: (data) => set((s) => {
          if (data.dailyTaskTemplates) s.dailyTaskTemplates = data.dailyTaskTemplates;
          if (data.dailyTaskLogs) s.dailyTaskLogs = data.dailyTaskLogs;
          if (data.projects) s.projects = data.projects;
          if (data.prayerLogs) s.prayerLogs = data.prayerLogs;
          if (data.top3Manual) s.top3Manual = data.top3Manual;
          if (data.quickTasks) s.quickTasks = data.quickTasks;
          if (data.dailyCompletionLog) s.dailyCompletionLog = data.dailyCompletionLog;
          if (data.lifeGoals) s.lifeGoals = normalizeLifeGoals(data.lifeGoals, buildDefaultLifeGoals());
          if (data.timelineRoutines != null && typeof data.timelineRoutines === 'object') s.timelineRoutines = data.timelineRoutines;
        }),

        // --- QuickTasks Actions ---
        toggleQuickTask: (id, val) => set((s) => {
          if (val) haptic([50]);
          const t = s.quickTasks.find(x => x.id === id);
          if (t) {
            t.done = val;
            if (t.lifeGoalId) {
              for (const tier of (s.lifeGoals?.tiers ?? [])) {
                const goal = (tier.goals || []).find(g => g.id === t.lifeGoalId);
                if (goal) { goal.done = val; break; }
              }
            }
          }
          const todayKey = toDateKey(new Date());
          const day = s.dailyCompletionLog[todayKey] || { quick: [], project: [] };
          const nextQuick = val ? (day.quick?.includes(id) ? day.quick : [...(day.quick || []), id]) : (day.quick || []).filter(x => x !== id);
          s.dailyCompletionLog[todayKey] = { ...day, quick: nextQuick };
        }),
        removeQuickTask: (id) => set((s) => {
          s.quickTasks = s.quickTasks.filter(t => t.id !== id && t.parentId !== id);
          s.top3Manual = s.top3Manual.map(slot => (slot && slot.quickTaskId === id) ? null : slot);
        }),
        reorderQuickTasks: (fromIndex, toIndex) => set((s) => {
          if (fromIndex === toIndex) return;
          const root = s.quickTasks.filter(t => !t.parentId);
          const rest = s.quickTasks.filter(t => t.parentId);
          const [removed] = root.splice(fromIndex, 1);
          root.splice(toIndex, 0, removed);
          s.quickTasks = [...root, ...rest];
        }),
        updateQuickTask: (id, updater) => set((s) => {
          const t = s.quickTasks.find(x => x.id === id);
          if (t) {
            const next = updater(t);
            Object.assign(t, next);
          }
        }),
        addQuickTaskAction: (title) => set((s) => {
          const t = title.trim();
          if (t) {
            s.quickTasks.push({ id: `quick-${Date.now()}`, title: t, done: false, deadline: undefined });
            s.quickTaskDraft = '';
          }
        }),

        // --- Shared Dashboards Actions ---
        updateSharedDashboardData: (shareId, updater) => set((s) => {
          const sd = s.sharedDashboards.find(x => x.share_id === shareId);
          if (sd) {
            const prevData = sd.data || {};
            const base = {
              projects: prevData.projects ?? [],
              quickTasks: prevData.quickTasks ?? [],
              chat: prevData.chat ?? [],
            };
            sd.data = updater(base);
          }
        }),
        toggleSharedQuickTask: (shareId, taskId, val) => {
          get().updateSharedDashboardData(shareId, data => ({
            ...data,
            quickTasks: (data.quickTasks || []).map(t => t.id === taskId ? { ...t, done: val } : t)
          }));
        },
        updateSharedQuickTask: (shareId, taskId, updater) => {
          get().updateSharedDashboardData(shareId, data => ({
            ...data,
            quickTasks: (data.quickTasks || []).map(t => t.id === taskId ? { ...t, ...updater(t) } : t)
          }));
        },
        removeSharedQuickTask: (shareId, taskId) => {
          get().updateSharedDashboardData(shareId, data => ({
            ...data,
            quickTasks: (data.quickTasks || []).filter(t => t.id !== taskId && t.parentId !== taskId)
          }));
          set((s) => {
            s.top3Manual = s.top3Manual.map(slot => (slot && slot.shareId === shareId && slot.quickTaskId === taskId) ? null : slot);
          });
        },

        // --- Top3 Actions ---
        setTop3SlotAtIndex: (index, slot) => set((s) => {
          s.top3Manual[index] = slot;
        }),
        reorderTop3: (fromIndex, toIndex) => set((s) => {
          const item = s.top3Manual[fromIndex];
          s.top3Manual[fromIndex] = s.top3Manual[toIndex];
          s.top3Manual[toIndex] = item;
        }),
        removeFromTop3: (index) => set((s) => {
          s.top3Manual[index] = null;
        }),

        // --- Habits Actions ---
        toggleDailyTask: (id, done) => set((s) => {
          if (done) haptic([50]);
          const date = toDateKey(new Date());
          if (!s.dailyTaskLogs[date]) s.dailyTaskLogs[date] = [];
          if (done) {
            const existing = s.dailyTaskLogs[date].find(x => x.id === id);
            if (!existing) {
              s.dailyTaskLogs[date].push({ id, done: true });
            }
          } else {
            s.dailyTaskLogs[date] = s.dailyTaskLogs[date].filter(x => x.id !== id);
          }
        }),
        toggleHabitLock: (id) => set((s) => {
          const h = s.dailyTaskTemplates.find(x => x.id === id);
          if (h) h.locked = !h.locked;
        }),
        removeDailyTask: (id) => set((s) => {
          s.dailyTaskTemplates = s.dailyTaskTemplates.filter(x => x.id !== id);
          // Also clean up logs to prevent memory leak
          Object.keys(s.dailyTaskLogs).forEach(date => {
            if (Array.isArray(s.dailyTaskLogs[date])) {
              s.dailyTaskLogs[date] = s.dailyTaskLogs[date].filter(x => x.id !== id);
            }
          });
        }),
        togglePrayer: (name, val) => set((s) => {
          if (val) haptic([50]);
          const date = toDateKey(new Date());
          if (!s.prayerLogs[date]) s.prayerLogs[date] = {};
          s.prayerLogs[date][name] = val;
        }),
        reorderHabits: (fromIndex, toIndex) => set((s) => {
          if (fromIndex === toIndex) return;
          const [removed] = s.dailyTaskTemplates.splice(fromIndex, 1);
          s.dailyTaskTemplates.splice(toIndex, 0, removed);
          s.dailyTaskTemplates.forEach((h, i) => h.ordinal = i);
        }),
        addHabitAction: (title) => set((s) => {
          const t = title.trim();
          if (t) {
            s.dailyTaskTemplates.push({ id: `daily-${Date.now()}`, title: t, locked: false, ordinal: s.dailyTaskTemplates.length });
            s.habitDraft = '';
          }
        }),

        // --- Projects Actions ---
        createProject: () => set((s) => {
          s.projects.unshift({ id: `project-${Date.now()}`, title: 'New Project', active: true, tasks: [], deadline: undefined, ordinal: 0 });
          s.projects.forEach((p, i) => p.ordinal = i);
        }),
        deleteProject: (projectId) => set((s) => {
          s.projects = s.projects.filter(x => x.id !== projectId);
          s.top3Manual = s.top3Manual.map(slot => (slot && slot.projectId === projectId) ? null : slot);
          delete s.projectTaskDrafts[projectId];
        }),
        reorderProjects: (fromIdx, toIdx) => set((s) => {
          if (fromIdx === toIdx) return;
          const [removed] = s.projects.splice(fromIdx, 1);
          s.projects.splice(toIdx, 0, removed);
          s.projects.forEach((p, i) => p.ordinal = i);
        }),
        updateProject: (id, updater) => set((s) => {
          const p = s.projects.find(x => x.id === id);
          if (p) {
            const next = updater(p);
            Object.assign(p, next);
          }
        }),
        toggleProjectTask: (projectId, taskId, val) => set((s) => {
          if (val) haptic([50]);
          const p = s.projects.find(x => x.id === projectId);
          if (p) {
            p.tasks = updateNodeInTree(p.tasks, taskId, n => ({ ...n, done: val }));
            if (p.lifeGoalId) {
              for (const tier of (s.lifeGoals?.tiers ?? [])) {
                const goal = (tier.goals || []).find(g => g.id === p.lifeGoalId);
                if (goal) {
                  goal.tasks = updateNodeInTree(goal.tasks, taskId, n => ({ ...n, done: val }));
                  break;
                }
              }
            }
          }
          const todayKey = toDateKey(new Date());
          const day = s.dailyCompletionLog[todayKey] || { quick: [], project: [] };
          const key = `${projectId}:${taskId}`;
          const nextProject = val ? (day.project?.includes(key) ? day.project : [...(day.project || []), key]) : (day.project || []).filter(x => x !== key);
          s.dailyCompletionLog[todayKey] = { ...day, project: nextProject };
        }),
        moveProjectTask: (projectId, taskId, targetIndex) => set((s) => {
          const p = s.projects.find(x => x.id === projectId);
          if (p) {
            const next = [...(p.tasks || [])];
            const fromIndex = next.findIndex(t => t.id === taskId);
            if (fromIndex !== -1) {
              const [removed] = next.splice(fromIndex, 1);
              next.splice(targetIndex, 0, removed);
              p.tasks = next;
            }
          }
        }),
        moveSubtask: (projectId, parentId, taskId, targetIndex) => set((s) => {
          const p = s.projects.find(x => x.id === projectId);
          if (p) {
            p.tasks = updateNodeInTree(p.tasks, parentId, parent => {
              const next = [...(parent.children || [])];
              const fromIndex = next.findIndex(t => t.id === taskId);
              if (fromIndex !== -1) {
                const [removed] = next.splice(fromIndex, 1);
                next.splice(targetIndex, 0, removed);
                return { ...parent, children: next };
              }
              return parent;
            });
          }
        }),
        updateSharedDashboardProject: (shareId, projectId, updater) => set((s) => {
          const sd = s.sharedDashboards.find(x => x.share_id === shareId);
          if (sd) {
            if (!sd.data) sd.data = { projects: [], quickTasks: [], chat: [] };
            sd.data.projects = (sd.data.projects || []).map(p => p.id === projectId ? updater(p) : p);
          }
        }),
        deleteSharedDashboardProject: (shareId, projectId) => set((s) => {
          const sd = s.sharedDashboards.find(x => x.share_id === shareId);
          if (sd && sd.data) {
            sd.data.projects = (sd.data.projects || []).filter(p => p.id !== projectId);
          }
        }),
        reorderSharedDashboardProjects: (shareId, fromIdx, toIdx) => set((s) => {
          const sd = s.sharedDashboards.find(x => x.share_id === shareId);
          if (sd && sd.data) {
            const projs = [...(sd.data.projects || [])];
            const [removed] = projs.splice(fromIdx, 1);
            projs.splice(toIdx, 0, removed);
            sd.data.projects = projs;
          }
        }),

        // --- Timeline Routines (Daily small wins between prayers) ---
        addTimelineRoutine: (dateKey, slotKey, title) => set((s) => {
          if (!s.timelineRoutines[dateKey]) s.timelineRoutines[dateKey] = {};
          if (!s.timelineRoutines[dateKey][slotKey]) s.timelineRoutines[dateKey][slotKey] = [];
          s.timelineRoutines[dateKey][slotKey].push({ id: uid('tl'), title: (title || '').trim() || 'Nuova routine', done: false });
        }),
        toggleTimelineRoutine: (dateKey, slotKey, routineId, done) => set((s) => {
          const list = s.timelineRoutines[dateKey]?.[slotKey];
          if (!Array.isArray(list)) return;
          const r = list.find(x => x.id === routineId);
          if (r) r.done = done;
        }),
        removeTimelineRoutine: (dateKey, slotKey, routineId) => set((s) => {
          if (!s.timelineRoutines[dateKey]?.[slotKey]) return;
          s.timelineRoutines[dateKey][slotKey] = s.timelineRoutines[dateKey][slotKey].filter(x => x.id !== routineId);
        }),

        // --- Life Goals Actions ---
        updateLifeGoals: (updater) => set((s) => {
          const next = typeof updater === 'function' ? updater(s.lifeGoals) : updater;
          s.lifeGoals = next;
        }),
        toggleTierCollapse: (tierId) => set((s) => {
          const tier = (s.lifeGoals?.tiers ?? []).find(t => t.id === tierId);
          if (tier) tier.collapsed = !tier.collapsed;
        }),
        moveGoalToTier: (goalId, targetTierId) => set((s) => {
          let goal = null;
          let sourceTier = null;
          for (const t of (s.lifeGoals?.tiers ?? [])) {
            const idx = t.goals.findIndex(g => g.id === goalId);
            if (idx !== -1) {
              [goal] = t.goals.splice(idx, 1);
              sourceTier = t;
              break;
            }
          }
          if (goal) {
            const targetTier = (s.lifeGoals?.tiers ?? []).find(t => t.id === targetTierId);
            if (targetTier) {
              targetTier.goals.push(goal);
            } else if (sourceTier) {
              sourceTier.goals.push(goal); // Rollback
            }
          }
        }),
        updateGoal: (goalId, updater) => set((s) => {
          for (const t of (s.lifeGoals?.tiers ?? [])) {
            const goal = t.goals.find(g => g.id === goalId);
            if (goal) {
              const next = updater(goal);
              Object.assign(goal, next);
              break;
            }
          }
        }),
        deleteGoal: (goalId) => set((s) => {
          for (const t of (s.lifeGoals?.tiers ?? [])) {
            t.goals = (t.goals || []).filter(g => g.id !== goalId);
          }
        }),
        addGoalToTier: (tierId, title, category, type) => set((s) => {
          const tier = (s.lifeGoals?.tiers ?? []).find(t => t.id === tierId);
          if (tier) {
            tier.goals.push({
              id: `goal-${Date.now()}`,
              title,
              category,
              type,
              done: false,
              deadline: null,
              tasks: [],
              ordinal: tier.goals.length
            });
          }
        }),
        promoteGoalToProjects: (goalId) => set((s) => {
          const linked = s.projects.find((p) => p.lifeGoalId === goalId);
          if (linked) {
            linked.lifeGoalId = undefined;
            s.top3Manual = s.top3Manual.map(slot => (slot && slot.projectId === linked.id) ? null : slot);
            return;
          }
          let goalToLink = null;
          for (const tier of (s.lifeGoals?.tiers ?? [])) {
            const found = tier.goals.find(g => g.id === goalId);
            if (found) { goalToLink = { ...found }; break; }
          }
          if (!goalToLink) return;
          s.projects.unshift({
            id: uid('project'),
            lifeGoalId: goalId,
            title: goalToLink.title,
            active: true,
            tasks: goalToLink.tasks || [],
            deadline: goalToLink.deadline || undefined,
            ordinal: 0
          });
          s.projects.forEach((p, i) => p.ordinal = i);
        }),
        promoteGoalToQuickTasks: (goalId) => set((s) => {
          const linkedRoots = s.quickTasks.filter((t) => t.lifeGoalId === goalId && !t.parentId);
          if (linkedRoots.length > 0) {
            s.quickTasks.forEach((t) => { if (t.lifeGoalId === goalId) t.lifeGoalId = undefined; });
            s.top3Manual = s.top3Manual.map(slot => (slot && slot.quickTaskId && linkedRoots.some(r => r.id === slot.quickTaskId)) ? null : slot);
            return;
          }
          let goalToLink = null;
          for (const tier of (s.lifeGoals?.tiers ?? [])) {
            const found = (tier.goals || []).find(g => g.id === goalId);
            if (found) { goalToLink = { ...found }; break; }
          }
          if (!goalToLink) return;
          s.quickTasks.unshift({
            id: uid('task'),
            lifeGoalId: goalId,
            title: goalToLink.title,
            done: goalToLink.done,
            deadline: goalToLink.deadline || undefined,
            ordinal: 0
          });
          s.quickTasks.forEach((q, i) => q.ordinal = i);
        }),
      }))
    )
  )
);
