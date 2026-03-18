import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { getLocalState } from '../db/localDb';
import { getSharedDashboardWsUrl } from '../config';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import { useDashboardStore } from '../store/dashboardStore';

// Modular Components
import { Icons } from '../components/dashboard/Icons';
import { PomodoroCompact } from '../components/dashboard/PomodoroCompact';
import { FocusHeatmap } from '../components/dashboard/FocusHeatmap';
import { PrayersCountdowns } from '../components/dashboard/PrayersCountdowns';
import { DailyTimelineWidget2 } from '../components/dashboard/DailyTimelineWidget2';
import { QuickTasksSection } from '../components/dashboard/QuickTasksSection';
import { Top3Section } from '../components/dashboard/Top3Section';
import { HabitsSection } from '../components/dashboard/HabitsSection';
import { ProjectsSection } from '../components/dashboard/ProjectsSection';
import { LifeGoalsSection } from '../components/dashboard/LifeGoalsSection';
import { ConfirmModal } from '../components/ConfirmModal';
import { HabitSkeleton, ProjectSkeleton, Top3Skeleton, QuickTaskSkeleton } from '../components/dashboard/SkeletonSection';

// Utils
import {
  STORAGE_KEY,
  toDateKey,
  startOfDay,
  addDays,
  startOfWeek,
  startOfMonth,
  formatCountdown,
  resolveTop3Slots,
  normalizeLifeGoals,
  buildDefaultLifeGoals,
  POMODORO_STORAGE
} from '../components/dashboard/DashboardUtils';

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];

