import type { QuickTask, DayCompletionPayload } from '../../types/dashboard';
import { toDateKey, uid } from '../../components/dashboard/DashboardUtils';
import { haptic } from '../../utils/haptics';
import { logTimelineEvent } from '../storeHelpers';

export type QuickTaskSet = (fn: (s: unknown) => void) => void;
export type QuickTaskGet = () => {
  quickTasks: QuickTask[];
  projects: Array<{ id: string; title: string; tasks: unknown[]; ordinal?: number; active?: boolean; lifeGoalId?: string; deadline?: string }>;
  dailyCompletionLog: Record<string, DayCompletionPayload>;
  lifeGoals: { tiers: Array<{ goals: Array<{ id: string; done: boolean }> }> } | null;
  sharedDashboards: Array<{ share_id: string; data?: { quickTasks?: QuickTask[]; projects?: unknown[]; chat?: unknown[] } }>;
  updateSharedDashboardData: (shareId: string, updater: (d: { projects: unknown[]; quickTasks: QuickTask[]; chat: unknown[] }) => unknown) => void;
};

export function createQuickTaskSlice(set: QuickTaskSet, get: QuickTaskGet) {
  return {
    toggleQuickTask: (id: string, val: boolean) =>
      set((s: unknown) => {
        const state = s as { quickTasks: QuickTask[]; dailyCompletionLog: Record<string, DayCompletionPayload>; lifeGoals: { tiers: Array<{ goals: Array<{ id: string; done: boolean }> }> } | null };
        if (val) haptic([50]);
        const t = state.quickTasks.find((x) => x.id === id);
        if (t) {
          t.done = val;
          if (t.lifeGoalId) {
            for (const tier of state.lifeGoals?.tiers ?? []) {
              const goal = (tier.goals || []).find((g) => g.id === t.lifeGoalId);
              if (goal) {
                goal.done = val;
                break;
              }
            }
          }
          logTimelineEvent(state, 'quick', id, t.title, val);
        }
        const todayKey = toDateKey(new Date());
        const day = state.dailyCompletionLog[todayKey] || { quick: [], project: [] };
        const nextQuick = val
          ? day.quick?.includes(id)
            ? day.quick
            : [...(day.quick || []), id]
          : (day.quick || []).filter((x) => x !== id);
        state.dailyCompletionLog[todayKey] = { ...day, quick: nextQuick };
      }),

    removeQuickTask: (id: string) =>
      set((s: unknown) => {
        const state = s as { quickTasks: QuickTask[]; top3Manual: (unknown)[] };
        state.quickTasks = state.quickTasks.filter((t) => t.id !== id && t.parentId !== id);
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { quickTaskId?: string }).quickTaskId === id ? null : slot
        );
      }),

    reorderQuickTasks: (fromIndex: number, toIndex: number) =>
      set((s: unknown) => {
        const state = s as { quickTasks: QuickTask[] };
        if (fromIndex === toIndex) return;
        const root = state.quickTasks.filter((t) => !t.parentId);
        const rest = state.quickTasks.filter((t) => t.parentId);
        const [removed] = root.splice(fromIndex, 1);
        root.splice(toIndex, 0, removed);
        state.quickTasks = [...root, ...rest];
      }),

    updateQuickTask: (id: string, updater: (t: QuickTask) => Partial<QuickTask>) =>
      set((s: unknown) => {
        const state = s as { quickTasks: QuickTask[] };
        const t = state.quickTasks.find((x) => x.id === id);
        if (t) Object.assign(t, updater(t));
      }),

    addQuickTaskAction: (title: string) =>
      set((s: unknown) => {
        const state = s as { quickTasks: QuickTask[]; quickTaskDraft?: string };
        const t = title.trim();
        if (t) {
          state.quickTasks.push({
            id: `quick-${Date.now()}`,
            title: t,
            done: false,
            deadline: undefined,
          });
          state.quickTaskDraft = '';
        }
      }),

    updateSharedDashboardData: (shareId: string, updater: (data: { projects: unknown[]; quickTasks: QuickTask[]; chat: unknown[] }) => unknown) =>
      set((s: unknown) => {
        const state = s as { sharedDashboards: Array<{ share_id: string; data?: { projects?: unknown[]; quickTasks?: QuickTask[]; chat?: unknown[] } }> };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd) {
          const prevData = sd.data || {};
          const base = {
            projects: prevData.projects ?? [],
            quickTasks: prevData.quickTasks ?? [],
            chat: prevData.chat ?? [],
          };
          sd.data = updater(base) as typeof base;
        }
      }),

    toggleSharedQuickTask: (shareId: string, taskId: string, val: boolean) => {
      const state = get();
      const sd = state.sharedDashboards?.find((x: { share_id: string }) => x.share_id === shareId);
      const title = sd?.data?.quickTasks?.find((t: { id: string }) => t.id === taskId)?.title;
      set((s: unknown) => {
        logTimelineEvent(s as { dailyCompletionLog: Record<string, DayCompletionPayload> }, 'shared_quick', taskId, title ?? '', val);
      });
      get().updateSharedDashboardData(shareId, (data) => ({
        ...data,
        quickTasks: (data.quickTasks || []).map((t) => (t.id === taskId ? { ...t, done: val } : t)),
      }));
    },

    updateSharedQuickTask: (shareId: string, taskId: string, updater: (t: QuickTask) => Partial<QuickTask>) => {
      get().updateSharedDashboardData(shareId, (data) => ({
        ...data,
        quickTasks: (data.quickTasks || []).map((t) => (t.id === taskId ? { ...t, ...updater(t) } : t)),
      }));
    },

    removeSharedQuickTask: (shareId: string, taskId: string) => {
      get().updateSharedDashboardData(shareId, (data) => ({
        ...data,
        quickTasks: (data.quickTasks || []).filter((t) => t.id !== taskId && t.parentId !== taskId),
      }));
      set((s: unknown) => {
        const state = s as { top3Manual: (unknown)[] };
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { shareId?: string; quickTaskId?: string }).shareId === shareId && (slot as { quickTaskId?: string }).quickTaskId === taskId ? null : slot
        );
      });
    },

    promoteQuickTaskToProject: (taskId: string) =>
      set((s: unknown) => {
        const state = s as {
          quickTasks: QuickTask[];
          projects: Array<{ id: string; title: string; tasks: unknown[]; ordinal?: number; active?: boolean; lifeGoalId?: string; deadline?: string }>;
          top3Manual: (unknown)[];
        };
        const task = state.quickTasks.find((t) => t.id === taskId);
        if (!task) return;
        // Create new project from the quick task
        const newProject = {
          id: uid('proj'),
          title: task.title,
          tasks: [],
          ordinal: state.projects.length,
          active: true,
          deadline: task.deadline,
        };
        state.projects.push(newProject);
        // Remove the quick task
        state.quickTasks = state.quickTasks.filter((t) => t.id !== taskId && t.parentId !== taskId);
        // Clean up top3Manual
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { quickTaskId?: string }).quickTaskId === taskId ? null : slot
        );
      }),

    moveQuickTaskToProject: (taskId: string, projectId: string) =>
      set((s: unknown) => {
        const state = s as {
          quickTasks: QuickTask[];
          projects: Array<{ id: string; title: string; tasks: unknown[]; ordinal?: number; active?: boolean; lifeGoalId?: string; deadline?: string }>;
          top3Manual: (unknown)[];
        };
        const task = state.quickTasks.find((t) => t.id === taskId);
        if (!task) return;
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return;
        // Add task to project as a new task node
        const newNode = { id: uid('task'), title: task.title, done: task.done, deadline: task.deadline, children: [] };
        project.tasks = [...(project.tasks || []), newNode];
        // Remove the quick task
        state.quickTasks = state.quickTasks.filter((t) => t.id !== taskId && t.parentId !== taskId);
        // Clean up top3Manual
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { quickTaskId?: string }).quickTaskId === taskId ? null : slot
        );
      }),
  };
}
