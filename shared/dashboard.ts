/** Shared dashboard API contracts (frontend + future Cloudflare Workers). */

export type DashboardEventType =
  | 'toggle_habit'
  | 'toggle_prayer'
  | 'toggle_quick_task'
  | 'set_completion_log';

export interface DashboardEvent {
  type: DashboardEventType;
  date?: string;
  habitId?: string;
  done?: boolean;
  prayerName?: string;
  completed?: boolean;
  completedAt?: string | null;
  quickTaskId?: string;
  completion?: { quick?: string[]; project?: string[]; score?: number };
}

export interface DashboardPatchRequest {
  events: DashboardEvent[];
}

export interface DashboardSnapshotOut {
  key: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface BootstrapOut {
  dashboard: DashboardSnapshotOut | null;
  shared_dashboards: unknown[];
  config: Record<string, unknown>;
}
