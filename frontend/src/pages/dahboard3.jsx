import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ----------------------------------------------------------------------
 * ICONS (Lucide-inspired)
 * ----------------------------------------------------------------------
 */
const Icons = {
  CheckCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Circle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/></svg>,
  Plus: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Target: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  ChevronDown: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>,
  Calendar: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Zap: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Trash: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Clock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Flame: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Play: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Square: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  MoreHorizontal: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  Check: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>,
  Lock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

/**
 * ----------------------------------------------------------------------
 * UI BASE CLASSES
 * ----------------------------------------------------------------------
 */
const CARD_BASE = "bg-[#111118] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all duration-150";
const SECTION_TITLE = "text-[10px] font-semibold uppercase tracking-widest text-[#94a3b8]";

/**
 * Checkbox universale con animazione bump
 */
function TaskCheckbox({ done, onClick, className = '' }) {
  const [bump, setBump] = useState(false);
  const handleClick = (e) => {
    e.stopPropagation();
    setBump(true);
    onClick(e);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBump(false)}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150 ${
        done ? 'border-[#10b981] bg-[#10b981] text-white' : 'border-[#475569] bg-transparent hover:border-[#6366f1]'
      } ${bump ? 'animate-checkbox-pop' : ''} ${className}`}
    >
      {done && <Icons.Check className="h-3 w-3" />}
    </button>
  );
}

/**
 * KebabMenu — dropdown minimale con azioni contestuali
 */
function KebabMenu({ items }) {
  const[open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="inline-flex items-center justify-center rounded-md p-1 text-[#94a3b8] transition-colors hover:bg-white/[0.06] hover:text-[#f1f5f9] opacity-0 group-hover:opacity-100"
        title="Azioni"
      >
        <Icons.MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] animate-slide-down rounded-xl border border-white/[0.08] bg-[#111118] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-white/[0.06]" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(e); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#f1f5f9]'
                }`}
              >
                {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ----------------------------------------------------------------------
 * CONSTANTS & UTILS
 * ----------------------------------------------------------------------
 */
const STORAGE_KEY = 'km-dashboard-v2';
const MAX_TASK_DEPTH = 2;
const PRAYERS =['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

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

function buildDefaultLifeGoals() {
  const mkG = (title, category, type = 'quick', done = false) => ({ 
    id: uid('goal'), title, category, type, done, deadline: null, tasks:[] 
  });
  return {
    collapsed: false,
    tiers:[
      {
        id: 'tier-1', name: 'Tier 1', emoji: '🎯', color: 'emerald', collapsed: false,
        goals:[
          mkG('Eliminare ogni addiction', 'Disciplina', 'project'),
          mkG('Completare KM Personal', 'Conoscenza', 'project'),
          mkG('Pagare tutti i debiti', 'Finanza', 'project'),
          mkG('Raggiungere 66kg', 'Corpo', 'quick'),
        ]
      },
      {
        id: 'tier-2', name: 'Tier 2', emoji: '📈', color: 'sky', collapsed: true,
        goals:[
          mkG('Correre una maratona', 'Corpo', 'project'),
          mkG('Hajj con i genitori', 'Spiritualità', 'quick'),
        ]
      },
      {
        id: 'tier-3', name: 'Tier 3', emoji: '⚡', color: 'violet', collapsed: true,
        goals:[
          mkG('Diventare milionario', 'Finanza', 'quick'),
          mkG('Imparare 5 nuove lingue', 'Conoscenza', 'project'),
        ]
      },
      {
        id: 'tier-4', name: 'Tier 4', emoji: '👑', color: 'amber', collapsed: true,
        goals:[
          mkG('Costruire una moschea', 'Legacy', 'project'),
          mkG('Visitare tutti i paesi del mondo', 'Avventura', 'quick'),
        ]
      },
      {
        id: 'tier-5', name: 'Tier 5', emoji: '🚀', color: 'rose', collapsed: true,
        goals:[
          mkG('Comprare un\'isola privata', 'Patrimonio', 'quick'),
        ]
      },
    ]
  };
}

function buildDefaultState() {
  const DEFAULT_HABITS =[
    { id: uid('daily'), title: '💎 Retention', locked: false },
    { id: uid('daily'), title: '⚔️ Allenamento', locked: false },
    { id: uid('daily'), title: '💤 Sonno 7.5h+', locked: false },
    { id: uid('daily'), title: '🚭 No Fumo', locked: true },
    { id: uid('daily'), title: '📚 Lettura', locked: true },
    { id: uid('daily'), title: '✍️ Journaling', locked: true },
  ];
  const mk = (title, done = false) => ({ id: uid('task'), title, done, children:[], deadline: undefined });
  const mkChild = (parent, ...children) => ({ ...parent, children });
  const projects =[
    {
      id: uid('project'),
      title: 'Health & Fitness',
      active: true,
      tasks:[
        mk('Settimana workout completa', false),
        mkChild(mk('Piano alimentare', false), mk('Definisci macro', false), mk('Prep meal domenica', false)),
      ],
    },
  ];
  return {
    dailyTaskTemplates: DEFAULT_HABITS,
    dailyTaskLogs: {},
    projects,
    prayerLogs: {},
    top3Manual: [null, null, null],
    quickTasks:[],
    dailyCompletionLog: {},
    lifeGoals: buildDefaultLifeGoals(),
  };
}

function normalizeLifeGoals(lg, fallback) {
  if (!lg || !Array.isArray(lg.tiers) || lg.tiers.length === 0) return fallback;
  const projectTitles =['Eliminare ogni addiction', 'Completare KM Personal', 'Pagare tutti i debiti', 'Correre una maratona', 'Imparare 5 nuove lingue', 'Costruire una moschea'];
  const tierMeta = { 'tier-1': { name: 'Tier 1', emoji: '🎯' }, 'tier-2': { name: 'Tier 2', emoji: '📈' }, 'tier-3': { name: 'Tier 3', emoji: '⚡' }, 'tier-4': { name: 'Tier 4', emoji: '👑' }, 'tier-5': { name: 'Tier 5', emoji: '🚀' } };

  return {
    ...lg,
    tiers: lg.tiers.map(t => {
      const fallbackTier = fallback.tiers.find(ft => ft.id === t.id);
      const currentGoals = Array.isArray(t.goals) && t.goals.length > 0 ? t.goals : (fallbackTier ? fallbackTier.goals : []);
      const meta = tierMeta[t.id] || { name: t.name, emoji: t.emoji };

      return {
        ...t,
        name: meta.name,
        emoji: meta.emoji,
        collapsed: t.collapsed !== undefined ? t.collapsed : (t.id !== 'tier-1'),
        goals: currentGoals.map(g => {
          const isKnownProject = projectTitles.some(pt => g.title.toLowerCase().includes(pt.toLowerCase()));
          let targetType = g.type;
          if (isKnownProject) targetType = 'project';
          else if (!targetType) targetType = (Array.isArray(g.tasks) && g.tasks.length > 0) ? 'project' : 'quick';
          return { ...g, type: targetType, tasks: Array.isArray(g.tasks) ? g.tasks :[] };
        })
      };
    })
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
      lifeGoals: normalizeLifeGoals(parsed.lifeGoals, fallback.lifeGoals),
    };
  } catch (_) {
    return fallback;
  }
}

function findTaskInProjects(projects, projectId, taskId, lifeGoals = null) {
  const project = projects.find((p) => p.id === projectId);
  if (project) {
    let found = null;
    function walk(nodes) {
      for (const n of nodes ||[]) {
        if (n.id === taskId) { found = { node: n, projectTitle: project.title }; return; }
        if (Array.isArray(n.children) && n.children.length) walk(n.children);
      }
    }
    walk(project.tasks);
    if (found) return found;
  }
  if (lifeGoals && lifeGoals.tiers) {
    for (const tier of lifeGoals.tiers) {
      const lgProj = tier.goals?.find(g => g.id === projectId || `lg-${g.id}` === projectId);
      if (lgProj) {
        let found = null;
        if (lgProj.id === taskId) return { node: lgProj, projectTitle: `LG: ${tier.name}` };
        function walkLG(nodes) {
          for (const n of nodes ||[]) {
            if (n.id === taskId) { found = { node: n, projectTitle: `LG: ${lgProj.title}` }; return; }
            if (Array.isArray(n.children) && n.children.length) walkLG(n.children);
          }
        }
        walkLG(lgProj.tasks);
        if (found) return found;
      }
    }
  }
  return null;
}

function resolveTop3Slots(projects, top3Manual, quickTasks =[], lifeGoals = null) {
  return top3Manual.map((slot) => {
    if (!slot) return null;
    if (slot.quickTaskId) {
      const qt = quickTasks.find((t) => t.id === slot.quickTaskId);
      if (!qt) return { ...slot, missing: true };
      return { ...slot, title: qt.title, projectTitle: 'Quick Task', done: qt.done, isQuick: true };
    }
    const res = findTaskInProjects(projects, slot.projectId, slot.taskId, lifeGoals);
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
  walk(nodes ||[]);
  return { total, completed, ratio: total ? completed / total : 0 };
}

function createTaskNode(title) {
  return { id: uid('task'), title: title.trim(), done: false, children:[], deadline: undefined };
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
function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-[#475569] bg-transparent';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-[#f59e0b] bg-[#f59e0b]/10';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-[#f87171] bg-[#f87171]/10';
  if (daysUntil <= 2) return 'text-[#f87171] bg-[#f87171]/10';
  if (daysUntil <= 7) return 'text-[#f59e0b] bg-[#f59e0b]/10';
  return 'text-[#10b981] bg-[#10b981]/10';
}

function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    return { ...node, children: updateNodeInTree(Array.isArray(node.children) ? node.children :[], nodeId, updater) };
  });
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeNodeFromTree(Array.isArray(node.children) ? node.children :[], nodeId) }));
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
  const[status, setStatus] = useState('idle'); 
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
  },[status, todayKey]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const progress = 1 - remaining / POMODORO_DURATION;

  return (
    <div className={`${CARD_BASE} p-5 flex flex-col gap-2 relative overflow-hidden select-none`}>
      <div className="flex justify-between items-center z-10">
        <div className={`flex items-center gap-1.5 ${SECTION_TITLE}`}>
          <Icons.Clock className="w-3.5 h-3.5 text-[#6366f1]" /> Focus
        </div>
        <div className="text-[10px] font-bold bg-[#6366f1]/10 text-[#6366f1] px-2 py-0.5 rounded-full border border-[#6366f1]/20">
          {sessionsToday} sess
        </div>
      </div>
      
      <div className="flex items-center justify-between z-10 mt-2">
        <div className="text-4xl font-black tracking-tighter tabular-nums text-[#f1f5f9] leading-none">
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
           {status === 'idle' && (
            <button onClick={() => { setStatus('running'); setRemaining(POMODORO_DURATION); }} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
              <Icons.Play className="w-4 h-4 fill-current" />
            </button>
          )}
          {status === 'running' && (
            <button onClick={() => setStatus('paused')} className="bg-[#f59e0b] hover:bg-[#d97706] text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 transition-all">
              <Icons.Pause className="w-4 h-4 fill-current" />
            </button>
          )}
          {status === 'paused' && (
            <>
              <button onClick={() => setStatus('running')} className="bg-[#6366f1] hover:bg-[#4f46e5] text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
                <Icons.Play className="w-4 h-4 fill-current" />
              </button>
              <button onClick={() => { setStatus('idle'); setRemaining(POMODORO_DURATION); }} className="bg-white/[0.06] hover:bg-white/[0.1] text-[#f1f5f9] w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all border border-white/[0.06]">
                <Icons.Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// 2. Focus Heatmap
function FocusHeatmap({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const heatmapDays = useMemo(() => {
    const days =[];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const completionLog = dailyCompletionLog[key] || { quick: [], project:[] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (completionLog.quick?.length || 0) + (completionLog.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({ key, date: d, score, isToday: key === toDateKey(now) });
    }
    return days;
  },[dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, totalItems]);

  const getColor = (score) => {
    if (score >= 0.9) return 'bg-[#10b981]';
    if (score >= 0.65) return 'bg-[#34d399]';
    if (score >= 0.4) return 'bg-[#fbbf24]';
    if (score > 0) return 'bg-[#fbbf24]/40';
    return 'bg-white/[0.04]';
  };

  return (
    <div className={`${CARD_BASE} p-5 flex flex-col gap-4 select-none`}>
      <div className="flex justify-between items-center">
        <h3 className={`flex items-center gap-1.5 ${SECTION_TITLE}`}>
          <Icons.Flame className="w-3.5 h-3.5 text-[#10b981]" /> Activity 30d
        </h3>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {heatmapDays.map(({ key, score, isToday }) => (
          <div
            key={key}
            title={`${Math.round(score * 100)}%`}
            className={`w-3 h-3 rounded-[2px] ${getColor(score)} ${isToday ? 'ring-2 ring-offset-2 ring-[#6366f1] ring-offset-[#111118]' : ''} transition-colors`}
          />
        ))}
      </div>
    </div>
  );
}

function DenseTaskNode({ node, depth, projectId, projectAccent, onToggle, onDelete, onRename, onDeadline, onAddChild, onAddToTop3, hasFreeTop3Slot }) {
  const [draft, setDraft] = useState('');
  const[openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(node.deadline || '');
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const canAddChild = depth < MAX_TASK_DEPTH;

  const handleDeadlineSave = () => {
    const val = deadlineInput.trim() || null;
    onDeadline?.(node.id, val);
    setShowDeadline(false);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'project-task', projectId, taskId: node.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="group/task flex flex-col w-full">
      <div 
        draggable
        onDragStart={handleDragStart}
        className="group/row flex items-center h-8 gap-2 px-2 -mx-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/[0.04] transition-all duration-150"
      >
        <div className="w-4 flex items-center justify-center shrink-0">
          {hasChildren && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-[#475569] hover:text-[#94a3b8] transition-colors">
              {expanded ? <Icons.ChevronDown className="h-3.5 w-3.5" /> : <Icons.ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <TaskCheckbox done={node.done} onClick={() => onToggle(node.id, !node.done)} />
        
        <div className="flex flex-1 min-w-0 items-center gap-2 h-full" onClick={() => !editing && onToggle(node.id, !node.done)}>
          {editing ? (
            <input
              autoFocus
              defaultValue={node.title}
              onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border border-[#6366f1]/50 outline-none text-sm text-[#f1f5f9] flex-1 min-w-0 px-2 py-0.5 focus:ring-1 focus:ring-[#6366f1]/50 rounded transition-all"
            />
          ) : (
            <span
              onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className={`cursor-pointer select-text text-sm truncate transition-colors duration-150 ${node.done ? 'text-[#475569] line-through decoration-[#475569]' : 'text-[#f1f5f9]'}`}
            >
              {node.title}
            </span>
          )}

          {onDeadline && node.deadline && !showDeadline && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeadlineInput(node.deadline || ''); setShowDeadline(true); }}
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/[0.06] transition-colors ${getDeadlineColorClass(node.deadline, node.done)}`}
            >
              {formatDeadline(node.deadline)}
            </button>
          )}
          {showDeadline && (
            <input
              type="date"
              value={deadlineInput || ''}
              onChange={(e) => setDeadlineInput(e.target.value)}
              onBlur={handleDeadlineSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') setShowDeadline(false); }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="bg-[#0a0a0f] border border-white/[0.1] rounded-md px-2 py-0.5 text-xs text-[#f1f5f9] outline-none"
            />
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 pr-1" onClick={(e) => e.stopPropagation()}>
          {onDeadline && !node.deadline && !showDeadline && (
            <button type="button" onClick={() => { setDeadlineInput(''); setShowDeadline(true); }} className="text-[#475569] hover:text-[#f59e0b] p-1 transition-colors" title="Scadenza">
              <Icons.Calendar className="h-3.5 w-3.5" />
            </button>
          )}
          {canAddChild && (
            <button type="button" onClick={() => setOpenAdd(!openAdd)} className="text-[#475569] hover:text-[#6366f1] p-1 transition-colors" title="Subtask">
              <Icons.Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => hasFreeTop3Slot && onAddToTop3(projectId, node.id)}
            disabled={!hasFreeTop3Slot}
            className={`p-1 transition-colors ${hasFreeTop3Slot ? 'text-[#475569] hover:text-[#f59e0b]' : 'text-[#475569]/30 cursor-not-allowed'}`}
          >
            <Icons.Target className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(node.id)} className="text-[#475569] hover:text-[#f87171] p-1 transition-colors" title="Elimina">
            <Icons.X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {openAdd && canAddChild && (
        <div className="flex pl-8 pr-2 py-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = draft.trim(); if (t) { onAddChild(node.id, t); setDraft(''); setOpenAdd(false); } } if (e.key === 'Escape') { setOpenAdd(false); } }}
            placeholder="Subtask..."
            className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-[#f1f5f9] outline-none focus:border-[#6366f1]/50 focus:ring-1 focus:ring-[#6366f1]/50 w-full transition-all"
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div className="ml-5 pl-3 border-l border-white/[0.06] flex flex-col gap-1 mt-1">
          {node.children.map((child) => (
            <DenseTaskNode
              key={child.id} node={child} depth={depth + 1} projectId={projectId} projectAccent={projectAccent}
              onToggle={onToggle} onDelete={onDelete} onRename={onRename} onDeadline={onDeadline} onAddChild={onAddChild} onAddToTop3={onAddToTop3} 
              hasFreeTop3Slot={hasFreeTop3Slot}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StandardProjectCard({ 
  project, 
  stats, 
  percentage, 
  accent, 
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
  const [expanded, setExpanded] = useState(false);
  const accentBar = { indigo: 'bg-[#6366f1]', sky: 'bg-[#0ea5e9]', violet: 'bg-[#8b5cf6]', emerald: 'bg-[#10b981]', amber: 'bg-[#f59e0b]', rose: 'bg-[#f43f5e]' }[accent] || 'bg-white/[0.2]';
  
  const menuItems =[
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }
    },
    'divider',
    { label: 'Elimina Progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(project.id) }
  ];

  return (
    <div className={`${CARD_BASE} flex flex-col overflow-hidden`}>
      <div
        className="flex cursor-pointer items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors duration-150"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`h-5 w-1 shrink-0 rounded-full ${accentBar} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />

        <input
          value={project.title}
          onChange={(e) => { e.stopPropagation(); onTitleChange(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-none outline-none flex-1 text-sm font-semibold text-[#f1f5f9] focus:ring-1 focus:ring-[#6366f1]/50 rounded px-1 -ml-1 transition-all"
        />

        <div className="flex shrink-0 items-center gap-3">
          {project.deadline && projectDeadlineEditing !== project.id && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/[0.04] transition-colors ${getDeadlineColorClass(project.deadline, false)}`}
            >
              {formatDeadline(project.deadline)}
            </button>
          )}
          {projectDeadlineEditing === project.id && (
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
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0f] border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-[#f1f5f9] outline-none transition-all"
            />
          )}
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-white/[0.06]">
              <div className={`h-full ${accentBar} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="w-8 text-right text-xs font-bold tabular-nums text-[#94a3b8]">{percentage}%</span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <KebabMenu items={menuItems} />
          </div>

          <Icons.ChevronDown className={`h-4 w-4 text-[#475569] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="animate-slide-down border-t border-white/[0.06] p-4 pt-3 flex flex-col gap-1">
          {renderTasks()}
        </div>
      )}
    </div>
  );
}

function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onAddToTop3, hasFreeTop3Slot
}) {
  const isProject = goal.type === 'project';
  const [showTasks, setShowTasks] = useState(false);
  const accentClass = { emerald: 'bg-[#10b981]', sky: 'bg-[#0ea5e9]', violet: 'bg-[#8b5cf6]', amber: 'bg-[#f59e0b]', rose: 'bg-[#f43f5e]' }[accent] || 'bg-[#6366f1]';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group/goal relative flex flex-col rounded-xl border border-white/[0.06] bg-[#111118] transition-all duration-150 hover:border-white/[0.1] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentClass} opacity-80`} />
      
      <div className="flex items-center gap-3 pl-4 pr-3 py-2.5 cursor-grab active:cursor-grabbing">
        <TaskCheckbox done={goal.done} onClick={() => onToggle(goal.id, !goal.done)} />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <input
            value={goal.title}
            onChange={(e) => onRename(goal.id, e.target.value)}
            className={`w-full bg-transparent text-sm font-medium outline-none transition-colors duration-150 ${goal.done ? 'text-[#475569] line-through' : 'text-[#f1f5f9]'}`}
          />
          {isProject && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-[3px] w-full max-w-[100px] overflow-hidden rounded-full bg-white/[0.06]">
                <div className={`h-full ${accentClass} transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover/goal:opacity-100 transition-opacity duration-150">
          {hasFreeTop3Slot && (
            <button onClick={() => onAddToTop3(goal.id)} className="rounded p-1 text-[#475569] hover:text-[#f59e0b] transition-colors" title="Top 3">
              <Icons.Target className="h-3.5 w-3.5" />
            </button>
          )}

          {isProject && (
            <button onClick={() => setShowTasks(!showTasks)} className={`rounded p-1 text-[#475569] hover:text-[#f1f5f9] transition-colors`}>
              <Icons.ChevronDown className={`h-4 w-4 transition-transform ${showTasks ? 'rotate-180' : ''}`} />
            </button>
          )}
          
          <button onClick={() => onDelete(goal.id)} className="rounded p-1 text-[#475569] hover:text-[#f87171] transition-colors">
            <Icons.X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {isProject && showTasks && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 flex flex-col gap-1">
          {renderTasks()}
        </div>
      )}
    </div>
  );
}

/**
 * ----------------------------------------------------------------------
 * MAIN DASHBOARD COMPONENT
 * ----------------------------------------------------------------------
 */
export default function DashboardV2() {
  const initial = useMemo(() => loadState(),[]);
  const { setStats } = useDashboardStats() || { setStats: () => {} };

  const [dailyTaskTemplates, setDailyTaskTemplates] = useState(initial.dailyTaskTemplates);
  const [dailyTaskLogs, setDailyTaskLogs] = useState(initial.dailyTaskLogs);
  const[projects, setProjects] = useState(initial.projects);
  const [prayerLogs, setPrayerLogs] = useState(initial.prayerLogs);
  const [top3Manual, setTop3Manual] = useState(initial.top3Manual);
  const [quickTasks, setQuickTasks] = useState(initial.quickTasks);
  const [quickTaskDraft, setQuickTaskDraft] = useState('');
  const[quickTaskEditingId, setQuickTaskEditingId] = useState(null);
  const [quickTaskEditingTitle, setQuickTaskEditingTitle] = useState('');
  const [habitDraft, setHabitDraft] = useState('');
  const[habitEditingId, setHabitEditingId] = useState(null);
  const [habitEditingTitle, setHabitEditingTitle] = useState('');
  const [projectTaskDrafts, setProjectTaskDrafts] = useState({});
  const[projectDeadlineEditing, setProjectDeadlineEditing] = useState(null);
  const [projectDeadlineInput, setProjectDeadlineInput] = useState('');
  const [quickTaskDeadlineEditing, setQuickTaskDeadlineEditing] = useState(null);
  const[quickTaskDeadlineInput, setQuickTaskDeadlineInput] = useState('');
  const [dailyCompletionLog, setDailyCompletionLog] = useState(initial.dailyCompletionLog || {});
  const [lifeGoals, setLifeGoals] = useState(initial.lifeGoals);
  const [goalTaskDrafts, setGoalTaskDrafts] = useState({});
  const [goalDeadlineEditing, setGoalDeadlineEditing] = useState(null);
  const[goalDeadlineInput, setGoalDeadlineInput] = useState('');
  
  const [isLoaded, setIsLoaded] = useState(false);

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
          if (d.lifeGoals) setLifeGoals(normalizeLifeGoals(d.lifeGoals, buildDefaultLifeGoals()));
        }
      } catch (err) {
        console.error("Failed to load dashboard from DB:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchDB();
  }, []);

  const[now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  const syncTimeoutRef = useRef(null);
  useEffect(() => {
    if (!isLoaded) return;
    const state = { dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog, lifeGoals };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try { await api.training.updateDashboardState(state); } catch (err) {}
    }, 2000);
  },[isLoaded, dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog, lifeGoals]);

  const todayKey = toDateKey(now);
  const todayTaskLog = dailyTaskLogs[todayKey] || {};
  const todayPrayerLog = prayerLogs[todayKey] || {};

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0);
  const prayerDone = PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0);
  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, quickTasks, lifeGoals),[projects, top3Manual, quickTasks, lifeGoals]);
  const top3DoneCount = top3Resolved.filter((s) => s && !s.missing && s.done).length;

  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;

  useEffect(() => {
    if(setStats) setStats({ doneFocusItems, totalFocusItems });
  }, [doneFocusItems, totalFocusItems, setStats]);

  // Actions
  const toggleDailyTask = (id, val) => setDailyTaskLogs(p => ({ ...p, [todayKey]: { ...p[todayKey], [id]: val } }));
  const toggleHabitLock = (id) => setDailyTaskTemplates(p => p.map(t => t.id === id ? { ...t, locked: !t.locked } : t));
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
    setQuickTasks(p => {
      const next = p.map(t => t.id === id ? { ...t, done: val } : t);
      const updatedTask = next.find(t => t.id === id);
      if (updatedTask?.lifeGoalId) updateGoal(updatedTask.lifeGoalId, g => ({ ...g, done: val }));
      return next;
    });
  };
  const removeQuickTask = (id) => {
    setQuickTasks(p => p.filter(t => t.id !== id && t.parentId !== id));
    setTop3Manual(prev => prev.map(s => (s && s.quickTaskId === id) ? null : s));
  };
  const addQuickTask = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const title = quickTaskDraft.trim();
      if (title) { setQuickTasks(p =>[...p, { id: uid('quick'), title, done: false }]); setQuickTaskDraft(''); }
    }
  };
  const updateQuickTask = (id, updater) => setQuickTasks(p => p.map(t => t.id === id ? updater(t) : t));

  const createProject = () => setProjects(p =>[{ id: uid('project'), title: 'New Project', active: true, tasks: [] }, ...p]);
  const deleteProject = (projectId) => {
    setProjects(p => p.filter(x => x.id !== projectId));
    setTop3Manual(prev => prev.map(s => (s && s.projectId === projectId) ? null : s));
  };
  const updateProject = (id, updater) => setProjects(p => p.map(x => x.id === id ? updater(x) : x));
  const toggleProjectTask = (projectId, taskId, val) => {
    updateProject(projectId, p => {
      const nextTasks = updateNodeInTree(p.tasks, taskId, n => ({ ...n, done: val }));
      if (p.lifeGoalId) updateGoal(p.lifeGoalId, g => ({ ...g, tasks: updateNodeInTree(g.tasks, taskId, n => ({ ...n, done: val })) }));
      return { ...p, tasks: nextTasks };
    });
  };

  const setTop3SlotAtIndex = (toIndex, entry) => {
    const sameEntry = (a, b) => {
      if (!a || !b) return false;
      if (a.quickTaskId && b.quickTaskId) return a.quickTaskId === b.quickTaskId;
      return a.projectId === b.projectId && a.taskId === b.taskId;
    };
    setTop3Manual(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) if (i !== toIndex && sameEntry(next[i], entry)) next[i] = null;
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
  const removeFromTop3 = (idx) => setTop3Manual(prev => { const n = [...prev]; n[idx] = null; return n; });
  const toggleTop3Slot = (slot) => {
    if (!slot || slot.missing) return;
    if (slot.isQuick) toggleQuickTask(slot.quickTaskId, !slot.done);
    else toggleProjectTask(slot.projectId, slot.taskId, !slot.done);
  };

  // Life Goals Helpers
  const updateLifeGoals = (updater) => setLifeGoals(prev => ({ ...typeof updater === 'function' ? updater(prev) : updater }));
  const updateGoal = (goalId, updater) => updateLifeGoals(prev => ({ ...prev, tiers: prev.tiers.map(tier => ({ ...tier, goals: tier.goals.map(goal => goal.id === goalId ? updater(goal) : goal) })) }));
  const deleteGoal = (goalId) => updateLifeGoals(prev => ({ ...prev, tiers: prev.tiers.map(tier => ({ ...tier, goals: tier.goals.filter(goal => goal.id !== goalId) })) }));
  const toggleTierCollapse = (tierId) => updateLifeGoals(prev => ({ ...prev, tiers: prev.tiers.map(tier => tier.id === tierId ? { ...tier, collapsed: !tier.collapsed } : tier) }));
  const addGoalToTier = (tierId, title, category = 'General', type = 'quick') => {
    const newGoal = { id: uid('goal'), title, category, type, done: false, deadline: null, tasks:[] };
    updateLifeGoals(prev => ({ ...prev, tiers: prev.tiers.map(tier => tier.id === tierId ? { ...tier, goals: [...tier.goals, newGoal] } : tier) }));
  };

  if (!isLoaded) return <div className="bg-[#0a0a0f] min-h-screen"></div>;

  return (
    <>
      <style>{`
        @keyframes checkbox-pop {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-checkbox-pop { animation: checkbox-pop 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.15s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      `}</style>
      
      <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col font-sans antialiased selection:bg-[#6366f1]/30">
        
        {/* DESKTOP GRID LAYOUT */}
        <div className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden max-w-[1800px] w-full mx-auto">
          
          {/* COLUMN 1: Habits & Prayers & Pomodoro */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            <PomodoroCompact />

            {/* PRAYERS */}
            <div className={`${CARD_BASE} p-5 flex flex-col gap-4`}>
              <h3 className={`flex items-center gap-2 ${SECTION_TITLE}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> Prayers
              </h3>
              <div className="flex flex-wrap gap-2">
                {PRAYERS.map((prayer) => {
                  const isDone = todayPrayerLog[prayer];
                  return (
                    <button 
                      key={prayer} 
                      onClick={() => togglePrayer(prayer, !isDone)}
                      className={`h-7 px-3.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center justify-center ${
                        isDone 
                          ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                          : 'bg-white/[0.04] text-[#94a3b8] hover:bg-white/[0.08] hover:text-[#f1f5f9] border border-white/[0.06]'
                      }`}
                    >
                      {prayer}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HABITS */}
            <div className={`${CARD_BASE} p-5 flex flex-col gap-4 flex-1 min-h-0`}>
              <div className="flex justify-between items-center shrink-0">
                <h3 className={`flex items-center gap-2 ${SECTION_TITLE} !text-[#6366f1]`}>
                  <Icons.Flame className="w-3.5 h-3.5" /> Habits
                </h3>
                <span className="text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20 px-2 py-0.5 rounded-full">
                  {todayDone}/{activeHabits.length}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <input
                  value={habitDraft}
                  onChange={(e) => setHabitDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } } }}
                  placeholder="New habit..."
                  className="bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-[#f1f5f9] outline-none focus:ring-1 focus:ring-[#6366f1]/50 focus:border-[#6366f1] transition-all flex-1 min-w-0"
                />
                <button onClick={() => { const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } }} className="bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-[#f1f5f9] border border-white/[0.06] w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150">
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-1 pr-1">
                {dailyTaskTemplates.map(task => {
                  const isLocked = task.locked;
                  const isDone = todayTaskLog[task.id];
                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center h-8 gap-3 px-2 rounded-lg transition-all duration-150 ${isLocked ? 'opacity-40 cursor-default' : 'cursor-pointer hover:bg-white/[0.04]'} ${isDone && !isLocked ? 'opacity-50' : ''}`}
                      onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)}
                    >
                      {isLocked ? <Icons.Lock className="w-4 h-4 text-[#475569] shrink-0" /> : <TaskCheckbox done={isDone} />}
                      <span className={`text-sm font-medium flex-1 truncate transition-colors duration-150 ${isDone ? 'line-through text-[#475569]' : 'text-[#e2e8f0]'}`}>{task.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleHabitLock(task.id); }} className={`p-1 rounded hover:bg-white/[0.06] transition-colors duration-150 ${isLocked ? 'text-[#f59e0b]' : 'text-[#94a3b8] hover:text-[#f59e0b]'}`}>
                          <Icons.Lock className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeDailyTask(task.id); }} className="p-1 rounded hover:bg-white/[0.06] text-[#94a3b8] hover:text-[#f87171] transition-colors duration-150">
                          <Icons.X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Top 3, Quick Tasks, Life Goals */}
          <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            
            {/* TOP 3 */}
            <div className={`${CARD_BASE} p-5 flex flex-col shrink-0`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`flex items-center gap-2 ${SECTION_TITLE} !text-[#f59e0b]`}>
                  <Icons.Target className="w-3.5 h-3.5" /> Top 3 Focus
                </h3>
                <span className="text-[10px] font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 px-2 py-0.5 rounded-full">{top3DoneCount}/3</span>
              </div>
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((idx) => {
                  const slot = top3Resolved[idx];
                  const filled = slot && !slot.missing;
                  return (
                    <div
                      key={idx}
                      data-slot-index={idx}
                      draggable={filled}
                      onDragStart={filled ? (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; } : undefined}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#f59e0b]'); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('border-[#f59e0b]')}
                      onDrop={(e) => {
                        e.preventDefault(); e.currentTarget.classList.remove('border-[#f59e0b]');
                        const toIndex = Number(e.currentTarget.dataset.slotIndex);
                        try {
                          const raw = e.dataTransfer.getData('application/json');
                          if (!raw) return;
                          const payload = JSON.parse(raw);
                          if (payload.type === 'top3') reorderTop3(payload.fromIndex, toIndex);
                          else if (payload.type === 'project') setTop3SlotAtIndex(toIndex, { projectId: payload.projectId, taskId: payload.taskId });
                          else if (payload.type === 'quick') setTop3SlotAtIndex(toIndex, { quickTaskId: payload.quickTaskId });
                        } catch (_) {}
                      }}
                      className={`relative overflow-hidden h-[4.5rem] rounded-xl border flex items-center transition-all duration-150 ${filled ? 'bg-[#111118] border-white/[0.06] hover:border-white/[0.1] cursor-grab active:cursor-grabbing' : 'border-dashed border-white/[0.06] bg-transparent'}`}
                    >
                      <span className="absolute -right-2 -bottom-4 text-[5rem] font-black text-white/[0.04] pointer-events-none select-none leading-none z-0">{idx + 1}</span>
                      {filled ? (
                        <>
                          <div onClick={() => toggleTop3Slot(slot)} className="relative z-10 flex items-center gap-3 pl-4 w-full cursor-pointer">
                            <TaskCheckbox done={slot.done} />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className={`text-sm font-semibold truncate transition-colors duration-150 ${slot.done ? 'text-[#475569] line-through' : 'text-[#f1f5f9]'}`}>{slot.title}</span>
                              <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-widest mt-0.5 truncate">{slot.projectTitle}</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeFromTop3(idx); }} className="relative z-10 p-3 text-[#475569] hover:text-[#f87171] transition-colors duration-150">
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="relative z-10 pl-4 text-xs font-semibold text-[#475569] uppercase tracking-widest">Drop Task Here</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK TASKS */}
            <div className={`${CARD_BASE} p-5 flex flex-col shrink-0 max-h-72`}>
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex items-center gap-2 ${SECTION_TITLE} !text-[#f43f5e]`}>
                  <Icons.CheckCircle className="w-3.5 h-3.5" /> Quick Tasks
                </div>
                <span className="text-[10px] font-bold text-[#f43f5e] bg-[#f43f5e]/10 border border-[#f43f5e]/20 px-2 py-0.5 rounded-full">{quickTasks.filter(t => !t.parentId && t.done).length}/{quickTasks.filter(t => !t.parentId).length}</span>
              </div>
              <div className="relative mb-3">
                <input 
                  type="text" 
                  value={quickTaskDraft}
                  onChange={(e) => setQuickTaskDraft(e.target.value)}
                  onKeyDown={addQuickTask}
                  placeholder="Add quick task... (Enter)" 
                  className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] outline-none focus:ring-1 focus:ring-[#f43f5e]/50 focus:border-[#f43f5e] transition-all placeholder:text-[#475569]"
                />
              </div>
              <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence initial={false}>
                  {quickTasks.filter(t => !t.parentId).map((task, idx) => (
                    <motion.div 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; }}
                      className="group flex items-center gap-3 h-8 px-2 rounded-lg hover:bg-white/[0.04] cursor-grab active:cursor-grabbing transition-colors duration-150"
                    >
                      <TaskCheckbox done={task.done} onClick={() => toggleQuickTask(task.id, !task.done)} />
                      <div className="flex-1 min-w-0" onClick={() => toggleQuickTask(task.id, !task.done)}>
                        <span className={`text-sm truncate block transition-colors duration-150 ${task.done ? 'text-[#475569] line-through' : 'text-[#f1f5f9]'}`}>{task.title}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button onClick={() => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id }); }} className="p-1 text-[#475569] hover:text-[#f59e0b] rounded transition-colors"><Icons.Target className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeQuickTask(task.id)} className="p-1 text-[#475569] hover:text-[#f87171] rounded transition-colors"><Icons.X className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {quickTasks.filter(t => !t.parentId).length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-xs text-[#475569] font-medium">Nessuna task veloce</p>
                  </div>
                )}
              </div>
            </div>

            {/* LIFE GOALS */}
            <div className={`${CARD_BASE} p-5 flex flex-col flex-1 min-h-0`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`flex items-center gap-2 ${SECTION_TITLE} !text-[#f1f5f9]`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Life Goals
                </h3>
              </div>
              <div className="overflow-y-auto custom-scrollbar pr-1 space-y-3">
                {lifeGoals.tiers.map(tier => {
                  const completed = tier.goals.filter(g => g.done).length;
                  const total = tier.goals.length;
                  const tierColor = { 'tier-1': 'bg-[#10b981]', 'tier-2': 'bg-[#0ea5e9]', 'tier-3': 'bg-[#8b5cf6]', 'tier-4': 'bg-[#f59e0b]', 'tier-5': 'bg-[#f43f5e]' }[tier.id] || 'bg-white';
                  
                  return (
                    <div key={tier.id} className="relative flex flex-col rounded-xl border border-white/[0.06] bg-[#111118] overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${tierColor} opacity-80`} />
                      <div 
                        className="flex items-center justify-between p-3 pl-4 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150"
                        onClick={() => toggleTierCollapse(tier.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{tier.emoji}</span>
                          <span className="text-sm font-semibold text-[#f1f5f9]">{tier.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/[0.06] text-[#94a3b8]">{completed}/{total}</span>
                        </div>
                        <Icons.ChevronDown className={`w-4 h-4 text-[#475569] transition-transform duration-200 ${tier.collapsed ? '' : 'rotate-180'}`} />
                      </div>
                      
                      {!tier.collapsed && (
                        <div className="p-3 pt-0 pl-4 grid grid-cols-1 gap-2">
                          {tier.goals.map(goal => (
                            <LifeGoalCard 
                              key={goal.id} goal={goal} accent={tier.color} stats={{}} percentage={0}
                              onToggle={(gid, val) => updateGoal(gid, g => ({ ...g, done: val }))}
                              onDelete={deleteGoal}
                              onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val }))}
                              onAddToTop3={(gid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: `lg-${gid}`, taskId: gid }); }}
                              hasFreeTop3Slot={top3Manual.some(s => !s)}
                              renderTasks={() => null}
                            />
                          ))}
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }} className="text-[10px] uppercase tracking-widest font-bold text-[#94a3b8] hover:text-[#f1f5f9] px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md transition-colors">+ Quick</button>
                            <button onClick={() => { const title = window.prompt("Project goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }} className="text-[10px] uppercase tracking-widest font-bold text-[#94a3b8] hover:text-[#f1f5f9] px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md transition-colors">+ Project</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* COLUMN 3: Heatmap, Projects */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
            
            <div className="flex justify-between items-center shrink-0">
              <h2 className={`flex items-center gap-2 ${SECTION_TITLE}`}>
                <Icons.Square className="w-3.5 h-3.5" /> Projects
              </h2>
              <button onClick={createProject} className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.06] text-[#f1f5f9] hover:bg-white/[0.1] transition-colors">
                <Icons.Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 flex-1 min-h-0">
              {projects.map((project, idx) => {
                const stats = countTreeStats(project.tasks);
                const percentage = Math.round(stats.ratio * 100);
                const accent =['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'][idx % 6];
                
                return (
                  <StandardProjectCard
                    key={project.id}
                    project={project}
                    stats={stats}
                    percentage={percentage}
                    accent={accent}
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
                        {project.tasks?.map((node) => (
                          <DenseTaskNode
                            key={node.id} node={node} depth={0} projectId={project.id} projectAccent={accent}
                            onToggle={(tid, val) => toggleProjectTask(project.id, tid, val)}
                            onDelete={(tid) => updateProject(project.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }))}
                            onRename={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                            onDeadline={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                            onAddChild={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children||[]), createTaskNode(val)] })) }))}
                            onAddToTop3={(pid, tid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid }); }}
                            hasFreeTop3Slot={top3Manual.some(s => !s)}
                          />
                        ))}
                        <div className="pt-2 px-1">
                          <input 
                            value={projectTaskDrafts[project.id] ?? ''}
                            onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [project.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const title = (projectTaskDrafts[project.id] ?? '').trim();
                                if (title) {
                                  updateProject(project.id, p => ({ ...p, tasks:[...(p.tasks||[]), createTaskNode(title)] }));
                                  setProjectTaskDrafts(prev => ({ ...prev, [project.id]: '' }));
                                }
                              }
                            }}
                            placeholder="Add task..."
                            className="w-full bg-transparent border-none text-sm outline-none text-[#f1f5f9] placeholder:text-[#475569]"
                          />
                        </div>
                      </>
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}