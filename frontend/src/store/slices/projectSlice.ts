import type { Project, TaskNode } from '../../types/dashboard';
import {
  toDateKey,
  updateNodeInTree,
  removeNodeFromTree,
  collectNodeAndDescendantIds,
} from '../../components/dashboard/DashboardUtils';
import { uid } from '../../components/dashboard/DashboardUtils';
import { haptic } from '../../utils/haptics';
import { logTimelineEvent, findTaskTitle } from '../storeHelpers';

export type ProjectSet = (fn: (s: unknown) => void) => void;
export type ProjectGet = () => {
  projects: Project[];
  lifeGoals: { tiers: Array<{ goals: Array<{ id: string; tasks: TaskNode[] }> }> } | null;
  dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
  top3Manual: unknown[];
};

export function createProjectSlice(set: ProjectSet, get: ProjectGet) {
  return {
    createProject: () =>
      set((s: unknown) => {
        const state = s as { projects: Project[] };
        state.projects.unshift({
          id: `project-${Date.now()}`,
          title: 'New Project',
          active: true,
          tasks: [],
          deadline: undefined,
          ordinal: 0,
        });
        state.projects.forEach((p, i) => (p.ordinal = i));
      }),

    deleteProject: (projectId: string) =>
      set((s: unknown) => {
        const state = s as { projects: Project[]; top3Manual: (unknown)[]; projectTaskDrafts: Record<string, string> };
        state.projects = state.projects.filter((x) => x.id !== projectId);
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { projectId?: string }).projectId === projectId ? null : slot
        );
        delete state.projectTaskDrafts[projectId];
      }),

    reorderProjects: (fromIdx: number, toIdx: number) =>
      set((s: unknown) => {
        const state = s as { projects: Project[] };
        if (fromIdx === toIdx) return;
        const [removed] = state.projects.splice(fromIdx, 1);
        state.projects.splice(toIdx, 0, removed);
        state.projects.forEach((p, i) => (p.ordinal = i));
      }),

    updateProject: (id: string, updater: (p: Project) => Partial<Project>) =>
      set((s: unknown) => {
        const state = s as { projects: Project[] };
        const p = state.projects.find((x) => x.id === id);
        if (p) Object.assign(p, updater(p));
      }),

    toggleProjectTask: (projectId: string, taskId: string, val: boolean) =>
      set((s: unknown) => {
        const state = s as {
          projects: Project[];
          lifeGoals: { tiers: Array<{ goals: Array<{ id: string; tasks: TaskNode[] }> }> } | null;
          dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
        };
        if (val) haptic([50]);
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          const title = findTaskTitle(p.tasks, taskId);
          logTimelineEvent(state, 'project', taskId, title ?? '', val, p.title);
          p.tasks = updateNodeInTree(p.tasks, taskId, (n) => ({ ...n, done: val })) as TaskNode[];
          if (p.lifeGoalId) {
            for (const tier of state.lifeGoals?.tiers ?? []) {
              const goal = (tier.goals || []).find((g) => g.id === p.lifeGoalId);
              if (goal) {
                goal.tasks = updateNodeInTree(goal.tasks, taskId, (n) => ({ ...n, done: val })) as TaskNode[];
                break;
              }
            }
          }
        }
        const todayKey = toDateKey(new Date());
        const day = state.dailyCompletionLog[todayKey] || { quick: [], project: [] };
        const key = `${projectId}:${taskId}`;
        const nextProject = val
          ? day.project?.includes(key)
            ? day.project
            : [...(day.project || []), key]
          : (day.project || []).filter((x) => x !== key);
        state.dailyCompletionLog[todayKey] = { ...day, project: nextProject };
      }),

    moveProjectTask: (projectId: string, taskId: string, targetIndex: number) =>
      set((s: unknown) => {
        const state = s as { projects: Project[] };
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          const next = [...(p.tasks || [])];
          const fromIndex = next.findIndex((t) => t.id === taskId);
          if (fromIndex !== -1) {
            const [removed] = next.splice(fromIndex, 1);
            next.splice(targetIndex, 0, removed);
            p.tasks = next;
          }
        }
      }),

    moveSubtask: (projectId: string, parentId: string, taskId: string, targetIndex: number) =>
      set((s: unknown) => {
        const state = s as { projects: Project[] };
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          p.tasks = updateNodeInTree(p.tasks, parentId, (parent) => {
            const next = [...(parent.children || [])];
            const fromIndex = next.findIndex((t) => t.id === taskId);
            if (fromIndex !== -1) {
              const [removed] = next.splice(fromIndex, 1);
              next.splice(targetIndex, 0, removed);
              return { ...parent, children: next };
            }
            return parent;
          }) as TaskNode[];
        }
      }),

    deleteProjectTask: (projectId: string, taskId: string) =>
      set((s: unknown) => {
        const state = s as {
          projects: Project[];
          top3Manual: Array<{ projectId?: string; taskId?: string; shareId?: string } | null>;
          dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
        };
        const p = state.projects.find((x) => x.id === projectId);
        if (!p) return;
        const idsToClear = collectNodeAndDescendantIds(p.tasks, taskId);
        p.tasks = removeNodeFromTree(p.tasks, taskId) as TaskNode[];
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && slot.projectId === projectId && idsToClear.has(slot.taskId) && !slot.shareId ? null : slot
        );
        const todayKey = toDateKey(new Date());
        Object.keys(state.dailyCompletionLog).forEach((k) => {
          const day = state.dailyCompletionLog[k];
          if (!day?.project) return;
          day.project = day.project.filter((entry) => {
            const [pid, tid] = String(entry).split(':');
            return pid !== projectId || !idsToClear.has(tid);
          });
        });
      }),

    updateSharedDashboardProject: (
      shareId: string,
      projectId: string,
      updater: (p: Project) => Partial<Project>
    ) =>
      set((s: unknown) => {
        const state = s as {
          sharedDashboards: Array<{ share_id: string; data?: { projects?: Project[] } }>;
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd) {
          if (!sd.data) sd.data = { projects: [], quickTasks: [], chat: [] };
          sd.data.projects = (sd.data.projects || []).map((p) => (p.id === projectId ? updater(p) : p));
        }
      }),

    deleteSharedDashboardProject: (shareId: string, projectId: string) =>
      set((s: unknown) => {
        const state = s as {
          sharedDashboards: Array<{ share_id: string; data?: { projects?: Project[] } }>;
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd?.data) sd.data.projects = (sd.data.projects || []).filter((p) => p.id !== projectId);
      }),

    reorderSharedDashboardProjects: (shareId: string, fromIdx: number, toIdx: number) =>
      set((s: unknown) => {
        const state = s as {
          sharedDashboards: Array<{ share_id: string; data?: { projects?: Project[] } }>;
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd?.data) {
          const projs = [...(sd.data.projects || [])];
          const [removed] = projs.splice(fromIdx, 1);
          projs.splice(toIdx, 0, removed);
          sd.data.projects = projs;
        }
      }),
  };
}
