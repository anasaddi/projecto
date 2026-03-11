import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { api } from '../api/client';

/**
 * ----------------------------------------------------------------------
 * ICONS (Lucide-inspired) - Scaled down for density
 * ----------------------------------------------------------------------
 */
const Icons = {
  CheckCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Circle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/></svg>,
  Plus: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Clock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Target: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Flame: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Lock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Play: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Square: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  ChevronDown: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>,
  Calendar: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  ExternalLink: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 22 3 22 9"/><line x1="10" y1="14" x2="22" y2="3"/></svg>,
  MessageCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
};

/**
 * ----------------------------------------------------------------------
 * CONSTANTS & UTILS
 * ----------------------------------------------------------------------
 */
const STORAGE_KEY = 'km-dashboard-v2';
const MAX_TASK_DEPTH = 2;
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  return addDays(d, -mondayOffset);
}
function startOfMonth(date = new Date()) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function startOfYear(date = new Date()) { return new Date(date.getFullYear(), 0, 1); }

function formatCountdown(ms) {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

function buildDefaultState() {
  const DEFAULT_HABITS = [
    { id: uid('daily'), title: '💎 Retention', locked: false },
    { id: uid('daily'), title: '⚔️ Allenamento', locked: false },
    { id: uid('daily'), title: '💤 Sonno 7.5h+', locked: false },
    { id: uid('daily'), title: '🚭 No Fumo', locked: true },
    { id: uid('daily'), title: '📚 Lettura', locked: true },
    { id: uid('daily'), title: '✍️ Journaling', locked: true },
    { id: uid('daily'), title: '💅 Cura Mani', locked: true },
    { id: uid('daily'), title: '💧 Idratazione 3L', locked: true },
    { id: uid('daily'), title: '🍎 No Junk Food', locked: true },
    { id: uid('daily'), title: '🧊 Doccia Fredda', locked: true },
    { id: uid('daily'), title: '🧠 Deep Work 2h', locked: true },
    { id: uid('daily'), title: '🧴 Skincare', locked: true },
    { id: uid('daily'), title: '🦵 Mobilità/Stretch', locked: true },
    { id: uid('daily'), title: '🤝 Grip Training', locked: true },
    { id: uid('daily'), title: '📵 Social < 1h', locked: true },
  ];
  const mk = (title, done = false) => ({ id: uid('task'), title, done, children: [], deadline: undefined });
  const mkChild = (parent, ...children) => ({ ...parent, children });
  const projects = [
    {
      id: uid('project'),
      title: 'Health & Fitness',
      active: true,
      tasks: [
        mk('Settimana workout completa', false),
        mkChild(mk('Piano alimentare', false), mk('Definisci macro', false), mk('Prep meal domenica', false)),
        mk('10k passi al giorno', false),
      ],
    },
    {
      id: uid('project'),
      title: 'Learning & Growth',
      active: true,
      tasks: [
        mkChild(mk('Corso online', false), mk('Completa modulo 1', false), mk('Esercizi pratici', false)),
        mk('Leggi 30 min al giorno', false),
        mk('Annota 3 insight settimanali', false),
      ],
    },
    {
      id: uid('project'),
      title: 'Work & Productivity',
      active: true,
      tasks: [
        mkChild(mk('Quarter goals', false), mk('Breakdown in milestone', false), mk('Weekly review', false)),
        mk('Inbox zero ogni sera', false),
        mk('Deep work 2h senza interruzioni', false),
      ],
    },
  ];
  return {
    dailyTaskTemplates: DEFAULT_HABITS,
    dailyTaskLogs: {},
    projects,
    prayerLogs: {},
    top3Manual: [null, null, null],
    quickTasks: [],
    dailyCompletionLog: {},
  };
}

function loadState() {
  const fallback = buildDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('km-dashboard-v1');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const top3 = parsed.top3Manual;
    const top3Normalized = Array.isArray(top3) ? [top3[0] ?? null, top3[1] ?? null, top3[2] ?? null] : fallback.top3Manual;
    return {
      dailyTaskTemplates: Array.isArray(parsed.dailyTaskTemplates) ? parsed.dailyTaskTemplates : fallback.dailyTaskTemplates,
      dailyTaskLogs: parsed.dailyTaskLogs && typeof parsed.dailyTaskLogs === 'object' ? parsed.dailyTaskLogs : fallback.dailyTaskLogs,
      projects: Array.isArray(parsed.projects) ? parsed.projects : fallback.projects,
      prayerLogs: parsed.prayerLogs && typeof parsed.prayerLogs === 'object' ? parsed.prayerLogs : fallback.prayerLogs,
      top3Manual: top3Normalized,
      quickTasks: Array.isArray(parsed.quickTasks) ? parsed.quickTasks : fallback.quickTasks,
      dailyCompletionLog: parsed.dailyCompletionLog && typeof parsed.dailyCompletionLog === 'object' ? parsed.dailyCompletionLog : fallback.dailyCompletionLog,
    };
  } catch (_) {
    return fallback;
  }
}

function findTaskInProjects(projects, projectId, taskId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  let found = null;
  function walk(nodes) {
    for (const n of nodes || []) {
      if (n.id === taskId) { found = { node: n, projectTitle: project.title }; return; }
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  }
  walk(project.tasks);
  return found;
}

function resolveTop3Slots(projects, top3Manual, quickTasks = []) {
  return top3Manual.map((slot) => {
    if (!slot) return null;
    if (slot.quickTaskId) {
      const qt = quickTasks.find((t) => t.id === slot.quickTaskId);
      if (!qt) return { ...slot, missing: true };
      return { ...slot, title: qt.title, projectTitle: 'Quick Task', done: qt.done, isQuick: true };
    }
    const res = findTaskInProjects(projects, slot.projectId, slot.taskId);
    if (!res) return { ...slot, missing: true };
    return { ...slot, title: res.node.title, projectTitle: res.projectTitle, done: res.node.done };
  });
}

function countTreeStats(nodes) {
  let total = 0, completed = 0;
  const walk = (arr) => {
    arr.forEach((n) => {
      total++;
      if (n.done) completed++;
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    });
  };
  walk(nodes || []);
  return { total, completed, ratio: total ? completed / total : 0 };
}

function createTaskNode(title) {
  return { id: uid('task'), title: title.trim(), done: false, children: [], deadline: undefined };
}
function fromDateKey(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}
function formatDeadline(v) {
  const d = fromDateKey(v);
  return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
}
/** Colore in base a quanto è lontana la scadenza */
function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-gray-400 bg-gray-50 dark:bg-gray-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';       // scaduta
  if (daysUntil <= 2) return 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30';   // urgentissima
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'; // presto
  if (daysUntil <= 14) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'; // in avvicinamento
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';        // lontana
}

function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    return { ...node, children: updateNodeInTree(Array.isArray(node.children) ? node.children : [], nodeId, updater) };
  });
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeNodeFromTree(Array.isArray(node.children) ? node.children : [], nodeId) }));
}
function collectNodeAndDescendantIds(nodes, targetId) {
  const ids = new Set();
  function walk(arr) {
    for (const n of arr || []) {
      if (n.id === targetId) { const w = (node) => { ids.add(node.id); (node.children || []).forEach(w); }; w(n); return true; }
      if (walk(n.children)) return true;
    }
    return false;
  }
  walk(nodes);
  return ids;
}

/**
 * ----------------------------------------------------------------------
 * COMPONENTS
 * ----------------------------------------------------------------------
 */

