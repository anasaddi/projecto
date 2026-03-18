import type { LifeGoal, LifeGoalsState, Project } from '../../types/dashboard';
import { uid } from '../../components/dashboard/DashboardUtils';

export type LifeGoalsSet = (fn: (s: unknown) => void) => void;
export type LifeGoalsGet = () => { projects: Project[]; quickTasks: { id: string; lifeGoalId?: string; parentId?: string; ordinal?: number }[]; lifeGoals: LifeGoalsState; top3Manual: (unknown)[] };

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
        const state = s as { lifeGoals: LifeGoalsState };
        for (const t of state.lifeGoals?.tiers ?? []) {
          const goal = t.goals.find((g) => g.id === goalId);
          if (goal) {
            Object.assign(goal, updater(goal));
            break;
          }
        }
      }),

    deleteGoal: (goalId: string) =>
      set((s: unknown) => {
        const state = s as { lifeGoals: LifeGoalsState };
        for (const t of state.lifeGoals?.tiers ?? []) {
          t.goals = (t.goals || []).filter((g) => g.id !== goalId);
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
          quickTasks: { id: string; lifeGoalId?: string; ordinal?: number }[];
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
