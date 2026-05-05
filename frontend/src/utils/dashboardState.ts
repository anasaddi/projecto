export type DashboardLifeGoalsLike = {
  tiers?: Array<{ goals?: unknown[] }>;
};

export type DashboardPayloadLike = Record<string, unknown> & {
  dailyTaskTemplates?: unknown[];
  projects?: unknown[];
  quickTasks?: unknown[];
  dailyTaskLogs?: Record<string, unknown> | unknown;
  prayerLogs?: Record<string, unknown> | unknown;
  dailyCompletionLog?: Record<string, unknown> | unknown;
  timelineRoutines?: Record<string, unknown> | unknown;
  selectedDate?: unknown;
  top3Manual?: unknown;
  lifeGoals?: DashboardLifeGoalsLike | unknown;
  data?: unknown;
};

export function extractDashboardPayload(value: unknown): DashboardPayloadLike | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as DashboardPayloadLike;
  const hasDashboardShape =
    Array.isArray(candidate.dailyTaskTemplates) ||
    Array.isArray(candidate.projects) ||
    Array.isArray(candidate.quickTasks) ||
    candidate.selectedDate != null ||
    candidate.lifeGoals != null ||
    candidate.top3Manual != null ||
    candidate.dailyCompletionLog != null ||
    candidate.prayerLogs != null ||
    candidate.dailyTaskLogs != null ||
    candidate.timelineRoutines != null;
  if (hasDashboardShape) return candidate;
  return extractDashboardPayload(candidate.data);
}

const hasAnyKeys = (v: unknown): boolean =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0;

export function hasMeaningfulDashboardData(value: unknown): boolean {
  const payload = extractDashboardPayload(value);
  if (!payload) return false;
  const lifeGoals = payload.lifeGoals as DashboardLifeGoalsLike | undefined;
  return Boolean(
    (Array.isArray(payload.dailyTaskTemplates) && payload.dailyTaskTemplates.length > 0) ||
    (Array.isArray(payload.projects) && payload.projects.length > 0) ||
    (Array.isArray(payload.quickTasks) && payload.quickTasks.length > 0) ||
    payload.selectedDate != null ||
    hasAnyKeys(payload.prayerLogs) ||
    hasAnyKeys(payload.dailyTaskLogs) ||
    hasAnyKeys(payload.dailyCompletionLog) ||
    hasAnyKeys(payload.timelineRoutines) ||
    (Array.isArray(lifeGoals?.tiers) && lifeGoals.tiers.some((tier) => (tier?.goals?.length ?? 0) > 0))
  );
}