export default function DashboardV2() {
  const store = useDashboardStore();
  const {
    dailyTaskTemplates = [],
    dailyTaskLogs = {},
    projects = [],
    prayerLogs = {},
    top3Manual = [null, null, null],
    quickTasks = [],
    dailyCompletionLog = {},
    lifeGoals = { tiers: [] },
    sharedDashboards = [],
    isLoaded,
    lastSavedAt,
    confirmState,
    setIsLoaded,
    setLastSavedAt,
    setConfirmState,
    setSharedDashboards,
    syncWithServer,
    updateGoal,
    updateSharedDashboardData,
    deleteProject,
    deleteGoal,
    deleteSharedDashboardProject,
    togglePrayer,
  } = store ?? {};

  const { updateStats } = useDashboardStats() || { updateStats: () => { } };
  const { config } = useGlobalConfig();
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);

  const [now, setNow] = useState(new Date());
  const wsConnections = useRef({});
  const bcChannels = useRef({});
  const applyingFromSharedBC = useRef(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Stats to Context
  const todayKey = toDateKey(now);
  const todayTaskLog = useMemo(() => {
    const logs = dailyTaskLogs[todayKey] || [];
    const map = {};
    logs.forEach(l => map[l.id] = l.done);
    return map;
  }, [dailyTaskLogs, todayKey]);
  const todayPrayerLog = prayerLogs[todayKey] || {};

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = useMemo(() => activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0), [activeHabits, todayTaskLog]);
  const prayerDone = useMemo(() => PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0), [PRAYERS, todayPrayerLog]);
  
  const allQuickTasks = useMemo(() => {
    const local = quickTasks.filter(t => !t.parentId).map(t => ({ ...t, shareId: null }));
    const fromShared = sharedDashboards.flatMap(sd => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data || {}).quickTasks : [];
      return list.filter(t => !t.parentId).map(t => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards), [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]);
  const top3DoneCount = useMemo(() => top3Resolved.filter((s) => s && !s.missing && s.done).length, [top3Resolved]);

  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;
  const todayFocusScore = totalFocusItems ? doneFocusItems / totalFocusItems : 0;

  useEffect(() => {
    if (updateStats) updateStats(doneFocusItems, totalFocusItems);
  }, [doneFocusItems, totalFocusItems, updateStats]);

  // Hide "Salvato"
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setTimeout(() => setLastSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [lastSavedAt, setLastSavedAt]);

  // Show UI from local state immediately; hydrate from IndexedDB if localStorage empty, then fetch API only when no local data
  const hasLocalData = Boolean(
    (dailyTaskTemplates?.length ?? 0) > 0 ||
    (quickTasks?.length ?? 0) > 0 ||
    (projects?.length ?? 0) > 0 ||
    (lifeGoals?.tiers ?? []).some((t) => (t?.goals?.length ?? 0) > 0)
  );

  useEffect(() => {
    setIsLoaded(true);
    async function hydrateAndFetch() {
      // Se localStorage era vuoto, prova a ripristinare da IndexedDB
      if (!hasLocalData && syncWithServer) {
        try {
          const idbState = await getLocalState();
          if (idbState && typeof idbState === 'object' && (idbState.dailyTaskTemplates?.length || idbState.quickTasks?.length || idbState.projects?.length)) {
            syncWithServer(idbState);
            // Carica comunque shared dashboards
            const shared = await api.training.listSharedDashboards({ timeout: 10_000 }).catch(() => null);
            if (Array.isArray(shared) && setSharedDashboards) setSharedDashboards(shared);
            return;
          }
        } catch (_) {}
      }
      try {
        const res = await api.training.getDashboardState({ timeout: 15_000 });
        if (res?.data && syncWithServer && !hasLocalData) syncWithServer(res.data);
        const shared = await api.training.listSharedDashboards({ timeout: 10_000 }).catch(() => null);
        if (Array.isArray(shared) && setSharedDashboards) setSharedDashboards(shared);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn("Dashboard load from server failed (using local state):", err?.message || err);
        }
      }
    }
    hydrateAndFetch();
  }, [syncWithServer, setSharedDashboards, setIsLoaded, hasLocalData]);

  // WebSocket management
  useEffect(() => {
    if (!isLoaded || sharedDashboards.length === 0) return;
    const shareIds = sharedDashboards.map(sd => sd.share_id);

    shareIds.forEach(shareId => {
      if (!bcChannels.current[shareId]) {
        const bc = new BroadcastChannel(`km-shared-${shareId}`);
        bc.onmessage = (e) => {
          const msg = e?.data;
          if (!msg || applyingFromSharedBC.current) return;
          applyingFromSharedBC.current = true;
          if (msg.type === 'chat' && msg.data) {
            updateSharedDashboardData(shareId, prev => {
              const chat = Array.isArray(prev.chat) ? prev.chat : [];
              if (chat.some(m => m.id === msg.data.id)) return prev;
              return { ...prev, chat: [...chat.slice(-99), msg.data] };
            });
          } else if (msg.type === 'sync' && msg.data) {
            updateSharedDashboardData(shareId, () => msg.data);
          }
          setTimeout(() => { applyingFromSharedBC.current = false; }, 0);
        };
        bcChannels.current[shareId] = bc;
      }

      if (wsConnections.current[shareId]) return;
      const wsUrl = getSharedDashboardWsUrl(shareId);
      const socket = new WebSocket(wsUrl);
      wsConnections.current[shareId] = socket;

      const hb = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
      }, 25000);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'pong' || message.type === 'server_restart' || message.type === 'error') return;
          if (message.type === 'chat' && message.data) {
            updateSharedDashboardData(shareId, prev => {
              const chat = Array.isArray(prev.chat) ? prev.chat : [];
              if (chat.some(m => m.id === message.data.id)) return prev;
              return { ...prev, chat: [...chat.slice(-99), message.data] };
            });
          } else if (message.type === 'sync') {
            updateSharedDashboardData(shareId, () => message.data || message);
          }
        } catch (err) { console.error(`WS message error for ${shareId}:`, err); }
      };

      socket.onclose = () => {
        console.log(`WS Disconnected for ${shareId}`);
        clearInterval(hb);
        delete wsConnections.current[shareId];
      };
    });

    return () => {
      Object.keys(wsConnections.current).forEach(id => {
        if (!shareIds.includes(id)) {
          wsConnections.current[id].close();
          delete wsConnections.current[id];
        }
      });
      Object.keys(bcChannels.current).forEach(id => {
        if (!shareIds.includes(id)) {
          bcChannels.current[id].close();
          delete bcChannels.current[id];
        }
      });
    };
  }, [isLoaded, sharedDashboards, updateSharedDashboardData]);

  // Countdowns
  const countdowns = useMemo(() => {
    const n = new Date(now);
    const eod = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    const eow = addDays(startOfWeek(n), 7);
    const eom = new Date(n.getFullYear(), n.getMonth() + 1, 1);
    return [
      { label: 'Day', remaining: formatCountdown(eod - n), pct: (n - startOfDay(n)) / (eod - startOfDay(n)) },
      { label: 'Week', remaining: formatCountdown(eow - n), pct: (n - startOfWeek(n)) / (eow - startOfWeek(n)) },
      { label: 'Month', remaining: formatCountdown(eom - n), pct: (n - startOfMonth(n)) / (eom - startOfMonth(n)) },
    ];
  }, [now]);

  // Focus Streak
  const focusStreak = useMemo(() => {
    const totalItems = activeHabits.length + PRAYERS.length + 3;
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || [];
      const taskLogMap = {}; taskLog.forEach(l => taskLogMap[l.id] = l.done);
      const prayerLog = prayerLogs[key] || {};
      const cl = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      if (score >= 0.8) s++; else break;
    }
    return s;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, PRAYERS]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans font-medium select-none selection:bg-indigo-500/30 antialiased">
      <header className="shrink-0 border-b border-zinc-200/50 dark:border-white/[0.06] bg-white/70 dark:bg-[#0b0e14]/70 backdrop-blur-xl shadow-sm dark:shadow-black/50 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="w-0 sm:w-4 shrink-0" />
          <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
            {focusStreak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 sm:px-3 py-1 sm:py-1.5 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/30">
                <Icons.Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold tabular-nums">{focusStreak}d</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-zinc-100/80 dark:bg-white/[0.06] px-2 sm:px-3 py-1 sm:py-1.5 ring-1 ring-zinc-200/60 dark:ring-white/[0.08]">
              <div className="relative h-1.5 sm:h-2 w-12 sm:w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700/80">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${Math.round(todayFocusScore * 100)}%` }} />
              </div>
              <span className="min-w-[1.75rem] sm:min-w-[2.25rem] text-[10px] sm:text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                {Math.round(todayFocusScore * 100)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastSavedAt && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400" title="Modifiche salvate">
                <Icons.Check className="h-3.5 w-3.5 shrink-0" />
                Salvato
              </span>
            )}
            <time className="hidden sm:block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
              {now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </time>
            <button type="button" onClick={() => setConfirmState({ id: 'reset' })} className="touch-target rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors focus-ring" title="Reset dashboard">
              <Icons.X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <PrayersCountdowns todayPrayerLog={todayPrayerLog} togglePrayer={togglePrayer} PRAYERS={PRAYERS} countdowns={countdowns} />

      <DailyTimelineWidget2
        PRAYERS={PRAYERS}
        todayKey={todayKey}
        todayPrayerLog={todayPrayerLog}
        togglePrayer={togglePrayer}
      />

      <div className="flex-1 min-h-0 px-6 pt-3 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">
          <PomodoroCompact />
          {isLoaded ? <QuickTasksSection /> : <QuickTaskSkeleton />}
          <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
        </div>
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">
          {isLoaded ? <Top3Section /> : <Top3Skeleton />}
          {isLoaded ? <HabitsSection /> : <HabitSkeleton />}
        </div>
        {isLoaded ? <ProjectsSection PROJECT_ACCENTS={PROJECT_ACCENTS} /> : <ProjectSkeleton />}
      </div>

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.id === 'deleteShared' ? 'Elimina progetto condiviso' : confirmState?.id === 'deleteGoal' ? 'Elimina obiettivo' : confirmState?.id === 'deleteProject' ? 'Elimina progetto' : 'Reset dashboard'}
        message={confirmState?.id === 'deleteShared' ? 'Sei sicuro di voler eliminare questo progetto condiviso?' : confirmState?.id === 'deleteGoal' ? 'Sei sicuro di voler eliminare questo obiettivo?' : confirmState?.id === 'deleteProject' ? 'Il progetto e tutti i suoi task verranno eliminati. Questa azione non si può annullare.' : 'Azzerare tutto? Verranno eliminati progetti, task, abitudini e dati della dashboard. Ricarica la pagina.'}
        variant={confirmState?.id === 'reset' || confirmState?.id === 'deleteProject' || confirmState?.id === 'deleteGoal' || confirmState?.id === 'deleteShared' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmState?.id === 'deleteShared' && confirmState?.payload) {
            deleteSharedDashboardProject(confirmState.payload.shareId, confirmState.payload.projectId);
          } else if (confirmState?.id === 'deleteGoal' && confirmState?.payload) {
            deleteGoal(confirmState.payload.goalId);
          } else if (confirmState?.id === 'deleteProject' && confirmState?.payload) {
            deleteProject(confirmState.payload.projectId);
          } else if (confirmState?.id === 'reset') {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(POMODORO_STORAGE);
            window.location.reload();
          }
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      <LifeGoalsSection />
    </div>
  );
}
