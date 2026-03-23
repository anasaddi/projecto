/**
 * Dashboard domain types — aligned with backend app/schemas/dashboard.py (Pydantic).
 * Use for store state, API payloads, and component props to avoid data bugs.
 */

// --- Task node (projects & life-goal tasks) ---
export type TaskWorkingBy = 'anas' | 'othmane';

export interface TaskNode {
  id: string;
  title: string;
  done: boolean;
  children?: TaskNode[];
  deadline?: string;
  /** Chi sta lavorando su questo task (sync con socio). */
  workingBy?: TaskWorkingBy | null;
}

// --- Habits ---
export interface DailyTaskTemplate {
  id: string;
  title: string;
  locked?: boolean;
  ordinal?: number;
  inTimeline?: boolean;
}

export interface DailyTaskLogEntry {
  id: string;
  done: boolean;
}

// --- Projects ---
export interface Project {
  id: string;
  title: string;
  active?: boolean;
  tasks: TaskNode[];
  deadline?: string;
  ordinal?: number;
  lifeGoalId?: string;
}

// --- Quick tasks ---
export interface QuickTask {
  id: string;
  title: string;
  done: boolean;
  deadline?: string;
  parentId?: string;
  lifeGoalId?: string;
  ordinal?: number;
}

// --- Top 3 ---
export interface Top3Slot {
  projectId?: string | null;
  taskId?: string | null;
  quickTaskId?: string | null;
  shareId?: string | null;
  title?: string | null;
  done?: boolean | null;
}

// --- Life goals ---
export type LifeGoalType = 'quick' | 'project';

export interface LifeGoal {
  id: string;
  title: string;
  category: string;
  type: LifeGoalType;
  done: boolean;
  deadline?: string | null;
  tasks: TaskNode[];
  ordinal?: number;
}

export interface LifeGoalTier {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  collapsed?: boolean;
  goals: LifeGoal[];
}

export interface LifeGoalsState {
  collapsed?: boolean;
  tiers: LifeGoalTier[];
}

// --- Timeline / completion log ---
export type TimelineEventType = 'habit' | 'quick' | 'project' | 'shared_quick';

export interface TimelineEvent {
  id: string;
  title: string;
  type: TimelineEventType;
  timestamp: number;
  slotKey?: string;
  projectName?: string | null;
}

export interface DayCompletionPayload {
  quick?: string[];
  project?: string[];
  events?: TimelineEvent[];
}

export interface TimelineRoutineItem {
  id: string;
  habitId: string;
  done: boolean;
}

// --- Full dashboard state (sync with backend DashboardStatePayload) ---
export interface DashboardState {
  dailyTaskTemplates: DailyTaskTemplate[];
  dailyTaskLogs: Record<string, DailyTaskLogEntry[]>;
  projects: Project[];
  prayerLogs: Record<string, Record<string, boolean>>;
  top3Manual: (Top3Slot | null)[];
  quickTasks: QuickTask[];
  dailyCompletionLog: Record<string, DayCompletionPayload>;
  lifeGoals: LifeGoalsState;
  timelineRoutines: Record<string, Record<string, TimelineRoutineItem[]>>;
  timelinePanelExpanded?: boolean;
}

// --- UI state (not persisted to backend in same shape) ---
export interface DashboardUIState {
  isLoaded: boolean;
  lastSavedAt: number | null;
  confirmState: { message: string; onConfirm: () => void } | null;
  quickTaskDraft: string;
  quickTaskEditingId: string | null;
  quickTaskEditingTitle: string;
  habitDraft: string;
  habitEditingId: string | null;
  habitEditingTitle: string;
  projectTaskDrafts: Record<string, string>;
  projectDeadlineEditing: string | null;
  projectDeadlineInput: string;
  quickTaskDeadlineEditing: string | null;
  quickTaskDeadlineInput: string;
  goalTaskDrafts: Record<string, string>;
  goalDeadlineEditing: string | null;
  goalDeadlineInput: string;
  sharedDashboards: SharedDashboardEntry[];
}

export interface SharedDashboardEntry {
  share_id: string;
  title?: string;
  data?: {
    projects?: Project[];
    quickTasks?: QuickTask[];
    chat?: unknown[];
  };
}

// --- Store slice type (for Zustand slices) ---
export type SetState<T> = (fn: (state: T) => void) => void;
export type GetState<T> = () => T;
