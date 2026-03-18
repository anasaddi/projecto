/**
 * UI-only state setters (not persisted to backend in same shape).
 */
export type UISet = (fn: (s: unknown) => void) => void;

export function createUISlice(set: UISet) {
  return {
    setIsLoaded: (val: boolean) => set((s: unknown) => void ((s as { isLoaded: boolean }).isLoaded = val)),
    setLastSavedAt: (val: number | null) => set((s: unknown) => void ((s as { lastSavedAt: number | null }).lastSavedAt = val)),
    setConfirmState: (val: unknown) => set((s: unknown) => void ((s as { confirmState: unknown }).confirmState = val)),
    setTimelinePanelExpanded: (val: boolean) =>
      set((s: unknown) => void ((s as { timelinePanelExpanded: boolean }).timelinePanelExpanded = val)),

    setQuickTaskDraft: (val: string) => set((s: unknown) => void ((s as { quickTaskDraft: string }).quickTaskDraft = val)),
    setQuickTaskEditingId: (val: string | null) =>
      set((s: unknown) => void ((s as { quickTaskEditingId: string | null }).quickTaskEditingId = val)),
    setQuickTaskEditingTitle: (val: string) =>
      set((s: unknown) => void ((s as { quickTaskEditingTitle: string }).quickTaskEditingTitle = val)),

    setHabitDraft: (val: string) => set((s: unknown) => void ((s as { habitDraft: string }).habitDraft = val)),
    setHabitEditingId: (val: string | null) =>
      set((s: unknown) => void ((s as { habitEditingId: string | null }).habitEditingId = val)),
    setHabitEditingTitle: (val: string) =>
      set((s: unknown) => void ((s as { habitEditingTitle: string }).habitEditingTitle = val)),

    setProjectTaskDrafts: (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
      set((s: unknown) => {
        const state = s as { projectTaskDrafts: Record<string, string> };
        state.projectTaskDrafts = typeof val === 'function' ? val(state.projectTaskDrafts) : val;
      }),
    setProjectDeadlineEditing: (val: string | null) =>
      set((s: unknown) => void ((s as { projectDeadlineEditing: string | null }).projectDeadlineEditing = val)),
    setProjectDeadlineInput: (val: string) =>
      set((s: unknown) => void ((s as { projectDeadlineInput: string }).projectDeadlineInput = val)),

    setQuickTaskDeadlineEditing: (val: string | null) =>
      set((s: unknown) => void ((s as { quickTaskDeadlineEditing: string | null }).quickTaskDeadlineEditing = val)),
    setQuickTaskDeadlineInput: (val: string) =>
      set((s: unknown) => void ((s as { quickTaskDeadlineInput: string }).quickTaskDeadlineInput = val)),

    setGoalTaskDrafts: (val: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) =>
      set((s: unknown) => {
        const state = s as { goalTaskDrafts: Record<string, string> };
        state.goalTaskDrafts = typeof val === 'function' ? val(state.goalTaskDrafts) : val;
      }),
    setGoalDeadlineEditing: (val: string | null) =>
      set((s: unknown) => void ((s as { goalDeadlineEditing: string | null }).goalDeadlineEditing = val)),
    setGoalDeadlineInput: (val: string) =>
      set((s: unknown) => void ((s as { goalDeadlineInput: string }).goalDeadlineInput = val)),

    setSharedDashboards: (val: unknown[] | ((prev: unknown[]) => unknown[])) =>
      set((s: unknown) => {
        const state = s as { sharedDashboards: unknown[] };
        state.sharedDashboards = typeof val === 'function' ? val(state.sharedDashboards) : val;
      }),
  };
}