// 1. Pomodoro Timer (Ultra Compact)
const POMODORO_DURATION = 25 * 60;
const POMODORO_STORAGE = 'km-pomodoro-v2';
function PomodoroCompact() {
  const [remaining, setRemaining] = useState(POMODORO_DURATION);
  const [status, setStatus] = useState('idle'); 
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef(null);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE);
      if (stored) {
        const { date, sessions } = JSON.parse(stored);
        if (date === todayKey) setSessionsToday(sessions || 0);
      }
    } catch (_) {}
  }, [todayKey]);

  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setStatus('idle');
          setSessionsToday((s) => {
            const next = s + 1;
            try { localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ date: todayKey, sessions: next })); } catch (_) {}
            if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') new window.Notification('Pomodoro completato!');
            return next;
          });
          return POMODORO_DURATION;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status, todayKey]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const progress = 1 - remaining / POMODORO_DURATION;

  return (
    <div className="bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden select-none shadow-sm">
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">
          <Icons.Clock className="w-3.5 h-3.5 text-indigo-500" /> Focus
        </div>
        <div className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
          {sessionsToday} sess
        </div>
      </div>
      
      <div className="flex items-center justify-between z-10">
        <div className="text-2xl font-black tracking-tighter tabular-nums text-gray-900 dark:text-white">
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
        <div className="flex gap-1">
           {status === 'idle' && (
            <button onClick={() => { setStatus('running'); setRemaining(POMODORO_DURATION); }} className="bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all">
              <Icons.Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
          {status === 'running' && (
            <button onClick={() => setStatus('paused')} className="bg-amber-500 hover:bg-amber-600 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all">
              <Icons.Pause className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
          {status === 'paused' && (
            <>
              <button onClick={() => setStatus('running')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all">
                <Icons.Play className="w-3.5 h-3.5 fill-current" />
              </button>
              <button onClick={() => { setStatus('idle'); setRemaining(POMODORO_DURATION); }} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-sm active:scale-95 transition-all">
                <Icons.Square className="w-3 h-3 fill-current" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// 2. Focus Heatmap (GitHub-style, last 30 days)
function FocusHeatmap({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const completionLog = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (completionLog.quick?.length || 0) + (completionLog.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({ key, date: d, score, isToday: key === toDateKey(now) });
    }
    return days;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, totalItems]);

  const getColor = (score) => {
    if (score >= 0.9) return 'bg-emerald-600 dark:bg-emerald-500';
    if (score >= 0.8) return 'bg-emerald-500 dark:bg-emerald-600';
    if (score >= 0.65) return 'bg-lime-600 dark:bg-lime-500';
    if (score >= 0.5) return 'bg-lime-500 dark:bg-lime-600';
    if (score >= 0.35) return 'bg-amber-500 dark:bg-amber-600';
    if (score >= 0.2) return 'bg-yellow-500 dark:bg-yellow-600';
    if (score >= 0.1) return 'bg-yellow-400 dark:bg-yellow-700/70';
    if (score > 0) return 'bg-yellow-200 dark:bg-yellow-900/60';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const streak = useMemo(() => {
    let s = 0;
    for (let i = heatmapDays.length - 1; i >= 0; i--) {
      if (heatmapDays[i].score >= 0.8) s++;
      else break;
    }
    return s;
  }, [heatmapDays]);

  return (
    <div className="bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col gap-2.5 select-none shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
          <Icons.Flame className="w-3.5 h-3.5" /> Last 30 days
        </h3>
        {streak > 0 && (
          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
            {streak} day streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-10 gap-0.5">
        {heatmapDays.map(({ key, score, isToday }) => (
          <div
            key={key}
            title={`${Math.round(score * 100)}% · ${key}`}
            className={`aspect-square rounded-[2px] ${getColor(score)} ${isToday ? 'ring-1 ring-emerald-500 ring-offset-1 dark:ring-offset-[#1a1d24]' : ''} transition-colors`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-2 h-2 rounded-sm bg-yellow-200 dark:bg-yellow-900/60" />
          <div className="w-2 h-2 rounded-sm bg-yellow-400 dark:bg-yellow-700/70" />
          <div className="w-2 h-2 rounded-sm bg-yellow-500 dark:bg-yellow-600" />
          <div className="w-2 h-2 rounded-sm bg-amber-500 dark:bg-amber-600" />
          <div className="w-2 h-2 rounded-sm bg-lime-500 dark:bg-lime-600" />
          <div className="w-2 h-2 rounded-sm bg-lime-600 dark:bg-lime-500" />
          <div className="w-2 h-2 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
        </div>
        <span>100%</span>
      </div>
      <p className="text-[9px] text-gray-400 italic">Habits + Prayers + Tasks</p>
      <LightAnalyticsInner dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
    </div>
  );
}

function LightAnalyticsInner({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const { weekAvg, monthAvg, bestDay, worstDay } = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const cl = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((a, t) => a + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((a, p) => a + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({ key, score });
    }
    const weekDays = days.slice(-7);
    const monthDays = days;
    const weekAvg = weekDays.length ? weekDays.reduce((a, d) => a + d.score, 0) / weekDays.length : 0;
    const monthAvg = monthDays.length ? monthDays.reduce((a, d) => a + d.score, 0) / monthDays.length : 0;
    const withScore = days.filter(d => d.score > 0);
    const bestDay = withScore.length ? withScore.reduce((a, b) => a.score >= b.score ? a : b, { key: '', score: 0 }) : null;
    const worstDay = withScore.length ? withScore.reduce((a, b) => a.score <= b.score ? a : b, { key: '', score: 1 }) : null;
    return { weekAvg, monthAvg, bestDay, worstDay };
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, totalItems]);
  return (
    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
      <span className="text-gray-500">Week: <strong className="text-gray-700 dark:text-gray-300">{Math.round(weekAvg * 100)}%</strong></span>
      <span className="text-gray-500">Month: <strong className="text-gray-700 dark:text-gray-300">{Math.round(monthAvg * 100)}%</strong></span>
      {bestDay && <span className="text-emerald-600 dark:text-emerald-400">Best: {bestDay.key} ({Math.round(bestDay.score * 100)}%)</span>}
      {worstDay && worstDay.key !== bestDay?.key && <span className="text-amber-600 dark:text-amber-400">Worst: {worstDay.key} ({Math.round(worstDay.score * 100)}%)</span>}
    </div>
  );
}

function ThisWeekWidget({ dailyTaskLogs, activeHabits, now }) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(now);
    const todayKey = toDateKey(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const done = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const pct = activeHabits.length ? done / activeHabits.length : 0;
      const labels = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
      return { key, label: labels[i], pct, isToday: key === todayKey };
    });
  }, [dailyTaskLogs, activeHabits, now]);
  const weekPct = useMemo(() => {
    const done = weekDays.reduce((acc, d) => acc + d.pct, 0);
    return weekDays.length ? Math.round((done / weekDays.length) * 100) : 0;
  }, [weekDays]);
  const QUOTES = [
    'Piccoli passi, grandi risultati.',
    'La disciplina batte la motivazione.',
    'Oggi conta.',
    'Consistency is key.',
  ];
  const quote = QUOTES[Math.floor(now.getDate() % QUOTES.length)];
  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold text-sky-500 uppercase tracking-wider">This week</span>
        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tabular-nums">{weekPct}%</span>
      </div>
      <div className="flex gap-0.5 mb-1.5">
        {weekDays.map(({ label, pct, isToday }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-[2px] overflow-hidden" title={`${Math.round(pct * 100)}%`}>
              <div className={`h-full transition-all ${pct >= 0.8 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: `${pct * 100}%` }} />
            </div>
            <span className={`text-[8px] font-medium ${isToday ? 'text-sky-500 font-bold' : 'text-gray-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-gray-400 italic">{quote}</p>
    </div>
  );
}

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];
const accentBorder = (a) => ({
  indigo: 'border-l-indigo-300 dark:border-l-indigo-600',
  sky: 'border-l-sky-300 dark:border-l-sky-600',
  violet: 'border-l-violet-300 dark:border-l-violet-600',
  emerald: 'border-l-emerald-300 dark:border-l-emerald-600',
  amber: 'border-l-amber-300 dark:border-l-amber-600',
  rose: 'border-l-rose-300 dark:border-l-rose-600',
}[a] || 'border-l-indigo-300 dark:border-l-indigo-600');

function DenseTaskNode({ node, depth, projectId, projectAccent, onToggle, onDelete, onRename, onDeadline, onAddChild, onAddToTop3, onMove, hasFreeTop3Slot = true, parentId = null }) {
  const [draft, setDraft] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(node.deadline || '');
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const canAddChild = depth < MAX_TASK_DEPTH;
  const todayKey = toDateKey();
  const isOverdue = node.deadline && !node.done && node.deadline < todayKey;

  const handleDeadlineSave = () => {
    const val = deadlineInput.trim() || null;
    onDeadline?.(node.id, val);
    setShowDeadline(false);
  };
  useEffect(() => { if (showDeadline) setDeadlineInput(node.deadline || ''); }, [showDeadline, node.deadline]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'project-task', projectId, taskId: node.id, parentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="group/task flex flex-col w-full select-text"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-500/5'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-500/5'); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-500/5');
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload.type === 'project-task' && payload.projectId === projectId && payload.parentId === parentId) {
            onMove(payload.taskId);
          }
        } catch (_) {}
      }}
    >
      <div 
        draggable
        onDragStart={handleDragStart}
        className="flex items-start gap-1.5 py-1 px-1 -mx-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group/row cursor-grab active:cursor-grabbing"
      >
        
        {/* Expand Toggle */}
        <div className="w-3.5 flex justify-center shrink-0 mt-0.5">
          {hasChildren ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none">
              {expanded ? <Icons.ChevronDown className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />}
            </button>
          ) : <span className="w-3 h-3" />}
        </div>

        {/* Checkbox - click toggles */}
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(node.id, !node.done); }} className={`shrink-0 mt-0.5 transition-colors select-none ${node.done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-400'}`}>
          {node.done ? <Icons.CheckCircle className="w-3.5 h-3.5" /> : <Icons.Circle className="w-3.5 h-3.5" />}
        </button>
        
        {/* Content - click toggles, double-click to edit. Grid per allineare calendario su colonna fissa */}
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_5.5rem_auto] items-center gap-2" onClick={() => onToggle(node.id, !node.done)} onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}>
          <div className="min-w-0">
            {editing ? (
              <input
                autoFocus
                defaultValue={node.title}
                onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="w-full bg-white dark:bg-gray-800 border border-indigo-400 rounded px-1 text-xs outline-none py-0 select-text"
              />
            ) : (
              <span className={`text-xs cursor-pointer transition-colors break-words block select-text leading-relaxed ${node.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                {node.title}
              </span>
            )}
          </div>

          {/* Deadline - visibile solo se c'è una data o se si sta aggiungendo/modificando */}
          {onDeadline && (node.deadline || showDeadline) && (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              {showDeadline ? (
                <input
                  type="date"
                  value={deadlineInput || ''}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  onBlur={handleDeadlineSave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') { setShowDeadline(false); setDeadlineInput(node.deadline || ''); } }}
                  autoFocus
                  className="w-full max-w-[7rem] text-[10px] py-0.5 px-1.5 rounded-md border border-amber-400 dark:border-amber-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-amber-400"
                />
              ) : (
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeadlineInput(node.deadline || ''); setShowDeadline(true); }} className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] shrink-0 ${getDeadlineColorClass(node.deadline, node.done)}`} title="Scadenza">
                  <Icons.Calendar className="w-3 h-3 shrink-0" />
                  <span className="tabular-nums">{formatDeadline(node.deadline)}</span>
                </button>
              )}
            </div>
          )}
          
          {/* Actions - calendario per aggiungere scadenza appare al hover come le altre */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity justify-end" onClick={(e) => e.stopPropagation()}>
            {onDeadline && !node.deadline && !showDeadline && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setDeadlineInput(''); setShowDeadline(true); }} className="p-0.5 text-gray-500 hover:text-amber-500 select-none" title="Aggiungi scadenza">
                <Icons.Calendar className="w-3 h-3" />
              </button>
            )}
            {canAddChild && (
              <button type="button" onClick={() => setOpenAdd(!openAdd)} className="p-0.5 text-gray-500 hover:text-indigo-500 select-none" title="Subtask">
                <Icons.Plus className="w-3 h-3" />
              </button>
            )}
            <button type="button" onClick={() => hasFreeTop3Slot && onAddToTop3(projectId, node.id)} disabled={!hasFreeTop3Slot} className={`p-0.5 select-none ${hasFreeTop3Slot ? 'text-gray-500 hover:text-amber-500' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`} title={hasFreeTop3Slot ? 'Add to Top 3' : 'Top 3 pieni'}>
              <Icons.Target className="w-3 h-3" />
            </button>
            <button type="button" onClick={() => onDelete(node.id)} className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded select-none" title="Delete">
              <Icons.X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {openAdd && canAddChild && !editing && (
        <div className="flex pl-6 pr-1 py-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = draft.trim(); if (t) { onAddChild(node.id, t); setDraft(''); setOpenAdd(false); } } if (e.key === 'Escape') { e.preventDefault(); setOpenAdd(false); } }}
            placeholder="Subtask..."
            className="flex-1 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-[11px] outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div className={`ml-5 pl-2 border-l-2 ${accentBorder(projectAccent)} flex flex-col`}>
          {node.children.map((child, cIdx) => (
            <DenseTaskNode
              key={child.id} node={child} depth={depth + 1} projectId={projectId} projectAccent={projectAccent}
              onToggle={onToggle} onDelete={onDelete} onRename={onRename} onDeadline={onDeadline} onAddChild={onAddChild} onAddToTop3={onAddToTop3} 
              onMove={(tid) => onMove(tid, cIdx, node.id)} hasFreeTop3Slot={hasFreeTop3Slot} parentId={node.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 3. Standardized Project Card
function StandardProjectCard({ 
  project, 
  stats, 
  percentage, 
  accent, 
  isShared, 
  shareId,
  onTitleChange,
  onDelete,
  onDeadlineClick,
  projectDeadlineEditing,
  projectDeadlineInput,
  setProjectDeadlineInput,
  setProjectDeadlineEditing,
  getDeadlineColorClass,
  formatDeadline,
  renderTasks
}) {
  const accentBar = { indigo: 'bg-indigo-500', sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent];
  const accentProgress = { indigo: 'from-indigo-500 to-indigo-400', sky: 'from-sky-500 to-sky-400', violet: 'from-violet-500 to-violet-400', emerald: 'from-emerald-500 to-emerald-400', amber: 'from-amber-500 to-amber-400', rose: 'from-rose-500 to-rose-400' }[accent];
  const accentBorderClass = { indigo: 'border-indigo-500/30', sky: 'border-sky-500/30', violet: 'border-violet-500/30', emerald: 'border-emerald-500/30', amber: 'border-amber-500/30', rose: 'border-rose-500/30' }[accent];

  return (
    <div className="flex flex-col gap-4 group/proj bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-gray-800/60 rounded-2xl p-5 hover:shadow-xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300 relative">
      {isShared && (
        <div className="absolute -top-2.5 -right-2 bg-indigo-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase tracking-tighter z-10 border-2 border-white dark:border-[#0B0F19]">
          {shareId}
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-6 ${accentBar} rounded-full shrink-0 shadow-sm shadow-black/10`}></div>
          
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <input 
              value={project.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="flex-1 text-sm font-bold text-gray-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors min-w-0 select-text leading-tight"
            />

            {/* BARRA % ACCANTO AL TITOLO */}
            <div className="flex items-center gap-2 shrink-0 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${accentProgress} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-[11px] font-black text-gray-700 dark:text-gray-200 tabular-nums">{percentage}%</span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover/proj:opacity-100 transition-all">
            {isShared && (
              <Link 
                to={`/shared/${shareId}`}
                className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                title="Apri dashboard condivisa"
              >
                <Icons.ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            
            {(project.deadline || projectDeadlineEditing === project.id) ? (
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {projectDeadlineEditing === project.id ? (
                  <input
                    type="date"
                    value={projectDeadlineInput}
                    onChange={(e) => setProjectDeadlineInput(e.target.value)}
                    onBlur={() => onDeadlineClick(projectDeadlineInput)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onDeadlineClick(projectDeadlineInput);
                      if (e.key === 'Escape') setProjectDeadlineEditing(null);
                    }}
                    autoFocus
                    className="text-[10px] py-1 px-1.5 rounded-md border border-amber-400 dark:border-amber-500 bg-white dark:bg-gray-800 outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${getDeadlineColorClass(project.deadline, false)}`}
                  >
                    <Icons.Calendar className="w-3 h-3 shrink-0" />
                    <span className="tabular-nums">{formatDeadline(project.deadline)}</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setProjectDeadlineInput(''); setProjectDeadlineEditing(project.id); }}
                className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-all"
                title="Scadenza"
              >
                <Icons.Calendar className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
              title="Elimina"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col gap-1.5 pl-5 border-l-2 ${accentBorderClass} ml-1 transition-opacity duration-300 ${isShared ? 'opacity-80' : 'opacity-100'}`}>
        {renderTasks()}
      </div>
    </div>
  );
}

/**
 * ----------------------------------------------------------------------
 * MAIN DASHBOARD COMPONENT
 * ----------------------------------------------------------------------
 */
export default function DashboardV2() {
  const initial = useMemo(() => loadState(), []);
  const { setStats } = useDashboardStats() || { setStats: () => {} };

  const [dailyTaskTemplates, setDailyTaskTemplates] = useState(initial.dailyTaskTemplates);
  const [dailyTaskLogs, setDailyTaskLogs] = useState(initial.dailyTaskLogs);
  const [projects, setProjects] = useState(initial.projects);
  const [prayerLogs, setPrayerLogs] = useState(initial.prayerLogs);
  const [top3Manual, setTop3Manual] = useState(initial.top3Manual);
  const [quickTasks, setQuickTasks] = useState(initial.quickTasks);
  const [quickTaskDraft, setQuickTaskDraft] = useState('');
  const [quickTaskEditingId, setQuickTaskEditingId] = useState(null);
  const [quickTaskEditingTitle, setQuickTaskEditingTitle] = useState('');
  const [habitDraft, setHabitDraft] = useState('');
  const [habitEditingId, setHabitEditingId] = useState(null);
  const [habitEditingTitle, setHabitEditingTitle] = useState('');
  const [projectTaskDrafts, setProjectTaskDrafts] = useState({});
  const [projectDeadlineEditing, setProjectDeadlineEditing] = useState(null);
  const [projectDeadlineInput, setProjectDeadlineInput] = useState('');
  const [quickTaskDeadlineEditing, setQuickTaskDeadlineEditing] = useState(null);
  const [quickTaskDeadlineInput, setQuickTaskDeadlineInput] = useState('');
  const [dailyCompletionLog, setDailyCompletionLog] = useState(initial.dailyCompletionLog || {});
  const [sharedDashboards, setSharedDashboards] = useState([]);
  const wsConnections = useRef({}); // { shareId: WebSocket }
  
  const [isLoaded, setIsLoaded] = useState(false);

  // WebSocket management for shared dashboards
  useEffect(() => {
    if (!isLoaded || sharedDashboards.length === 0) return;

    sharedDashboards.forEach(sd => {
      const shareId = sd.share_id;
      if (wsConnections.current[shareId]) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:8000' : 'projecto-production-feda.up.railway.app';
      const wsUrl = `${protocol}//${host}/api/training/ws/shared-dashboard/${encodeURIComponent(shareId)}`;
      
      const socket = new WebSocket(wsUrl);
      wsConnections.current[shareId] = socket;

      socket.onopen = () => {
        console.log(`WS Connected for ${shareId}`);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'sync') {
            const data = message.data || message;
            setSharedDashboards(prev => prev.map(item => 
              item.share_id === shareId ? { ...item, data: data } : item
            ));
          }
        } catch (err) {
          console.error(`WS message error for ${shareId}:`, err);
        }
      };

      socket.onerror = (err) => {
        console.error(`WS error for ${shareId}:`, err);
      };

      socket.onclose = () => {
        console.log(`WS Disconnected for ${shareId}`);
        delete wsConnections.current[shareId];
        // Reconnect after 3s
        setTimeout(() => {
          setSharedDashboards(prev => [...prev]); // Trigger re-run of useEffect
        }, 3000);
      };
    });

    return () => {
      // Clean up connections if they are no longer in sharedDashboards
      Object.keys(wsConnections.current).forEach(id => {
        if (!sharedDashboards.some(s => s.share_id === id)) {
          wsConnections.current[id].close();
          delete wsConnections.current[id];
        }
      });
    };
  }, [isLoaded, sharedDashboards]);

  // 1. Initial Load from DB
  useEffect(() => {
    async function fetchDB() {
      try {
        const res = await api.training.getDashboardState();
        if (res && res.data) {
          const d = res.data;
          if (d.dailyTaskTemplates) setDailyTaskTemplates(d.dailyTaskTemplates);
          if (d.dailyTaskLogs) setDailyTaskLogs(d.dailyTaskLogs);
          if (d.projects) setProjects(d.projects);
          if (d.prayerLogs) setPrayerLogs(d.prayerLogs);
          if (d.top3Manual) setTop3Manual(d.top3Manual);
          if (d.quickTasks) setQuickTasks(d.quickTasks);
          if (d.dailyCompletionLog) setDailyCompletionLog(d.dailyCompletionLog);
        }

        // Fetch shared dashboards
        const shared = await api.training.listSharedDashboards();
        if (Array.isArray(shared)) {
          setSharedDashboards(shared);
        }
      } catch (err) {
        console.error("Failed to load dashboard from DB:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchDB();
  }, []);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Sync to LocalStorage (Fallback) and DB (Primary)
  const syncTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isLoaded) return;

    const state = { dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog };
    
    // LocalStorage Sync
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}

    // DB Sync (Debounced)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await api.training.updateDashboardState(state);
      } catch (err) {
        console.error("Failed to sync dashboard to DB:", err);
      }
    }, 2000);
  }, [isLoaded, dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog]);

  const todayKey = toDateKey(now);
  const todayTaskLog = dailyTaskLogs[todayKey] || {};
  const todayPrayerLog = prayerLogs[todayKey] || {};

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0);
  const prayerDone = PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0);
  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, quickTasks), [projects, top3Manual, quickTasks]);
  const top3DoneCount = top3Resolved.filter((s) => s && !s.missing && s.done).length;

  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;
  const todayFocusScore = totalFocusItems ? doneFocusItems / totalFocusItems : 0;

  const focusStreak = useMemo(() => {
    const totalItems = activeHabits.length + PRAYERS.length + 3;
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const cl = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      if (score >= 0.8) s++; else break;
    }
    return s;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now]);

  useEffect(() => {
    if(setStats) setStats({ doneFocusItems, totalFocusItems });
  }, [doneFocusItems, totalFocusItems, setStats]);

  // Actions
  const toggleDailyTask = (id, val) => setDailyTaskLogs(p => ({ ...p, [todayKey]: { ...p[todayKey], [id]: val } }));
  const toggleHabitLock = (id) => {
    setDailyTaskTemplates(p => p.map(t => t.id === id ? { ...t, locked: !t.locked } : t));
  };
  const reorderHabits = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    setDailyTaskTemplates(p => {
      const next = [...p];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  };
  const removeDailyTask = (id) => {
    setDailyTaskTemplates(p => p.filter(t => t.id !== id));
    setDailyTaskLogs(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, day]) => {
        const d = { ...day };
        delete d[id];
        if (Object.keys(d).length) next[k] = d;
      });
      return next;
    });
  };
  const togglePrayer = (name, val) => setPrayerLogs(p => ({ ...p, [todayKey]: { ...p[todayKey], [name]: val } }));
  const toggleQuickTask = (id, val) => {
    setQuickTasks(p => p.map(t => t.id === id ? { ...t, done: val } : t));
    setDailyCompletionLog(prev => {
      const day = prev[todayKey] || { quick: [], project: [] };
      const nextQuick = val ? (day.quick?.includes(id) ? day.quick : [...(day.quick || []), id]) : (day.quick || []).filter(x => x !== id);
      return { ...prev, [todayKey]: { ...day, quick: nextQuick } };
    });
  };
  const removeQuickTask = (id) => {
    setQuickTasks(p => p.filter(t => t.id !== id && t.parentId !== id));
    setTop3Manual(prev => prev.map(s => (s && s.quickTaskId === id) ? null : s));
    setDailyCompletionLog(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, day]) => {
        const quick = Array.isArray(day?.quick) ? day.quick.filter(x => x !== id) : [];
        const project = Array.isArray(day?.project) ? day.project : [];
        if (quick.length || project.length) next[k] = { quick, project };
      });
      return next;
    });
  };
  const reorderQuickTasks = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setQuickTasks(p => {
      const root = p.filter(t => !t.parentId);
      const rest = p.filter(t => t.parentId);
      const [removed] = root.splice(fromIndex, 1);
      root.splice(toIndex, 0, removed);
      return [...root, ...rest];
    });
  };
  const addQuickTask = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const title = quickTaskDraft.trim();
      if (title) {
        setQuickTasks(p => [...p, { id: uid('quick'), title, done: false, deadline: undefined }]);
        setQuickTaskDraft('');
      }
    }
  };
  const updateQuickTask = (id, updater) => setQuickTasks(p => p.map(t => t.id === id ? updater(t) : t));

  const createProject = () => {
    setProjects(p => [{ id: uid('project'), title: 'New Project', active: true, tasks: [], deadline: undefined }, ...p]);
  };
  const deleteProject = (projectId) => {
    setProjects(p => p.filter(x => x.id !== projectId));
    setTop3Manual(prev => prev.map(s => (s && s.projectId === projectId) ? null : s));
    setProjectTaskDrafts(prev => { const n = { ...prev }; delete n[projectId]; return n; });
  };
  const updateProject = (id, updater) => setProjects(p => p.map(x => x.id === id ? updater(x) : x));

  const updateSharedDashboardProject = (shareId, projectId, updater) => {
    let updatedData = null;
    let title = null;

    setSharedDashboards(prev => {
      const next = prev.map(sd => {
        if (sd.share_id === shareId) {
          const newData = { ...sd.data };
          newData.projects = (newData.projects || []).map(p => p.id === projectId ? updater(p) : p);
          updatedData = newData;
          title = sd.title;
          return { ...sd, data: newData };
        }
        return sd;
      });

      // Ora che abbiamo calcolato updatedData (perché map è sincrono), 
      // possiamo inviare l'aggiornamento.
      if (updatedData) {
        const socket = wsConnections.current[shareId];
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'sync', title, data: updatedData }));
        } else {
          api.training.updateSharedDashboard(shareId, updatedData, title).catch(err => {
            console.error("Failed to update shared dashboard (REST):", err);
          });
        }
      }

      return next;
    });
  };

  const deleteSharedDashboardProject = (shareId, projectId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo progetto condiviso?")) return;
    
    let updatedData = null;
    let title = null;

    setSharedDashboards(prev => {
      const next = prev.map(sd => {
        if (sd.share_id === shareId) {
          const newData = { ...sd.data };
          newData.projects = (newData.projects || []).filter(p => p.id !== projectId);
          updatedData = newData;
          title = sd.title;
          return { ...sd, data: newData };
        }
        return sd;
      });

      if (updatedData) {
        const socket = wsConnections.current[shareId];
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'sync', title, data: updatedData }));
        } else {
          api.training.updateSharedDashboard(shareId, updatedData, title).catch(err => {
            console.error("Failed to delete shared dashboard project (REST):", err);
          });
        }
      }

      return next;
    });
  };
  const reorderProjectTasks = (projectId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    updateProject(projectId, p => {
      const next = [...(p.tasks || [])];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return { ...p, tasks: next };
    });
  };
  const moveProjectTask = (projectId, taskId, targetIndex) => {
    updateProject(projectId, p => {
      const next = [...(p.tasks || [])];
      const fromIndex = next.findIndex(t => t.id === taskId);
      if (fromIndex === -1) return p;
      const [removed] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, removed);
      return { ...p, tasks: next };
    });
  };

  const moveSubtask = (projectId, parentId, taskId, targetIndex) => {
    updateProject(projectId, p => {
      const tasks = updateNodeInTree(p.tasks, parentId, parent => {
        const next = [...(parent.children || [])];
        const fromIndex = next.findIndex(t => t.id === taskId);
        if (fromIndex === -1) return parent;
        const [removed] = next.splice(fromIndex, 1);
        next.splice(targetIndex, 0, removed);
        return { ...parent, children: next };
      });
      return { ...p, tasks };
    });
  };

  const toggleProjectTask = (projectId, taskId, val) => {
    updateProject(projectId, p => ({ ...p, tasks: updateNodeInTree(p.tasks, taskId, n => ({ ...n, done: val })) }));
    setDailyCompletionLog(prev => {
      const day = prev[todayKey] || { quick: [], project: [] };
      const key = `${projectId}:${taskId}`;
      const nextProject = val ? (day.project?.includes(key) ? day.project : [...(day.project || []), key]) : (day.project || []).filter(x => x !== key);
      return { ...prev, [todayKey]: { ...day, project: nextProject } };
    });
  };

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

  const setTop3SlotAtIndex = (toIndex, entry) => {
    const sameEntry = (a, b) => {
      if (!a || !b) return false;
      if (a.quickTaskId && b.quickTaskId) return a.quickTaskId === b.quickTaskId;
      return a.projectId === b.projectId && a.taskId === b.taskId;
    };
    setTop3Manual(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) {
        if (i !== toIndex && sameEntry(next[i], entry)) next[i] = null;
      }
      next[toIndex] = entry;
      return next;
    });
  };

  const reorderTop3 = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setTop3Manual(prev => {
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  const removeFromTop3 = (idx) => {
    setTop3Manual(prev => { const n = [...prev]; n[idx] = null; return n; });
  };

  const toggleTop3Slot = (slot) => {
    if (!slot || slot.missing) return;
    if (slot.isQuick) toggleQuickTask(slot.quickTaskId, !slot.done);
    else toggleProjectTask(slot.projectId, slot.taskId, !slot.done);
  };

  return (
    <div className="h-full w-full bg-gray-100/80 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden font-sans select-none selection:bg-indigo-500/30 antialiased">
      
      {/* HEADER */}
      <header className="shrink-0 px-5 py-3 flex items-center justify-between bg-white/95 dark:bg-[#1a1d24] border-b border-gray-200/80 dark:border-gray-800/80 select-none shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-800 dark:text-gray-100 flex items-center gap-2.5">
            Dashboard
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 rounded-md uppercase tracking-widest">Pro</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
           {focusStreak > 0 && (
             <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
               {focusStreak} day streak
             </span>
           )}
           {/* Mini Focus Bar */}
           <div className="hidden md:flex items-center gap-2">
             <span className="text-xs font-bold text-indigo-500">FOCUS</span>
             <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.round(todayFocusScore * 100)}%` }} />
             </div>
             <span className="text-xs font-bold tabular-nums">{Math.round(todayFocusScore * 100)}%</span>
           </div>
           
           <div className="text-xs text-gray-500 font-medium">
             {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
           </div>
           <button
             type="button"
             onClick={() => {
               if (window.confirm('Azzerare tutto? Verranno eliminati progetti, task, abitudini e dati della dashboard. Ricarica la pagina.')) {
                 try {
                   localStorage.removeItem(STORAGE_KEY);
                   localStorage.removeItem('km-dashboard-v1');
                   localStorage.removeItem(POMODORO_STORAGE);
                   window.location.reload();
                 } catch (_) {}
               }
             }}
             className="text-[10px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
             title="Reset dashboard"
           >
             Reset
           </button>
        </div>
      </header>

      {/* Prayers + Time Remaining - horizontal bar above main content */}
      <div className="shrink-0 px-5 py-5">
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-[#1a1d24] p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Prayers - left half */}
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest shrink-0">🕌 Prayers</h3>
              <div className="flex flex-wrap gap-2 flex-1">
                {PRAYERS.map((prayer) => {
                  const isDone = todayPrayerLog[prayer];
                  return (
                    <label key={prayer} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                      <span className={`text-xs font-semibold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}>{prayer}</span>
                      <input type="checkbox" className="hidden" checked={!!isDone} onChange={(e) => togglePrayer(prayer, e.target.checked)} />
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-transparent'}`}>
                        <Icons.CheckCircle className="w-2.5 h-2.5" />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            {/* Time Remaining - right half */}
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Time Remaining</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 flex-1">
                {countdowns.map(c => (
                  <div key={c.label} className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
                    <span className="text-[10px] font-medium text-gray-500 shrink-0 w-12">{c.label}</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-300 tabular-nums shrink-0">{c.remaining}</span>
                    <div className="flex-1 min-w-[4rem] max-w-[8rem] h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all" style={{ width: `${c.pct * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 min-h-0 p-5 pt-0 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        
        {/* COL 1: Pomodoro, Quick Tasks, Prayers, Countdowns - Span 3 */}
        <div className="md:col-span-3 flex flex-col gap-4 min-h-0">
          <PomodoroCompact />
          
          {/* Quick Tasks */}
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col min-h-0 shrink-0 shadow-sm">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Icons.CheckCircle className="w-3.5 h-3.5" /> Quick Tasks
            </h3>
            <input 
              type="text" 
              value={quickTaskDraft}
              onChange={(e) => setQuickTaskDraft(e.target.value)}
              onKeyDown={addQuickTask}
              placeholder="Add quick task... (Enter)" 
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-rose-400 mb-2.5 transition-colors"
            />
            <div className="overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1 max-h-28">
              {quickTasks.filter(t => !t.parentId).map((task, idx) => {
                const showDeadline = task.deadline || quickTaskDeadlineEditing === task.id;
                return (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: idx }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-rose-50', 'dark:bg-rose-500/5'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('bg-rose-50', 'dark:bg-rose-500/5'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-rose-50', 'dark:bg-rose-500/5');
                      try {
                        const payload = JSON.parse(e.dataTransfer.getData('application/json'));
                        if (payload.type === 'quick') reorderQuickTasks(payload.fromIndex, idx);
                      } catch (_) {}
                    }}
                    onClick={() => toggleQuickTask(task.id, !task.done)}
                    onDoubleClick={(e) => { e.stopPropagation(); setQuickTaskEditingId(task.id); setQuickTaskEditingTitle(task.title); }}
                    className="group/qt flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-grab active:cursor-grabbing select-text"
                  >
                    <span className={`shrink-0 transition-colors pointer-events-none ${task.done ? 'text-rose-500' : 'text-gray-300 dark:text-gray-600'}`}>
                      {task.done ? <Icons.CheckCircle className="w-3.5 h-3.5" /> : <Icons.Circle className="w-3.5 h-3.5" />}
                    </span>
                    {quickTaskEditingId === task.id ? (
                      <input
                        autoFocus
                        value={quickTaskEditingTitle}
                        onChange={(e) => setQuickTaskEditingTitle(e.target.value)}
                        onBlur={() => {
                          const t = quickTaskEditingTitle.trim();
                          if (t) updateQuickTask(task.id, qt => ({ ...qt, title: t }));
                          setQuickTaskEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const t = quickTaskEditingTitle.trim();
                            if (t) updateQuickTask(task.id, qt => ({ ...qt, title: t }));
                            setQuickTaskEditingId(null);
                          }
                          if (e.key === 'Escape') setQuickTaskEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white dark:bg-gray-800 border border-rose-400 rounded px-1 text-xs outline-none py-0 select-text"
                      />
                    ) : (
                      <span className={`text-xs font-medium min-w-0 flex-1 truncate ${task.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{task.title}</span>
                    )}
                    {/* Deadline - visibile solo se impostata */}
                    {showDeadline && (
                      <div className="flex justify-end min-w-[4rem] shrink-0" onClick={(e) => e.stopPropagation()}>
                        {quickTaskDeadlineEditing === task.id ? (
                          <input
                            type="date"
                            value={quickTaskDeadlineInput}
                            onChange={(e) => setQuickTaskDeadlineInput(e.target.value)}
                            onBlur={() => {
                              updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined }));
                              setQuickTaskDeadlineEditing(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined }));
                                setQuickTaskDeadlineEditing(null);
                              }
                              if (e.key === 'Escape') setQuickTaskDeadlineEditing(null);
                            }}
                            autoFocus
                            className="text-[10px] py-0.5 px-1 rounded border border-amber-400 dark:border-amber-500 bg-white dark:bg-gray-800"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuickTaskDeadlineInput(task.deadline || ''); setQuickTaskDeadlineEditing(task.id); }}
                            className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${getDeadlineColorClass(task.deadline, task.done)}`}
                            title="Scadenza"
                          >
                            <Icons.Calendar className="w-3 h-3" />
                            <span className="tabular-nums">{formatDeadline(task.deadline)}</span>
                          </button>
                        )}
                      </div>
                    )}
                    {/* Actions - come nei project task */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/qt:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!task.deadline && quickTaskDeadlineEditing !== task.id && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setQuickTaskDeadlineInput(''); setQuickTaskDeadlineEditing(task.id); }} className="p-0.5 text-gray-500 hover:text-amber-500" title="Aggiungi scadenza">
                          <Icons.Calendar className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id }); }}
                        disabled={!top3Manual.some(s => !s)}
                        className={`p-0.5 ${top3Manual.some(s => !s) ? 'text-gray-500 hover:text-amber-500' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
                        title={top3Manual.some(s => !s) ? 'Add to Top 3' : 'Top 3 pieni'}
                      >
                        <Icons.Target className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeQuickTask(task.id); }} className="p-0.5 text-gray-400 hover:text-red-500" title="Elimina">
                        <Icons.X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {quickTasks.length === 0 && <p className="text-[10px] text-gray-400 italic py-2">No quick tasks</p>}
            </div>
          </div>
          
          <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
        </div>

        {/* COL 2: Top 3, Habits - Span 4 */}
        <div className="md:col-span-4 flex flex-col gap-4 min-h-0">
          
          {/* Top 3 */}
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col shrink-0 shadow-sm">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Icons.Target className="w-3.5 h-3.5" /> Top 3 Tasks
              </h3>
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">{top3DoneCount}/3</span>
            </div>
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((idx) => {
                const slot = top3Resolved[idx];
                const filled = slot && !slot.missing;
                return (
                  <div
                    key={idx}
                    data-slot-index={idx}
                    draggable={filled}
                    onDragStart={filled ? (e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx }));
                      e.dataTransfer.effectAllowed = 'move';
                    } : undefined}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-amber-400'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-amber-400')}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('ring-2', 'ring-amber-400');
                      const toIndex = Number(e.currentTarget.dataset.slotIndex);
                      try {
                        const raw = e.dataTransfer.getData('application/json');
                        if (!raw) return;
                        const payload = JSON.parse(raw);
                        if (payload.type === 'top3') {
                          reorderTop3(payload.fromIndex, toIndex);
                        } else if (payload.type === 'project' && payload.projectId && payload.taskId) {
                          setTop3SlotAtIndex(toIndex, { projectId: payload.projectId, taskId: payload.taskId });
                        } else if (payload.type === 'quick' && payload.quickTaskId) {
                          setTop3SlotAtIndex(toIndex, { quickTaskId: payload.quickTaskId });
                        }
                      } catch (_) {}
                    }}
                    className={`relative flex items-center min-h-[2.75rem] px-2.5 rounded-lg border transition-all ${filled ? 'bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing' : 'bg-gray-50 dark:bg-white/5 border-dashed border-gray-200 dark:border-gray-700'}`}
                  >
                    <div className="absolute -left-1.5 w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center text-[9px] font-black shadow-sm select-none">
                      {idx + 1}
                    </div>
                    {filled ? (
                      <>
                        <div
                          onClick={() => toggleTop3Slot(slot)}
                          className="pl-4 flex items-center gap-2 w-full flex-1 min-w-0 cursor-pointer select-text"
                        >
                          <span className={`shrink-0 transition-colors ${slot.done ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`}>
                            {slot.done ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.Circle className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate ${slot.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{slot.title}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{slot.projectTitle}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFromTop3(idx); }}
                          className="shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded select-none"
                          title="Rimuovi da Top 3"
                          aria-label="Rimuovi"
                        >
                          <Icons.X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="pl-4 text-[10px] text-gray-400 font-medium italic">Trascina qui</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habits */}
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col flex-1 min-h-0 shadow-sm">
            <div className="flex justify-between items-center mb-2.5 shrink-0">
              <h3 className="text-xs font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                <Icons.Flame className="w-3.5 h-3.5" /> Habits
              </h3>
              <span className="text-[10px] font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded">{todayDone}/{activeHabits.length}</span>
            </div>
            <div className="flex gap-2 mb-2.5 shrink-0">
              <input
                value={habitDraft}
                onChange={(e) => setHabitDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } } }}
                placeholder="Nuova abitudine..."
                className="flex-1 min-w-0 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
              />
              <button onClick={() => { const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } }} className="shrink-0 bg-sky-500 hover:bg-sky-600 text-white w-9 h-9 flex items-center justify-center rounded-lg shadow-sm transition-colors">
                <Icons.Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-1.5 pr-1 min-h-0">
              {dailyTaskTemplates.map((task, idx) => {
                const isLocked = task.locked;
                const isDone = todayTaskLog[task.id];
                return (
                  <div
                    key={task.id}
                    data-habit-index={idx}
                    draggable={!isLocked}
                    onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'habit', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-1', 'ring-sky-400', 'ring-inset'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-1', 'ring-sky-400', 'ring-inset'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('ring-1', 'ring-sky-400', 'ring-inset');
                      try {
                        const payload = JSON.parse(e.dataTransfer.getData('application/json'));
                        if (payload.type === 'habit') reorderHabits(payload.fromIndex, idx);
                      } catch (_) {}
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)}
                    onKeyDown={(e) => !isLocked && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleDailyTask(task.id, !isDone))}
                    onDoubleClick={(e) => { e.stopPropagation(); setHabitEditingId(task.id); setHabitEditingTitle(task.title); }}
                    className={`group/hab flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all select-text ${isLocked ? 'opacity-60 bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 cursor-default' : isDone ? 'bg-sky-50/50 dark:bg-sky-500/5 border-sky-100 dark:border-sky-500/20 cursor-pointer' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-gray-700/50 hover:border-sky-200 dark:hover:border-sky-500/30 cursor-pointer'} ${!isLocked ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {isLocked ? (
                      <Icons.Lock className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <span className={`shrink-0 transition-colors ${isDone ? 'text-sky-500' : 'text-gray-300 dark:text-gray-600'}`}>
                        {isDone ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.Circle className="w-4 h-4" />}
                      </span>
                    )}
                    {habitEditingId === task.id ? (
                      <input
                        autoFocus
                        value={habitEditingTitle}
                        onChange={(e) => setHabitEditingTitle(e.target.value)}
                        onBlur={() => {
                          const t = habitEditingTitle.trim();
                          if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h));
                          setHabitEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const t = habitEditingTitle.trim();
                            if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h));
                            setHabitEditingId(null);
                          }
                          if (e.key === 'Escape') setHabitEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white dark:bg-gray-800 border border-sky-400 rounded px-1 text-xs outline-none py-0 select-text"
                      />
                    ) : (
                      <span className={`text-xs font-medium truncate flex-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{task.title}</span>
                    )}
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/hab:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); toggleHabitLock(task.id); }} 
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${isLocked ? 'text-amber-500' : 'text-gray-400'}`}
                        title={isLocked ? "Sblocca abitudine" : "Blocca abitudine"}
                      >
                        {isLocked ? <Icons.Lock className="w-3 h-3" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>}
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeDailyTask(task.id); }} 
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" 
                        title="Rimuovi"
                      >
                        <Icons.X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* This Week - mini widget */}
            <ThisWeekWidget dailyTaskLogs={dailyTaskLogs} activeHabits={activeHabits} now={now} />
          </div>
        </div>

        {/* COL 3 */}
        <div className="md:col-span-5 bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-4 flex flex-col min-h-0 shadow-sm">
          <div className="flex items-center justify-between mb-3.5 shrink-0">
            <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
              <Icons.Square className="w-3.5 h-3.5" /> Projects
            </h2>
            <button onClick={createProject} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 px-2 py-1 rounded transition-colors">
              <Icons.Plus className="w-3 h-3" /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              {projects.map((project, idx) => {
                const stats = countTreeStats(project.tasks);
                const percentage = Math.round(stats.ratio * 100);
                const accent = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];
                return (
                  <StandardProjectCard
                    key={project.id}
                    project={project}
                    stats={stats}
                    percentage={percentage}
                    accent={accent}
                    isShared={false}
                    onTitleChange={(val) => updateProject(project.id, p => ({ ...p, title: val }))}
                    onDelete={deleteProject}
                    onDeadlineClick={(val) => {
                      updateProject(project.id, p => ({ ...p, deadline: val.trim() || undefined }));
                      setProjectDeadlineEditing(null);
                    }}
                    projectDeadlineEditing={projectDeadlineEditing}
                    projectDeadlineInput={projectDeadlineInput}
                    setProjectDeadlineInput={setProjectDeadlineInput}
                    setProjectDeadlineEditing={setProjectDeadlineEditing}
                    getDeadlineColorClass={getDeadlineColorClass}
                    formatDeadline={formatDeadline}
                    renderTasks={() => (
                      <>
                        {project.tasks?.map((node, tIdx) => (
                          <DenseTaskNode
                            key={node.id} node={node} depth={0} projectId={project.id} projectAccent={accent}
                            onToggle={(tid, val) => toggleProjectTask(project.id, tid, val)}
                            onDelete={(tid) => {
                              const idsToClear = collectNodeAndDescendantIds(project.tasks, tid);
                              updateProject(project.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }));
                              setTop3Manual(prev => prev.map(s => (s && s.projectId === project.id && idsToClear.has(s.taskId)) ? null : s));
                              setDailyCompletionLog(prev => {
                                const next = {};
                                Object.entries(prev).forEach(([k, day]) => {
                                  const projectKeys = Array.isArray(day?.project) ? day.project.filter(x => { const [pid, taskId] = String(x).split(':'); return pid !== project.id || !idsToClear.has(taskId); }) : [];
                                  const quick = Array.isArray(day?.quick) ? day.quick : [];
                                  if (projectKeys.length || quick.length) next[k] = { quick, project: projectKeys };
                                });
                                return next;
                              });
                            }}
                            onRename={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                            onDeadline={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                            onAddChild={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children||[]), createTaskNode(val)] })) }))}
                            onAddToTop3={(pid, tid) => {
                              const free = top3Manual.findIndex(s => !s);
                              if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid });
                            }}
                            onMove={(tid, targetIdx, pid) => pid ? moveSubtask(project.id, pid, tid, targetIdx) : moveProjectTask(project.id, tid, tIdx)}
                            hasFreeTop3Slot={top3Manual.some(s => !s)}
                          />
                        ))}
                        <div className="pt-1 pl-1">
                          <input 
                            value={projectTaskDrafts[project.id] ?? ''}
                            onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [project.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const title = (projectTaskDrafts[project.id] ?? '').trim();
                                if (title) {
                                  updateProject(project.id, p => ({ ...p, tasks: [...(p.tasks||[]), createTaskNode(title)] }));
                                  setProjectTaskDrafts(prev => ({ ...prev, [project.id]: '' }));
                                }
                              }
                            }}
                            placeholder="Add task... (Enter)"
                            className="w-full bg-transparent border-none text-[11px] outline-none text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                          />
                        </div>
                      </>
                    )}
                  />
                );
              })}
            </div>

            {/* SHARED PROJECTS */}
            {sharedDashboards.length > 0 && (
              <div className="flex flex-col gap-6 mt-4">
                <div className="flex items-center gap-2 shrink-0">
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Icons.MessageCircle className="w-4 h-4" /> Shared Dashboards
                  </h2>
                </div>
                <div className="flex flex-col gap-6">
                  {sharedDashboards.map((shared, sIdx) => {
                    const sharedData = shared.data || {};
                    const sharedProjects = Array.isArray(sharedData.projects) ? sharedData.projects : (Array.isArray(sharedData) ? sharedData : []);
                    
                    return sharedProjects.map((project, pIdx) => {
                      const stats = countTreeStats(project.tasks);
                      const percentage = Math.round(stats.ratio * 100);
                      const accent = PROJECT_ACCENTS[(sIdx + pIdx + projects.length) % PROJECT_ACCENTS.length];

                      return (
                        <StandardProjectCard
                          key={`${shared.share_id}-${project.id}`}
                          project={project}
                          stats={stats}
                          percentage={percentage}
                          accent={accent}
                          isShared={true}
                          shareId={shared.share_id}
                          onTitleChange={(val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, title: val }))}
                          onDelete={() => deleteSharedDashboardProject(shared.share_id, project.id)}
                          onDeadlineClick={(val) => {
                            updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, deadline: val.trim() || undefined }));
                            setProjectDeadlineEditing(null);
                          }}
                          projectDeadlineEditing={projectDeadlineEditing}
                          projectDeadlineInput={projectDeadlineInput}
                          setProjectDeadlineInput={setProjectDeadlineInput}
                          setProjectDeadlineEditing={setProjectDeadlineEditing}
                          getDeadlineColorClass={getDeadlineColorClass}
                          formatDeadline={formatDeadline}
                          renderTasks={() => (
                            <>
                              {project.tasks?.map((node, tIdx) => (
                                <DenseTaskNode
                                  key={node.id} node={node} depth={0} projectId={project.id} projectAccent={accent}
                                  onToggle={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) }))}
                                  onDelete={(tid) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }))}
                                  onRename={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                                  onDeadline={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                                  onAddChild={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children||[]), createTaskNode(val)] })) }))}
                                  onAddToTop3={(pid, tid) => {
                                    // Top3 is local only for now, but we can enable it if needed
                                    const free = top3Manual.findIndex(s => !s);
                                    if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid });
                                  }}
                                  onMove={(tid, targetIdx, pid) => {
                                    if (pid) {
                                      updateSharedDashboardProject(shared.share_id, project.id, p => ({
                                        ...p,
                                        tasks: updateNodeInTree(p.tasks, pid, parent => {
                                          const next = [...(parent.children || [])];
                                          const fromIdx = next.findIndex(t => t.id === tid);
                                          if (fromIdx === -1) return parent;
                                          const [removed] = next.splice(fromIdx, 1);
                                          next.splice(targetIdx, 0, removed);
                                          return { ...parent, children: next };
                                        })
                                      }));
                                    } else {
                                      updateSharedDashboardProject(shared.share_id, project.id, p => {
                                        const next = [...(p.tasks || [])];
                                        const fromIdx = next.findIndex(t => t.id === tid);
                                        if (fromIdx === -1) return p;
                                        const [removed] = next.splice(fromIdx, 1);
                                        next.splice(targetIdx, 0, removed);
                                        return { ...p, tasks: next };
                                      });
                                    }
                                  }}
                                  hasFreeTop3Slot={top3Manual.some(s => !s)}
                                />
                              ))}
                              <div className="pt-1 pl-1">
                                <input 
                                  value={projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? ''}
                                  onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const title = (projectTaskDrafts[`${shared.share_id}-${project.id}`] ?? '').trim();
                                      if (title) {
                                        updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: [...(p.tasks||[]), createTaskNode(title)] }));
                                        setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: '' }));
                                      }
                                    }
                                  }}
                                  placeholder="Add task... (Enter)"
                                  className="w-full bg-transparent border-none text-[11px] outline-none text-gray-600 dark:text-gray-400 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                />
                              </div>
                            </>
                          )}
                        />
                      );
                    });
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.4); border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(148, 163, 184, 0.6); }
      `}</style>
    </div>
  );
}