import type { LifeGoal, LifeGoalsState, Project, QuickTask } from '../../types/dashboard';
import { uid } from '../../components/dashboard/DashboardUtils';

export type LifeGoalsSet = (fn: (s: unknown) => void) => void;
export type LifeGoalsGet = () => { projects: Project[]; quickTasks: QuickTask[]; lifeGoals: LifeGoalsState; top3Manual: (unknown)[] };

export function createLifeGoalsSlice(set: LifeGoalsSet, get: LifeGoalsGet) {
  return {
    updateLifeGoals: (updater: LifeGoalsState | ((prev: LifeGoalsState) => LifeGoalsState)) =>
      set((s: unknown) => {
        const state = s as { lifeGoals: LifeGoalsState };
        state.lifeGoals = typeof updater === 'function' ? updater(state.lifeGoals) : updater;
      }),

    toggleTierCollapse: (tierId: string) =>
      set((s: unknown) => {
        const state = s as { lifeGoals: LifeGoalsState };
        const tier = (state.lifeGoals?.tiers ?? []).find((t) => t.id === tierId);
        if (tier) tier.collapsed = !tier.collapsed;
      }),

    moveGoalToTier: (goalId: string, targetTierId: string) =>
      set((s: unknown) => {
        const state = s as { lifeGoals: LifeGoalsState };
        let goal: LifeGoal | null = null;
        let sourceTier: (typeof state.lifeGoals.tiers)[0] | null = null;
        for (const t of state.lifeGoals?.tiers ?? []) {
          const idx = t.goals.findIndex((g) => g.id === goalId);
          if (idx !== -1) {
            [goal] = t.goals.splice(idx, 1);
            sourceTier = t;
            break;
          }
        }
        if (goal) {
          const targetTier = (state.lifeGoals?.tiers ?? []).find((t) => t.id === targetTierId);
          if (targetTier) targetTier.goals.push(goal);
          else if (sourceTier) sourceTier.goals.push(goal);
        }
      }),

    updateGoal: (goalId: string, updater: (g: LifeGoal) => Partial<LifeGoal>) =>
      set((s: unknown) => {
        const state = s as { 
          lifeGoals: LifeGoalsState;
          projects: Project[];
          quickTasks: QuickTask[];
        };
        for (const t of state.lifeGoals?.tiers ?? []) {
          const goal = t.goals.find((g) => g.id === goalId);
          if (goal) {
            Object.assign(goal, updater(goal));
            
            // SYNC: Update linked project if exists
            const linkedProject = state.projects.find((p) => p.lifeGoalId === goalId);
            if (linkedProject) {
              const updates = updater(linkedProject as any);
              Object.assign(linkedProject, updates);
            }
            
            // SYNC: Update linked quick task if exists
            const linkedQuickTask = state.quickTasks.find((t) => t.lifeGoalId === goalId && !t.parentId);
            if (linkedQuickTask) {
              const updates = updater(linkedQuickTask as any);
              Object.assign(linkedQuickTask, updates);
            }
            
            break;
          }
        }
      }),

    deleteGoal: (goalId: string) =>
      set((s: unknown) => {
        const state = s as { 
          lifeGoals: LifeGoalsState;
          projects: Project[];
          quickTasks: QuickTask[];
          top3Manual: (unknown)[];
        };
        for (const t of state.lifeGoals?.tiers ?? []) {
          t.goals = (t.goals || []).filter((g) => g.id !== goalId);
        }
        
        // SYNC: Remove linked project if exists
        const linkedProject = state.projects.find((p) => p.lifeGoalId === goalId);
        if (linkedProject) {
          state.top3Manual = state.top3Manual.map((slot) =>
            slot && (slot as { projectId?: string }).projectId === linkedProject.id ? null : slot
          );
          state.projects = state.projects.filter((p) => p.id !== linkedProject.id);
          state.projects.forEach((p, i) => (p.ordinal = i));
        }
        
        // SYNC: Remove linked quick tasks if exist
        const linkedQuickTasks = state.quickTasks.filter((t) => t.lifeGoalId === goalId);
        if (linkedQuickTasks.length > 0) {
          state.top3Manual = state.top3Manual.map((slot) =>
            slot && (slot as { quickTaskId?: string }).quickTaskId && 
            linkedQuickTasks.some((qt) => qt.id === (slot as { quickTaskId?: string }).quickTaskId)
              ? null
              : slot
          );
          state.quickTasks = state.quickTasks.filter((t) => t.lifeGoalId !== goalId);
          state.quickTasks.forEach((q, i) => (q.ordinal = i));
        }
      }),

    addGoalToTier: (tierId: string, title: string, category: string, type: 'quick' | 'project') =>
      set((s: unknown) => {
        const state = s as { lifeGoals: LifeGoalsState };
        const tier = (state.lifeGoals?.tiers ?? []).find((t) => t.id === tierId);
        if (tier) {
          tier.goals.push({
            id: `goal-${Date.now()}`,
            title,
            category,
            type,
            done: false,
            deadline: null,
            tasks: [],
            ordinal: tier.goals.length,
          });
        }
      }),

    promoteGoalToProjects: (goalId: string) =>
      set((s: unknown) => {
        const state = s as {
          projects: Project[];
          lifeGoals: LifeGoalsState;
          top3Manual: (unknown)[];
        };
        const linked = state.projects.find((p) => p.lifeGoalId === goalId);
        if (linked) {
          const linkedId = linked.id;
          state.top3Manual = state.top3Manual.map((slot) =>
            slot && (slot as { projectId?: string }).projectId === linkedId ? null : slot
          );
          state.projects = state.projects.filter((p) => p.id !== linkedId);
          state.projects.forEach((p, i) => (p.ordinal = i));
          return;
        }
        let goalToLink: LifeGoal | null = null;
        for (const tier of state.lifeGoals?.tiers ?? []) {
          const found = tier.goals.find((g) => g.id === goalId);
          if (found) {
            goalToLink = { ...found };
            break;
          }
        }
        if (!goalToLink) return;
        state.projects.unshift({
          id: uid('project'),
          lifeGoalId: goalId,
          title: goalToLink.title,
          active: true,
          tasks: goalToLink.tasks || [],
          deadline: goalToLink.deadline || undefined,
          ordinal: 0,
        });
        state.projects.forEach((p, i) => (p.ordinal = i));
      }),

    promoteGoalToQuickTasks: (goalId: string) =>
      set((s: unknown) => {
        const state = s as {
          quickTasks: QuickTask[];
          lifeGoals: LifeGoalsState;
          top3Manual: (unknown)[];
        };
        const linkedRoots = state.quickTasks.filter((t) => t.lifeGoalId === goalId && !(t as { parentId?: string }).parentId);
        if (linkedRoots.length > 0) {
          state.quickTasks.forEach((t) => {
            if (t.lifeGoalId === goalId) t.lifeGoalId = undefined;
          });
          state.top3Manual = state.top3Manual.map((slot) =>
            slot && (slot as { quickTaskId?: string }).quickTaskId && linkedRoots.some((r) => r.id === (slot as { quickTaskId?: string }).quickTaskId)
              ? null
              : slot
          );
          return;
        }
        let goalToLink: LifeGoal | null = null;
        for (const tier of state.lifeGoals?.tiers ?? []) {
          const found = (tier.goals || []).find((g) => g.id === goalId);
          if (found) {
            goalToLink = { ...found };
            break;
          }
        }
        if (!goalToLink) return;
        state.quickTasks.unshift({
          id: uid('task'),
          lifeGoalId: goalId,
          title: goalToLink.title,
          done: goalToLink.done,
          deadline: goalToLink.deadline || undefined,
          ordinal: 0,
        });
        state.quickTasks.forEach((q, i) => (q.ordinal = i));
      }),
  };
}
