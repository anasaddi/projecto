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
        const state = s as { 
          projects: Project[]; 
          top3Manual: (unknown)[]; 
          projectTaskDrafts: Record<string, string>;
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
        };
        state.projects = state.projects.filter((x) => x.id !== projectId);
        state.top3Manual = state.top3Manual.map((slot) =>
          slot && (slot as { projectId?: string }).projectId === projectId ? null : slot
        );
        delete state.projectTaskDrafts[projectId];
        
        // SYNC: Remove any shared projects that were synced from this personal project
        state.sharedDashboards.forEach((sd) => {
          if (!sd.data) return;
          const projects = (sd.data.projects as Project[]) || [];
          sd.data.projects = projects.filter((p) => (p as any).sourceProjectId !== projectId);
        });
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
        const state = s as {
          projects: Project[];
          lifeGoals: { tiers: Array<{ goals: Array<{ id: string; tasks: TaskNode[] }> }> } | null;
          quickTasks: { id: string; lifeGoalId?: string }[];
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
        };
        const p = state.projects.find((x) => x.id === id);
        if (p) Object.assign(p, updater(p));
        
        // SYNC: Update linked Life Goal if this project has a lifeGoalId
        if (p?.lifeGoalId) {
          for (const tier of state.lifeGoals?.tiers ?? []) {
            const goal = (tier.goals || []).find((g) => g.id === p.lifeGoalId);
            if (goal) {
              Object.assign(goal, updater(goal as any));
              break;
            }
          }
        }
        
        // SYNC: Update any shared projects that have this as their sourceProjectId
        state.sharedDashboards.forEach((sd) => {
          if (!sd.data) return;
          const projects = (sd.data.projects as Project[]) || [];
          sd.data.projects = projects.map((sp) => {
            if ((sp as any).sourceProjectId === id) {
              return { ...sp, ...updater(sp) };
            }
            return sp;
          });
        });
      }),

    toggleProjectTask: (projectId: string, taskId: string, val: boolean) =>
      set((s: unknown) => {
        const state = s as {
          projects: Project[];
          lifeGoals: { tiers: Array<{ goals: Array<{ id: string; tasks: TaskNode[] }> }> } | null;
          dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
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
          
          // SYNC: Update task in any shared projects that have this as their sourceProjectId
          state.sharedDashboards.forEach((sd) => {
            if (!sd.data) return;
            const sharedProjects = (sd.data.projects as Project[]) || [];
            sd.data.projects = sharedProjects.map((sp) => {
              if ((sp as any).sourceProjectId === projectId) {
                return {
                  ...sp,
                  tasks: updateNodeInTree(sp.tasks || [], taskId, (n: TaskNode) => ({ ...n, done: val })) as TaskNode[],
                };
              }
              return sp;
            });
          });
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
          lifeGoals: { tiers: Array<{ goals: Array<{ id: string; tasks: TaskNode[] }> }> } | null;
          top3Manual: Array<{ projectId?: string; taskId?: string; shareId?: string } | null>;
          dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
        };
        const p = state.projects.find((x) => x.id === projectId);
        if (!p) return;
        const idsToClear = collectNodeAndDescendantIds(p.tasks, taskId);
        p.tasks = removeNodeFromTree(p.tasks, taskId) as TaskNode[];
        
        // SYNC: Delete task from linked Life Goal if exists
        if (p.lifeGoalId) {
          for (const tier of state.lifeGoals?.tiers ?? []) {
            const goal = (tier.goals || []).find((g) => g.id === p.lifeGoalId);
            if (goal) {
              goal.tasks = removeNodeFromTree(goal.tasks || [], taskId) as TaskNode[];
              break;
            }
          }
        }
        
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
        
        // SYNC: Delete task from any shared projects that have this as their sourceProjectId
        state.sharedDashboards.forEach((sd) => {
          if (!sd.data) return;
          const sharedProjects = (sd.data.projects as Project[]) || [];
          sd.data.projects = sharedProjects.map((sp) => {
            if ((sp as any).sourceProjectId === projectId) {
              return {
                ...sp,
                tasks: removeNodeFromTree(sp.tasks || [], taskId) as TaskNode[],
              };
            }
            return sp;
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
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
          projects: Project[];
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd) {
          if (!sd.data) sd.data = { projects: [], quickTasks: [], chat: [] };
          const projects = (sd.data.projects as Project[]) || [];
          sd.data.projects = projects.map((p) => {
            if (p.id === projectId) {
              const updated = updater(p);
              
              // SYNC: If this shared project has a sourceProjectId, also update the personal project
              const sourceId = (p as any).sourceProjectId;
              if (sourceId) {
                const sourceProject = state.projects.find((x) => x.id === sourceId);
                if (sourceProject) {
                  Object.assign(sourceProject, updater(sourceProject as any));
                }
              }
              
              return { ...p, ...updated };
            }
            return p;
          });
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
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd?.data) {
          const projs = [...(sd.data.projects as Project[]) || []];
          const [removed] = projs.splice(fromIdx, 1);
          projs.splice(toIdx, 0, removed);
          sd.data.projects = projs;
        }
      }),

    // SYNC: Link a shared project to a personal project for bidirectional sync
    linkSharedProjectToSource: (
      shareId: string,
      sharedProjectId: string,
      sourceProjectId: string
    ) =>
      set((s: unknown) => {
        const state = s as {
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
          projects: Project[];
        };
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (sd?.data) {
          const projects = (sd.data.projects as Project[]) || [];
          sd.data.projects = projects.map((p) => {
            if (p.id === sharedProjectId) {
              // Set the sourceProjectId to enable bidirectional sync
              return { ...p, sourceProjectId } as any;
            }
            return p;
          });
        }
      }),

    // SYNC: Create a linked copy of a personal project in a shared dashboard
    syncPersonalProjectToShared: (
      personalProjectId: string,
      shareId: string
    ) =>
      set((s: unknown) => {
        const state = s as {
          projects: Project[];
          sharedDashboards: Array<{ share_id: string; data?: Record<string, unknown> }>;
        };
        
        // Find the personal project
        const personalProject = state.projects.find((p) => p.id === personalProjectId);
        if (!personalProject) return;
        
        // Find or initialize the shared dashboard
        const sd = state.sharedDashboards.find((x) => x.share_id === shareId);
        if (!sd) return;
        
        if (!sd.data) {
          sd.data = { projects: [], quickTasks: [], chat: [] };
        }
        
        // Check if this project is already synced to this shared dashboard
        const existingProjects = (sd.data.projects as Project[]) || [];
        const alreadySynced = existingProjects.some(
          (p) => (p as any).sourceProjectId === personalProjectId
        );
        
        if (alreadySynced) return; // Already synced, don't duplicate
        
        // Create a linked copy with sourceProjectId
        const linkedProject = {
          ...JSON.parse(JSON.stringify(personalProject)), // Deep clone
          id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          sourceProjectId: personalProjectId,
        } as any;
        
        sd.data.projects = [...existingProjects, linkedProject];
      }),
  };
}
