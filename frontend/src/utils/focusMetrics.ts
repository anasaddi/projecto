const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export interface FocusDayMetric {
  key: string;
  date: Date;
  score: number;
  habitsDone: number;
  habitsTotal: number;
  prayersDone: number;
  prayersTotal: number;
  tasksDone: number;
  tasksTotal: number;
}

export interface FocusMetrics {
  focusStreak: number;
  todayFocusScore: number;
  doneFocusItems: number;
  totalFocusItems: number;
  heatmapDays: FocusDayMetric[];
}

function isPrayerCompleted(entry: unknown): boolean {
  if (typeof entry === 'object' && entry !== null) {
    return !!(entry as { completedAt?: string }).completedAt;
  }
  return !!entry;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function computeFocusMetrics(input: {
  dailyTaskTemplates: Array<{ id: string; locked?: boolean }>;
  dailyTaskLogs: Record<string, Array<{ id: string; done: boolean }>>;
  prayerLogs: Record<string, Record<string, unknown>>;
  dailyCompletionLog: Record<string, { quick?: string[]; project?: string[] }>;
  days?: number;
}): FocusMetrics {
  const activeHabits = input.dailyTaskTemplates.filter((t) => !t.locked);
  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const today = startOfDay(new Date());
  const days = input.days ?? 30;

  const heatmapDays: FocusDayMetric[] = [];
  let focusStreak = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = toDateKey(d);
    const taskLog = input.dailyTaskLogs[key] || [];
    const taskLogMap: Record<string, boolean> = {};
    taskLog.forEach((l) => {
      taskLogMap[l.id] = l.done;
    });
    const prayerLog = input.prayerLogs[key] || {};
    const cl = input.dailyCompletionLog[key] || { quick: [], project: [] };
    const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
    const prayersDone = PRAYERS.reduce((acc, p) => acc + (isPrayerCompleted(prayerLog[p]) ? 1 : 0), 0);
    const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
    const score = totalFocusItems ? (habitsDone + prayersDone + tasksDone) / totalFocusItems : 0;

    heatmapDays.push({
      key,
      date: d,
      score,
      habitsDone,
      habitsTotal: activeHabits.length,
      prayersDone,
      prayersTotal: PRAYERS.length,
      tasksDone,
      tasksTotal: 3,
    });
  }

  for (let i = heatmapDays.length - 1; i >= 0; i--) {
    if (heatmapDays[i].score >= 0.8) focusStreak++;
    else break;
  }

  const todayKey = toDateKey(today);
  const todayMetric = heatmapDays.find((d) => d.key === todayKey);
  const doneFocusItems = todayMetric
    ? todayMetric.habitsDone + todayMetric.prayersDone + todayMetric.tasksDone
    : 0;

  return {
    focusStreak,
    todayFocusScore: totalFocusItems ? doneFocusItems / totalFocusItems : 0,
    doneFocusItems,
    totalFocusItems,
    heatmapDays,
  };
}
