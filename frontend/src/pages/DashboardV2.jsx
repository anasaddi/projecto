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
  CheckCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Circle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /></svg>,
  Plus: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  X: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Clock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Target: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Flame: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  Lock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Play: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  Pause: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>,
  Square: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>,
  ChevronDown: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9" /></svg>,
  ChevronUp: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15" /></svg>,
  ChevronRight: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>,
  Calendar: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  ExternalLink: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 22 3 22 9" /><line x1="10" y1="14" x2="22" y2="3" /></svg>,
  MessageCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  MoreHorizontal: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
  Check: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>,
};

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
      className={`task-checkbox shrink-0 ${done ? 'checked' : ''} ${bump ? 'checkbox-bump' : ''} ${className}`}
    >
      {done && <Icons.Check className="h-2.5 w-2.5" />}
    </button>
  );
}

/**
 * KebabMenu — dropdown minimale con azioni contestuali
 */
function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
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
        className="dashboard-action-btn opacity-0 group-hover:opacity-100"
        title="Azioni"
      >
        <Icons.MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] animate-slide-down rounded-lg border border-zinc-200/80 bg-white py-1 shadow-lg shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-800 dark:shadow-black/40">
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-zinc-100 dark:border-white/5" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(e); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${item.danger
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'
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
const BC_CHANNEL = 'km-dashboard-v2-sync';
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

function buildDefaultLifeGoals() {
  const mkG = (title, category, type = 'quick', done = false) => ({
    id: uid('goal'), title, category, type, done, deadline: null, tasks: []
  });
  return {
    collapsed: false,
    tiers: [
      {
        id: 'tier-1', name: 'Tier 1', emoji: '🎯', color: 'emerald', collapsed: false,
        goals: [
          mkG('Eliminare ogni addiction', 'Disciplina', 'project'),
          mkG('Completare KM Personal', 'Conoscenza', 'project'),
          mkG('Pagare tutti i debiti', 'Finanza', 'project'),
          mkG('Raggiungere 66kg', 'Corpo', 'quick'),
          mkG('Test DNA privato (origini)', 'Identità', 'quick'),
          mkG('Esperienza di deprivazione sensoriale', 'Esperienze', 'quick'),
          mkG('Imparare il salto mortale', 'Corpo', 'quick'),
          mkG('Smettere con qualsiasi addiction', 'Disciplina', 'quick'),
        ]
      },
      {
        id: 'tier-2', name: 'Tier 2', emoji: '📈', color: 'sky', collapsed: true,
        goals: [
          mkG('Correre una maratona', 'Corpo', 'project'),
          mkG('Ottenere il brevetto da pilota', 'Abilità', 'project'),
          mkG('Iniziare memorizzazione del Corano (Hafiz)', 'Spiritualità', 'project'),
          mkG('1 settimana senza luce artificiale', 'Disciplina', 'quick'),
          mkG('Vacanza con i genitori', 'Famiglia', 'quick'),
          mkG('Hajj con i genitori', 'Spiritualità', 'quick'),
          mkG('Trovare un mentor per ogni area della vita', 'Crescita', 'quick'),
          mkG('Leggere tutti i libri salvati', 'Conoscenza', 'quick'),
        ]
      },
      {
        id: 'tier-3', name: 'Tier 3', emoji: '⚡', color: 'violet', collapsed: true,
        goals: [
          mkG('Diventare milionario', 'Finanza', 'quick'),
          mkG('Pagare il mutuo della casa', 'Finanza', 'quick'),
          mkG('Uno stipendio mensile ai genitori', 'Famiglia', 'quick'),
          mkG('Imparare 5 nuove lingue', 'Conoscenza', 'project'),
          mkG('Completare Quran Hafiz', 'Spiritualità', 'project'),
          mkG('Costruire la dream house', 'Patrimonio', 'project'),
          mkG('Padroneggiare i viaggi astrali', 'Spiritualità', 'project'),
        ]
      },
      {
        id: 'tier-4', name: 'Tier 4', emoji: '👑', color: 'amber', collapsed: true,
        goals: [
          mkG('Diventare miliardario', 'Finanza', 'quick'),
          mkG('Costruire una moschea', 'Legacy', 'project'),
          mkG('Nuotare in tutti gli oceani', 'Avventura', 'quick'),
          mkG('Visitare tutti i paesi del mondo', 'Avventura', 'quick'),
          mkG('Comprare una squadra di calcio', 'Patrimonio', 'quick'),
          mkG('Creare una nuova lingua ottimizzata', 'Conoscenza', 'project'),
          mkG('Vivere in un luogo con tutti gli ecosistemi', 'Patrimonio', 'quick'),
          mkG('1 anno di silenzio totale', 'Disciplina', 'quick'),
        ]
      },
      {
        id: 'tier-5', name: 'Tier 5', emoji: '🚀', color: 'rose', collapsed: true,
        goals: [
          mkG('Comprare un\'isola privata', 'Patrimonio', 'quick'),
          mkG('Andare nello spazio', 'Avventura', 'quick'),
        ]
      },
    ]
  };
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
    lifeGoals: buildDefaultLifeGoals(),
  };
}

function normalizeLifeGoals(lg, fallback) {
  // Se non ci sono tiers o goals, usa il fallback completo
  if (!lg || !Array.isArray(lg.tiers) || lg.tiers.length === 0) return fallback;

  const projectTitles = [
    'Eliminare ogni addiction', 'Completare KM Personal', 'Pagare tutti i debiti',
    'Correre una maratona', 'Ottenere il brevetto da pilota', 'Iniziare memorizzazione del Corano (Hafiz)',
    'Imparare 5 nuove lingue', 'Completare Quran Hafiz', 'Costruire la dream house',
    'Padroneggiare i viaggi astrali', 'Costruire una moschea', 'Creare una nuova lingua ottimizzata'
  ];

  // Nuovi nomi e emoji per i tier
  const tierMeta = {
    'tier-1': { name: 'Tier 1', emoji: '🎯' },
    'tier-2': { name: 'Tier 2', emoji: '📈' },
    'tier-3': { name: 'Tier 3', emoji: '⚡' },
    'tier-4': { name: 'Tier 4', emoji: '👑' },
    'tier-5': { name: 'Tier 5', emoji: '🚀' },
  };

  return {
    ...lg,
    tiers: lg.tiers.map(t => {
      // Recupera il tier corrispondente dal fallback per assicurarci di avere gli obiettivi originali se il tier è vuoto
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
          // Forza il tipo se è un progetto noto, altrimenti mantieni l'esistente o deduci
          let targetType = g.type;
          if (isKnownProject) targetType = 'project';
          else if (!targetType) targetType = (Array.isArray(g.tasks) && g.tasks.length > 0) ? 'project' : 'quick';

          return {
            ...g,
            type: targetType,
            tasks: Array.isArray(g.tasks) ? g.tasks : []
          };
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
  // 1. Check Standard Projects
  const project = projects.find((p) => p.id === projectId);
  if (project) {
    let found = null;
    function walk(nodes) {
      for (const n of nodes || []) {
        if (n.id === taskId) { found = { node: n, projectTitle: project.title }; return; }
        if (Array.isArray(n.children) && n.children.length) walk(n.children);
      }
    }
    walk(project.tasks);
    if (found) return found;
  }

  // 2. Check Life Goals (Projects or Quick)
  if (lifeGoals && lifeGoals.tiers) {
    for (const tier of lifeGoals.tiers) {
      // Check Project Life Goals
      const lgProj = tier.goals?.find(g => g.id === projectId || `lg-${g.id}` === projectId);
      if (lgProj) {
        let found = null;
        // Se il taskId coincide col projectId, è un Quick Goal pinnato direttamente
        if (lgProj.id === taskId) return { node: lgProj, projectTitle: `LG: ${tier.name}` };

        // Altrimenti cerca nelle subtask
        function walkLG(nodes) {
          for (const n of nodes || []) {
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

function resolveTop3Slots(projects, top3Manual, quickTasks = [], lifeGoals = null) {
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
    } catch (_) { }
  }, [todayKey]);

  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setStatus('idle');
          setSessionsToday((s) => {
            const next = s + 1;
            try { localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ date: todayKey, sessions: next })); } catch (_) { }
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
    <div className="dashboard-panel p-5 flex flex-col gap-2 relative overflow-hidden select-none">
      <div className="flex justify-between items-center z-10">
        <h3 className="flex items-center gap-1.5 dashboard-section-title text-indigo-500 dark:text-indigo-400">
          <Icons.Clock className="w-3.5 h-3.5" /> Focus
        </h3>
        <div className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
          {sessionsToday} sess
        </div>
      </div>

      <div className="flex items-center justify-between z-10 mt-2">
        <div className="text-4xl font-black tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          {status === 'idle' && (
            <button onClick={() => { setStatus('running'); setRemaining(POMODORO_DURATION); }} className="bg-indigo-600 hover:bg-indigo-500 text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.25)] dark:shadow-[0_0_16px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
              <Icons.Play className="w-4 h-4 fill-current" />
            </button>
          )}
          {status === 'running' && (
            <button onClick={() => setStatus('paused')} className="bg-amber-500 hover:bg-amber-400 text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.3)] dark:shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 transition-all">
              <Icons.Pause className="w-4 h-4 fill-current" />
            </button>
          )}
          {status === 'paused' && (
            <>
              <button onClick={() => setStatus('running')} className="bg-indigo-600 hover:bg-indigo-500 text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.25)] dark:shadow-[0_0_16px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
                <Icons.Play className="w-4 h-4 fill-current" />
              </button>
              <button onClick={() => { setStatus('idle'); setRemaining(POMODORO_DURATION); }} className="bg-zinc-200 dark:bg-white/[0.06] hover:bg-zinc-300 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-100 w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all border border-zinc-200 dark:border-white/[0.06]">
                <Icons.Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-[3px] w-full bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden mt-4">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
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
    if (score >= 0.65) return 'bg-emerald-500 dark:bg-emerald-400';
    if (score >= 0.4) return 'bg-amber-400 dark:bg-amber-500';
    if (score > 0) return 'bg-amber-200 dark:bg-amber-500/40';
    return 'bg-zinc-100 dark:bg-white/[0.04]';
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
    <div className="dashboard-panel p-5 flex flex-col gap-4 select-none">
      <div className="flex justify-between items-center">
        <h3 className="flex items-center gap-1.5 dashboard-section-title text-emerald-500 dark:text-emerald-400">
          <Icons.Flame className="w-3.5 h-3.5" /> Ultimi 30 giorni
        </h3>
        {streak > 0 && (
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {streak}d streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-10 gap-2">
        {heatmapDays.map(({ key, score, isToday }) => (
          <div
            key={key}
            title={`${Math.round(score * 100)}% · ${key}`}
            className={`w-5 h-5 rounded-md ${getColor(score)} ${isToday ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-white dark:ring-offset-[#161920]' : ''} transition-colors`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-[9px] text-zinc-500 dark:text-zinc-400">
        <span>Meno</span>
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-white/[0.04]" title="0%" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-200 dark:bg-amber-500/40" title="&gt;0%" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-400 dark:bg-amber-500" title="≥40%" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-400" title="≥65%" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-500" title="≥90%" />
        </div>
        <span>Più</span>
      </div>
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
    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
      <span className="text-zinc-500">Week: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(weekAvg * 100)}%</strong></span>
      <span className="text-zinc-500">Month: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(monthAvg * 100)}%</strong></span>
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
    <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider">This week</span>
        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tabular-nums">{weekPct}%</span>
      </div>
      <div className="flex gap-0.5 mb-1.5">
        {weekDays.map(({ key, label, pct, isToday }) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-[2px] overflow-hidden" title={`${Math.round(pct * 100)}%`}>
              <div className={`h-full transition-all ${pct >= 0.8 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: `${pct * 100}%` }} />
            </div>
            <span className={`text-[8px] font-medium ${isToday ? 'text-sky-500 dark:text-sky-400 font-bold' : 'text-zinc-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-zinc-400 italic">{quote}</p>
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
      className="group/task flex flex-col w-full"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-zinc-50'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-zinc-50'); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-zinc-50');
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload.type === 'project-task' && payload.projectId === projectId && payload.parentId === parentId) {
            onMove(payload.taskId);
          }
        } catch (_) { }
      }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        className="group/row task-row cursor-grab active:cursor-grabbing"
      >
        {/* Expand Toggle */}
        <div className="flex h-4 w-3 shrink-0 items-center justify-center">
          {hasChildren ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
              {expanded ? <Icons.ChevronDown className="h-3 w-3" /> : <Icons.ChevronRight className="h-3 w-3" />}
            </button>
          ) : <span className="h-3 w-3" />}
        </div>

        {/* Checkbox universale */}
        <TaskCheckbox done={node.done} onClick={() => onToggle(node.id, !node.done)} />

        {/* Title - seamless editing */}
        <div className="flex flex-1 min-w-0 items-center gap-2" onClick={() => !editing && onToggle(node.id, !node.done)}>
          {editing ? (
            <input
              autoFocus
              defaultValue={node.title}
              onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
              onClick={(e) => e.stopPropagation()}
              className="seamless-input text-sm text-zinc-800 dark:text-zinc-100"
            />
          ) : (
            <span
              onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className={`cursor-pointer select-text text-sm leading-none transition-colors ${node.done ? 'text-zinc-400 line-through decoration-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}
            >
              {node.title}
            </span>
          )}

          {/* Deadline badge inline */}
          {onDeadline && node.deadline && !showDeadline && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeadlineInput(node.deadline || ''); setShowDeadline(true); }}
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${getDeadlineColorClass(node.deadline, node.done)}`}
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') { setShowDeadline(false); } }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="dashboard-input w-28 py-0.5 text-xs"
            />
          )}
        </div>

        {/* Actions — visibili al hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onDeadline && !node.deadline && !showDeadline && (
            <button type="button" onClick={() => { setDeadlineInput(''); setShowDeadline(true); }} className="dashboard-action-btn p-1 hover:text-amber-500" title="Scadenza">
              <Icons.Calendar className="h-3 w-3" />
            </button>
          )}
          {canAddChild && (
            <button type="button" onClick={() => setOpenAdd(!openAdd)} className="dashboard-action-btn p-1 hover:text-indigo-500" title="Subtask">
              <Icons.Plus className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => hasFreeTop3Slot && onAddToTop3(projectId, node.id)}
            disabled={!hasFreeTop3Slot}
            className={`dashboard-action-btn p-1 ${hasFreeTop3Slot ? 'hover:text-amber-500' : 'opacity-30 cursor-not-allowed'}`}
            title={hasFreeTop3Slot ? 'Top 3' : 'Top 3 pieni'}
          >
            <Icons.Target className="h-3 w-3" />
          </button>
          <button type="button" onClick={() => onDelete(node.id)} className="dashboard-action-btn p-1 hover:text-red-500" title="Elimina">
            <Icons.X className="h-3 w-3" />
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
            className="dashboard-input flex-1 py-1 text-sm"
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div className={`ml-4 pl-3 border-l border-zinc-200 dark:border-zinc-700/60 flex flex-col`}>
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

// 3. Standardized Project Card — collapsible by default
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
  const [expanded, setExpanded] = useState(false);
  const accentBar = { indigo: 'bg-indigo-500', sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-zinc-400';
  const accentText = { indigo: 'text-indigo-600 dark:text-indigo-400', sky: 'text-sky-600 dark:text-sky-400', violet: 'text-violet-600 dark:text-violet-400', emerald: 'text-emerald-600 dark:text-emerald-400', amber: 'text-amber-600 dark:text-amber-400', rose: 'text-rose-600 dark:text-rose-400' }[accent] || 'text-zinc-500';

  const menuItems = [
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }
    },
    ...(isShared ? [] : []),
    'divider',
    { label: 'Elimina progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(project.id) }
  ];

  return (
    <div className="dashboard-panel group/proj flex flex-col overflow-hidden transition-all">
      {/* Header — stile dashboard3 */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors duration-150"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Accent stripe con shadow */}
        <div className={`h-5 w-1 shrink-0 rounded-full ${accentBar} shadow-[0_0_8px_rgba(0,0,0,0.08)] dark:shadow-[0_0_8px_rgba(255,255,255,0.06)]`} />

        {/* Title */}
        <input
          value={project.title}
          onChange={(e) => { e.stopPropagation(); onTitleChange(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="seamless-input flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100"
        />

        {/* Stats */}
        <div className="flex shrink-0 items-center gap-3">
          {project.deadline && projectDeadlineEditing !== project.id && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 dark:border-white/[0.04] transition-colors ${getDeadlineColorClass(project.deadline, false)}`}
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
              className="dashboard-input w-28 py-0.5 text-xs"
            />
          )}

          {/* Progress bar h-[3px] stile dashboard3 */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.06]">
              <div className={`h-full ${accentBar} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="w-8 text-right text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400">{percentage}%</span>
          </div>

          {isShared && (
            <Link to={`/shared/${shareId}`} onClick={(e) => e.stopPropagation()} className="dashboard-action-btn" title="Apri condivisa">
              <Icons.ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <KebabMenu items={menuItems} />
          </div>

          <Icons.ChevronDown className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Tasks — espandibili */}
      {expanded && (
        <div className="animate-slide-down border-t border-zinc-100 dark:border-white/[0.06] p-4 pt-3 flex flex-col gap-1">
          {renderTasks()}
        </div>
      )}
    </div>
  );
}

// 4. Life Goals Components
function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onAddToTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick
}) {
  const accentBar = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-violet-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-indigo-500';
  const accentText = { emerald: 'text-emerald-600', sky: 'text-sky-600', violet: 'text-violet-600', amber: 'text-amber-600', rose: 'text-rose-600' }[accent] || 'text-indigo-600';
  const accentBg = { emerald: 'bg-emerald-500/10', sky: 'bg-sky-500/10', violet: 'bg-violet-500/10', amber: 'bg-amber-500/10', rose: 'bg-rose-500/10' }[accent] || 'bg-indigo-500/10';
  const [showTasks, setShowTasks] = useState(false);
  const isProject = goal.type === 'project';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group/goal relative flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
    >
      {/* Accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accentBar}`} />

      <div className="flex items-center gap-2 pl-3 pr-2 py-2 cursor-grab active:cursor-grabbing">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(goal.id, !goal.done)}
          className={`shrink-0 rounded p-0.5 transition-colors ${goal.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-transparent hover:bg-gray-300 dark:bg-gray-700'}`}
        >
          <Icons.CheckCircle className="h-3.5 w-3.5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <input
            value={goal.title}
            onChange={(e) => onRename(goal.id, e.target.value)}
            className={`w-full bg-transparent text-xs font-medium outline-none ${goal.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
          />
          {isProject && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full ${accentBar}`} style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-[9px] text-gray-400">{percentage}%</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/goal:opacity-100 transition-opacity">
          {hasFreeTop3Slot && (
            <button onClick={() => onAddToTop3(goal.id)} className="rounded p-1 text-gray-400 hover:text-amber-500" title="Top 3">
              <Icons.Target className="h-3 w-3" />
            </button>
          )}

          {isProject ? (
            <button onClick={() => onPromoteProject(goal.id)} className={`rounded p-1 ${isLinkedToProject ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'}`} title="Projects">
              <Icons.Play className="h-3 w-3" />
            </button>
          ) : (
            <button onClick={() => onPromoteQuick(goal.id)} className={`rounded p-1 ${isLinkedToQuick ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`} title="Quick">
              <Icons.Play className="h-3 w-3" />
            </button>
          )}

          {isProject && (
            <button onClick={() => setShowTasks(!showTasks)} className={`rounded p-1 ${showTasks ? accentText : 'text-gray-400'}`}>
              <Icons.ChevronDown className={`h-3 w-3 transition-transform ${showTasks ? 'rotate-180' : ''}`} />
            </button>
          )}

          {deadlineEditing === goal.id ? (
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              onBlur={() => onDeadlineClick(goal.id, deadlineInput)}
              autoFocus
              className="w-20 text-[9px]"
            />
          ) : goal.deadline ? (
            <button onClick={() => { setDeadlineInput(goal.deadline); setDeadlineEditing(goal.id); }} className={`rounded px-1.5 py-0.5 text-[8px] ${getDeadlineColorClass(goal.deadline, false)}`}>
              {formatDeadline(goal.deadline)}
            </button>
          ) : (
            <button onClick={() => { setDeadlineInput(''); setDeadlineEditing(goal.id); }} className="rounded p-1 text-gray-400 hover:text-amber-500">
              <Icons.Calendar className="h-3 w-3" />
            </button>
          )}

          <button onClick={() => onDelete(goal.id)} className="rounded p-1 text-gray-400 hover:text-red-500">
            <Icons.X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {isProject && showTasks && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-2 py-2 dark:border-white/5 dark:bg-black/20">
          <div className="flex flex-col gap-1">
            {renderTasks()}
          </div>
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
  const initial = useMemo(() => loadState(), []);
  const { setStats } = useDashboardStats() || { setStats: () => { } };

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
  const [lifeGoals, setLifeGoals] = useState(initial.lifeGoals);
  const [goalTaskDrafts, setGoalTaskDrafts] = useState({});
  const [goalDeadlineEditing, setGoalDeadlineEditing] = useState(null);
  const [goalDeadlineInput, setGoalDeadlineInput] = useState('');
  const [sharedDashboards, setSharedDashboards] = useState([]);
  const wsConnections = useRef({}); // { shareId: WebSocket }
  const bcChannels = useRef({}); // { shareId: BroadcastChannel }
  const applyingFromSharedBC = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);

  // Helper: send shared dashboard update via WS + BroadcastChannel + REST fallback
  const sendSharedUpdate = (shareId, title, newData) => {
    const payload = { type: 'sync', title, data: newData };

    // 1. WebSocket (server broadcast)
    const socket = wsConnections.current[shareId];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      // REST fallback
      api.training.updateSharedDashboard(shareId, newData, title).catch(err => {
        console.error('Failed to update shared dashboard (REST):', err);
      });
    }

    // 2. BroadcastChannel (instant cross-tab sync, same browser)
    try {
      const bc = new BroadcastChannel(`km-shared-${shareId}`);
      bc.postMessage(payload);
      bc.close();
    } catch (_) { }
  };

  // WebSocket + BroadcastChannel management for shared dashboards
  useEffect(() => {
    if (!isLoaded || sharedDashboards.length === 0) return;

    const shareIds = sharedDashboards.map(sd => sd.share_id);

    shareIds.forEach(shareId => {
      // --- BroadcastChannel listener (cross-tab sync) ---
      if (!bcChannels.current[shareId]) {
        const bc = new BroadcastChannel(`km-shared-${shareId}`);
        bc.onmessage = (e) => {
          const msg = e?.data;
          if (!msg || applyingFromSharedBC.current) return;
          applyingFromSharedBC.current = true;
          if (msg.type === 'sync' && msg.data) {
            setSharedDashboards(prev => prev.map(item =>
              item.share_id === shareId ? { ...item, data: msg.data, title: msg.title || item.title } : item
            ));
          }
          setTimeout(() => { applyingFromSharedBC.current = false; }, 0);
        };
        bcChannels.current[shareId] = bc;
      }

      // --- WebSocket connection ---
      if (wsConnections.current[shareId]) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const host = isLocal ? 'localhost:8000' : (import.meta.env.VITE_WS_HOST || 'projecto-production-feda.up.railway.app');
      const wsUrl = `${protocol}//${host}/api/training/ws/shared-dashboard/${encodeURIComponent(shareId)}`;

      const socket = new WebSocket(wsUrl);
      wsConnections.current[shareId] = socket;

      const hb = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);

      socket.onopen = () => {
        console.log(`WS Connected for ${shareId}`);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'pong') return;
          if (message.type === 'server_restart') return;
          if (message.type === 'error') return;
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
        clearInterval(hb);
        delete wsConnections.current[shareId];
        setTimeout(() => {
          setSharedDashboards(prev => [...prev]);
        }, 3000);
      };
    });

    return () => {
      // Cleanup WS connections that are no longer needed
      Object.keys(wsConnections.current).forEach(id => {
        if (!shareIds.includes(id)) {
          wsConnections.current[id].close();
          delete wsConnections.current[id];
        }
      });
      // Cleanup BC channels that are no longer needed
      Object.keys(bcChannels.current).forEach(id => {
        if (!shareIds.includes(id)) {
          bcChannels.current[id].close();
          delete bcChannels.current[id];
        }
      });
    };
  }, [isLoaded, sharedDashboards]);

  const refetchSharedDashboards = () => {
    if (sharedDashboards.length === 0) return;
    api.training.listSharedDashboards()
      .then((arr) => {
        const list = Array.isArray(arr) ? arr : (Array.isArray(arr?.data) ? arr.data : []);
        if (list.length > 0) setSharedDashboards(list);
      })
      .catch(() => { });
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoaded) refetchSharedDashboards();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isLoaded]);

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
          if (d.lifeGoals) setLifeGoals(normalizeLifeGoals(d.lifeGoals, buildDefaultLifeGoals()));
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

  // 2. Sync to LocalStorage, DB, BroadcastChannel (sync istantaneo tra tab)
  const syncTimeoutRef = useRef(null);
  const applyingFromBCRef = useRef(false);
  useEffect(() => {
    if (!isLoaded) return;

    const state = { dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog, lifeGoals };
    const skipBroadcast = applyingFromBCRef.current;
    if (applyingFromBCRef.current) applyingFromBCRef.current = false;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) { }

    if (!skipBroadcast) {
      try {
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.postMessage(state);
        bc.close();
      } catch (_) { }
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await api.training.updateDashboardState(state);
      } catch (err) {
        console.error("Failed to sync dashboard to DB:", err);
      }
    }, 500);
  }, [isLoaded, dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog, lifeGoals]);

  // BroadcastChannel listener: ricevi aggiornamenti da altre tab
  useEffect(() => {
    if (!isLoaded) return;
    const bc = new BroadcastChannel(BC_CHANNEL);
    bc.onmessage = (e) => {
      const s = e?.data;
      if (!s || applyingFromBCRef.current) return;
      applyingFromBCRef.current = true;
      if (Array.isArray(s.dailyTaskTemplates)) setDailyTaskTemplates(s.dailyTaskTemplates);
      if (s.dailyTaskLogs && typeof s.dailyTaskLogs === 'object') setDailyTaskLogs(s.dailyTaskLogs);
      if (Array.isArray(s.projects)) setProjects(s.projects);
      if (s.prayerLogs && typeof s.prayerLogs === 'object') setPrayerLogs(s.prayerLogs);
      if (Array.isArray(s.top3Manual)) setTop3Manual(s.top3Manual);
      if (Array.isArray(s.quickTasks)) setQuickTasks(s.quickTasks);
      if (s.dailyCompletionLog && typeof s.dailyCompletionLog === 'object') setDailyCompletionLog(s.dailyCompletionLog);
      if (s.lifeGoals) setLifeGoals(s.lifeGoals);
    };
    return () => bc.close();
  }, [isLoaded]);

  const todayKey = toDateKey(now);
  const todayTaskLog = dailyTaskLogs[todayKey] || {};
  const todayPrayerLog = prayerLogs[todayKey] || {};

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0);
  const prayerDone = PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0);
  const allQuickTasks = useMemo(() => {
    const local = quickTasks.filter(t => !t.parentId).map(t => ({ ...t, shareId: null }));
    const fromShared = sharedDashboards.flatMap(sd => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data || {}).quickTasks : [];
      return list.filter(t => !t.parentId).map(t => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, allQuickTasks, lifeGoals), [projects, top3Manual, allQuickTasks, lifeGoals]);
  const top3DoneCount = top3Resolved.filter((s) => s && !s.missing && s.done).length;

  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;
  const todayFocusScore = totalFocusItems ? doneFocusItems / totalFocusItems : 0;

  const top3LifeGoalSync = useMemo(() => {
    // This force-updates Top3 labels when lifeGoals change
    return lifeGoals;
  }, [lifeGoals]);

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
    if (setStats) setStats({ doneFocusItems, totalFocusItems });
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
    setQuickTasks(p => {
      const next = p.map(t => t.id === id ? { ...t, done: val } : t);
      const updatedTask = next.find(t => t.id === id);
      if (updatedTask?.lifeGoalId) {
        updateGoal(updatedTask.lifeGoalId, g => ({ ...g, done: val }));
      }
      return next;
    });
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
    const currentShared = sharedDashboards.find(sd => sd.share_id === shareId);
    if (!currentShared) return;

    const newData = { ...(currentShared.data || {}) };
    newData.projects = (newData.projects || []).map(p => p.id === projectId ? updater(p) : p);
    const title = currentShared.title;

    setSharedDashboards(prev => prev.map(sd =>
      sd.share_id === shareId ? { ...sd, data: newData } : sd
    ));

    sendSharedUpdate(shareId, title, newData);
  };

  const updateSharedDashboardData = (shareId, updater) => {
    const currentShared = sharedDashboards.find(sd => sd.share_id === shareId);
    if (!currentShared) return;

    const newData = updater({ ...(currentShared.data || {}) });
    const title = currentShared.title;

    setSharedDashboards(prev => prev.map(sd =>
      sd.share_id === shareId ? { ...sd, data: newData } : sd
    ));

    sendSharedUpdate(shareId, title, newData);
  };
  const toggleSharedQuickTask = (shareId, taskId, val) => {
    updateSharedDashboardData(shareId, data => ({
      ...data,
      quickTasks: (data.quickTasks || []).map(t => t.id === taskId ? { ...t, done: val } : t)
    }));
  };
  const removeSharedQuickTask = (shareId, taskId) => {
    setTop3Manual(prev => prev.map(s => (s && s.quickTaskId === taskId) ? null : s));
    updateSharedDashboardData(shareId, data => ({
      ...data,
      quickTasks: (data.quickTasks || []).filter(t => t.id !== taskId && t.parentId !== taskId)
    }));
  };
  const updateSharedQuickTask = (shareId, taskId, updater) => {
    updateSharedDashboardData(shareId, data => ({
      ...data,
      quickTasks: (data.quickTasks || []).map(t => t.id === taskId ? updater(t) : t)
    }));
  };

  const deleteSharedDashboardProject = (shareId, projectId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo progetto condiviso?")) return;

    const currentShared = sharedDashboards.find(sd => sd.share_id === shareId);
    if (!currentShared) return;

    const newData = { ...(currentShared.data || {}) };
    newData.projects = (newData.projects || []).filter(p => p.id !== projectId);
    const title = currentShared.title;

    setSharedDashboards(prev => prev.map(sd =>
      sd.share_id === shareId ? { ...sd, data: newData } : sd
    ));

    sendSharedUpdate(shareId, title, newData);
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

  // ----------------------------------------------------------------------
  // LIFE GOALS HELPERS
  // ----------------------------------------------------------------------
  const updateLifeGoals = (updater) => setLifeGoals(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    return { ...next };
  });

  const updateGoal = (goalId, updater) => {
    updateLifeGoals(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => ({
        ...tier,
        goals: tier.goals.map(goal => goal.id === goalId ? updater(goal) : goal)
      }))
    }));
  };

  const deleteGoal = (goalId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo obiettivo?")) return;
    updateLifeGoals(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => ({
        ...tier,
        goals: tier.goals.filter(goal => goal.id !== goalId)
      }))
    }));
  };

  const moveGoalToTier = (goalId, targetTierId) => {
    updateLifeGoals(prev => {
      let movedGoal = null;
      const nextTiers = prev.tiers.map(tier => {
        const goals = [...tier.goals];
        const idx = goals.findIndex(g => g.id === goalId);
        if (idx !== -1) {
          [movedGoal] = goals.splice(idx, 1);
        }
        return { ...tier, goals };
      });

      if (!movedGoal) return prev;

      return {
        ...prev,
        tiers: nextTiers.map(tier => {
          if (tier.id === targetTierId) {
            return { ...tier, goals: [...tier.goals, movedGoal] };
          }
          return tier;
        })
      };
    });
  };

  const reorderGoalInTier = (tierId, fromIdx, toIdx) => {
    updateLifeGoals(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => {
        if (tier.id !== tierId) return tier;
        const next = [...tier.goals];
        const [removed] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, removed);
        return { ...tier, goals: next };
      })
    }));
  };

  const toggleTierCollapse = (tierId) => {
    updateLifeGoals(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => tier.id === tierId ? { ...tier, collapsed: !tier.collapsed } : tier)
    }));
  };

  const addGoalToTier = (tierId, title, category = 'General', type = 'quick') => {
    const newGoal = { id: uid('goal'), title, category, type, done: false, deadline: null, tasks: [] };
    updateLifeGoals(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier => tier.id === tierId ? { ...tier, goals: [...tier.goals, newGoal] } : tier)
    }));
  };

  const promoteGoalToProjects = (goalId) => {
    if (projects.some((project) => project.lifeGoalId === goalId)) return;
    let goalToLink = null;
    for (const tier of lifeGoals.tiers) {
      const found = tier.goals.find(g => g.id === goalId);
      if (found) { goalToLink = { ...found }; break; }
    }
    if (!goalToLink) return;

    // Crea un progetto collegato (usa l'ID del goal come riferimento)
    setProjects(p => [{
      id: uid('project'),
      lifeGoalId: goalId, // Campo per la sincronizzazione
      title: goalToLink.title,
      active: true,
      tasks: goalToLink.tasks || [],
      deadline: goalToLink.deadline || undefined
    }, ...p]);
  };

  const promoteGoalToQuickTasks = (goalId) => {
    if (quickTasks.some((task) => task.lifeGoalId === goalId && !task.parentId)) return;
    let goalToLink = null;
    for (const tier of lifeGoals.tiers) {
      const found = tier.goals.find(g => g.id === goalId);
      if (found) { goalToLink = { ...found }; break; }
    }
    if (!goalToLink) return;

    // Crea un quick task collegato
    setQuickTasks(q => [{
      id: uid('task'),
      lifeGoalId: goalId, // Campo per la sincronizzazione
      title: goalToLink.title,
      done: goalToLink.done || false,
      deadline: goalToLink.deadline || undefined,
      parentId: null
    }, ...q]);
  };

  const toggleProjectTask = (projectId, taskId, val) => {
    updateProject(projectId, p => {
      const nextTasks = updateNodeInTree(p.tasks, taskId, n => ({ ...n, done: val }));

      // Se il progetto è collegato a un Life Goal, sincronizza il task corrispondente
      if (p.lifeGoalId) {
        updateGoal(p.lifeGoalId, g => ({
          ...g,
          tasks: updateNodeInTree(g.tasks, taskId, n => ({ ...n, done: val }))
        }));
      }

      return { ...p, tasks: nextTasks };
    });
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
    <div className="h-full w-full bg-[#e4e5ea] dark:bg-[#0c0e14] text-gray-900 dark:text-zinc-100 flex flex-col overflow-hidden font-sans font-medium select-none selection:bg-indigo-500/30 antialiased">

      {/* HEADER — Dashboard bar: stats + date + actions */}
      <header className="shrink-0 border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-[#0f1116]/95 backdrop-blur-xl shadow-sm shadow-zinc-900/5 dark:shadow-black/20 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: spacer */}
          <div className="w-0 sm:w-4 shrink-0" />

          {/* Center: Live stats */}
          <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
            {focusStreak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/30">
                <Icons.Flame className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-bold tabular-nums">{focusStreak}d</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-zinc-100/80 dark:bg-white/[0.06] px-3 py-1.5 ring-1 ring-zinc-200/60 dark:ring-white/[0.08]">
              <div className="relative h-2 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                />
              </div>
              <span className="min-w-[2.25rem] text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                {Math.round(todayFocusScore * 100)}%
              </span>
            </div>
          </div>

          {/* Right: Date + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <time className="hidden sm:block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
              {now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            </time>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Azzerare tutto? Verranno eliminati progetti, task, abitudini e dati della dashboard. Ricarica la pagina.')) {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem('km-dashboard-v1');
                    localStorage.removeItem(POMODORO_STORAGE);
                    window.location.reload();
                  } catch (_) { }
                }
              }}
              className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              title="Reset dashboard"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Prayers + Time Remaining */}
      <div className="shrink-0 px-5 py-4">
        <div className="dashboard-panel px-4 py-3">
          <div className="flex items-center gap-6">
            {/* Prayers */}
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <h3 className="flex shrink-0 items-center gap-2 dashboard-section-title text-emerald-500 dark:text-emerald-400">
                <Icons.CheckCircle className="w-3.5 h-3.5" /> Prayers
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {PRAYERS.map((prayer) => {
                  const isDone = todayPrayerLog[prayer];
                  return (
                    <label key={prayer} className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 transition-all ${isDone ? 'border-emerald-400/40 bg-emerald-500/12 dark:border-emerald-500/20 dark:bg-emerald-500/8' : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-white/5 dark:hover:bg-white/[0.03]'}`}>
                      <TaskCheckbox done={isDone} onClick={() => togglePrayer(prayer, !isDone)} />
                      <span className={`text-sm ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{prayer}</span>
                      <input type="checkbox" className="hidden" checked={!!isDone} readOnly />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-8 w-px shrink-0 bg-zinc-200 dark:bg-white/[0.06]" />

            {/* Time Remaining — ancorato a destra */}
            <div className="hidden md:flex shrink-0 items-center gap-4">
              <h3 className="dashboard-section-title">Remaining</h3>
              <div className="flex items-center gap-5">
                {countdowns.map(c => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-10 shrink-0">{c.label}</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tabular-nums shrink-0">{c.remaining}</span>
                    <div className="w-14 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full transition-all" style={{ width: `${c.pct * 100}%` }} />
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
          <div className="dashboard-panel flex min-h-0 shrink-0 flex-col overflow-hidden px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 dashboard-section-title text-rose-500 dark:text-rose-400">
                <Icons.CheckCircle className="w-3.5 h-3.5" /> Quick Tasks
              </h3>
              <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">{allQuickTasks.filter(t => t.done).length}/{allQuickTasks.length}</span>
            </div>

            <div className="mb-2 flex gap-1.5">
              <input
                type="text"
                value={quickTaskDraft}
                onChange={(e) => setQuickTaskDraft(e.target.value)}
                onKeyDown={addQuickTask}
                placeholder="Nuova task..."
                className="dashboard-input flex-1 py-1.5 text-sm"
              />
              <button
                onClick={() => { const t = quickTaskDraft.trim(); if (t) { setQuickTasks(p => [...p, { id: uid('quick'), title: t, done: false }]); setQuickTaskDraft(''); } }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white transition-all hover:bg-rose-600 active:scale-95"
              >
                <Icons.Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto">
              {allQuickTasks.map((task, idx) => {
                const isShared = !!task.shareId;
                const localIdx = isShared ? -1 : quickTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
                return (
                  <div
                    key={isShared ? `shared-${task.shareId}-${task.id}` : task.id}
                    className={`group task-row ${isShared ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                    draggable={!isShared}
                    onDragStart={!isShared ? (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: localIdx })); e.dataTransfer.effectAllowed = 'move'; } : undefined}
                    onDragOver={!isShared ? (e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50'); } : undefined}
                    onDragLeave={!isShared ? (e) => e.currentTarget.classList.remove('bg-zinc-50') : undefined}
                    onDrop={!isShared ? (e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-zinc-50'); try { const p = JSON.parse(e.dataTransfer.getData('application/json')); if (p.type === 'quick') { const targetLocalIdx = allQuickTasks.slice(0, idx).filter(t => !t.shareId).length; reorderQuickTasks(p.fromIndex, targetLocalIdx); } } catch (_) { } } : undefined}
                  >
                    <TaskCheckbox done={task.done} onClick={() => isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done)} />

                    <div className="flex flex-1 min-w-0 items-center gap-2" onClick={() => isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done)}>
                      {quickTaskEditingId === (isShared ? `shared-${task.shareId}-${task.id}` : task.id) ? (
                        <input
                          autoFocus
                          value={quickTaskEditingTitle}
                          onChange={(e) => setQuickTaskEditingTitle(e.target.value)}
                          onBlur={() => { const t = quickTaskEditingTitle.trim(); if (t) (isShared ? updateSharedQuickTask(task.shareId, task.id, qt => ({ ...qt, title: t })) : updateQuickTask(task.id, qt => ({ ...qt, title: t }))); setQuickTaskEditingId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { const t = quickTaskEditingTitle.trim(); if (t) (isShared ? updateSharedQuickTask(task.shareId, task.id, qt => ({ ...qt, title: t })) : updateQuickTask(task.id, qt => ({ ...qt, title: t }))); setQuickTaskEditingId(null); } if (e.key === 'Escape') setQuickTaskEditingId(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="seamless-input text-sm text-zinc-800 dark:text-zinc-100"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => { e.stopPropagation(); setQuickTaskEditingId(isShared ? `shared-${task.shareId}-${task.id}` : task.id); setQuickTaskEditingTitle(task.title); }}
                          className={`cursor-pointer select-text text-sm leading-none ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                        >
                          {task.title}
                          {isShared && task.sharedTitle && <span className="ml-1 text-[9px] text-zinc-400">({task.sharedTitle})</span>}
                        </span>
                      )}
                      {task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setQuickTaskDeadlineInput(task.deadline || ''); setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id); }} className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${getDeadlineColorClass(task.deadline, task.done)}`}>{formatDeadline(task.deadline)}</button>
                      )}
                      {quickTaskDeadlineEditing === (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                        <input type="date" autoFocus value={quickTaskDeadlineInput} onChange={(e) => setQuickTaskDeadlineInput(e.target.value)}
                          onBlur={() => { (isShared ? updateSharedQuickTask(task.shareId, task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })) : updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined }))); setQuickTaskDeadlineEditing(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { (isShared ? updateSharedQuickTask(task.shareId, task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })) : updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined }))); setQuickTaskDeadlineEditing(null); } if (e.key === 'Escape') setQuickTaskDeadlineEditing(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="dashboard-input w-28 py-0.5 text-xs"
                        />
                      )}
                    </div>

                    {/* Actions al hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {!task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                        <button type="button" onClick={() => { setQuickTaskDeadlineInput(''); setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id); }} className="dashboard-action-btn p-1 hover:text-amber-500" title="Scadenza">
                          <Icons.Calendar className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id }); }}
                        disabled={!top3Manual.some(s => !s)}
                        className={`dashboard-action-btn p-1 ${top3Manual.some(s => !s) ? 'hover:text-amber-500' : 'opacity-30 cursor-not-allowed'}`}
                        title="Top 3"
                      >
                        <Icons.Target className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => isShared ? removeSharedQuickTask(task.shareId, task.id) : removeQuickTask(task.id)} className="dashboard-action-btn p-1 hover:text-red-500" title="Elimina">
                        <Icons.X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {allQuickTasks.length === 0 && (
                <div className="relative overflow-hidden min-h-[3.25rem] rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] flex items-center">
                  <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">+</span>
                  <span className="relative z-10 pl-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trascina qui</span>
                </div>
              )}
            </div>
          </div>

          <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
        </div>

        {/* COL 2: Top 3, Habits */}
        <div className="md:col-span-3 flex flex-col gap-4 min-h-0">

          {/* Top 3 — stile dashboard3 */}
          <div className="dashboard-panel flex flex-col shrink-0 overflow-hidden px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2 dashboard-section-title text-amber-500 dark:text-amber-400">
                <Icons.Target className="w-3.5 h-3.5" /> Top 3 Focus
              </h3>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{top3DoneCount}/3</span>
            </div>

            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((idx) => {
                const slot = top3Resolved[idx];
                const filled = slot && !slot.missing;
                const isDone = slot?.done;

                return (
                  <div
                    key={idx}
                    data-slot-index={idx}
                    draggable={filled}
                    onDragStart={filled ? (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; } : undefined}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-400'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('border-amber-400')}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-amber-400');
                      const toIndex = Number(e.currentTarget.dataset.slotIndex);
                      try {
                        const raw = e.dataTransfer.getData('application/json');
                        if (!raw) return;
                        const payload = JSON.parse(raw);
                        if (payload.type === 'top3') reorderTop3(payload.fromIndex, toIndex);
                        else if (payload.type === 'project' && payload.projectId && payload.taskId) setTop3SlotAtIndex(toIndex, { projectId: payload.projectId, taskId: payload.taskId });
                        else if (payload.type === 'quick' && payload.quickTaskId) setTop3SlotAtIndex(toIndex, { quickTaskId: payload.quickTaskId });
                      } catch (_) { }
                    }}
                    className={`relative overflow-hidden min-h-[3.25rem] rounded-xl border flex items-center transition-all duration-150 ${filled ? 'border-zinc-200 dark:border-white/[0.06] dark:hover:border-white/[0.1] bg-zinc-50/50 dark:bg-white/[0.02] cursor-grab active:cursor-grabbing' : 'border-dashed border-zinc-200 dark:border-white/[0.06] bg-transparent'}`}
                  >
                    <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">{idx + 1}</span>
                    {filled ? (
                      <>
                        <div onClick={() => toggleTop3Slot(slot)} className="relative z-10 flex items-center gap-3 pl-4 w-full cursor-pointer">
                          <div onClick={(e) => e.stopPropagation()}>
                            <TaskCheckbox done={isDone} onClick={() => toggleTop3Slot(slot)} />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className={`text-sm font-semibold truncate transition-colors duration-150 ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-100'}`}>{slot.title}</span>
                            {slot.projectTitle && <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 truncate">{slot.projectTitle}</span>}
                          </div>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFromTop3(idx); }} className="relative z-10 p-3 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150">
                          <Icons.X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="relative z-10 pl-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trascina qui</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habits */}
          <div className="dashboard-panel flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h3 className="flex items-center gap-2 dashboard-section-title text-sky-500 dark:text-sky-400">
                <Icons.Flame className="w-3.5 h-3.5" /> Habits
              </h3>
              <span className="text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">{todayDone}/{activeHabits.length}</span>
            </div>

            <div className="mb-2 flex shrink-0 gap-1.5">
              <input
                value={habitDraft}
                onChange={(e) => setHabitDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } } }}
                placeholder="Nuova abitudine..."
                className="dashboard-input flex-1 py-1.5 text-sm"
              />
              <button
                onClick={() => { const t = habitDraft.trim(); if (t) { setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]); setHabitDraft(''); } }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white transition-all hover:bg-sky-600 active:scale-95"
              >
                <Icons.Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {dailyTaskTemplates.map((task, idx) => {
                const isLocked = task.locked;
                const isDone = todayTaskLog[task.id];
                return (
                  <div
                    key={task.id}
                    data-habit-index={idx}
                    draggable={!isLocked}
                    onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'habit', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50')}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-zinc-50'); try { const p = JSON.parse(e.dataTransfer.getData('application/json')); if (p.type === 'habit') reorderHabits(p.fromIndex, idx); } catch (_) { } }}
                    className={`group task-row ${isLocked ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <TaskCheckbox done={isDone} onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)} />

                    <div className="flex flex-1 min-w-0 items-center" onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)}>
                      {habitEditingId === task.id ? (
                        <input
                          autoFocus
                          value={habitEditingTitle}
                          onChange={(e) => setHabitEditingTitle(e.target.value)}
                          onBlur={() => { const t = habitEditingTitle.trim(); if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); setHabitEditingId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { const t = habitEditingTitle.trim(); if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); setHabitEditingId(null); } if (e.key === 'Escape') setHabitEditingId(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="seamless-input text-sm text-zinc-800 dark:text-zinc-100"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => { e.stopPropagation(); setHabitEditingId(task.id); setHabitEditingTitle(task.title); }}
                          className={`cursor-pointer select-text text-sm leading-none ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                        >
                          {task.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => toggleHabitLock(task.id)} className={`dashboard-action-btn p-1 ${isLocked ? 'text-amber-500' : 'hover:text-amber-500'}`} title={isLocked ? 'Sblocca' : 'Blocca'}>
                        <Icons.Lock className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => removeDailyTask(task.id)} className="dashboard-action-btn p-1 hover:text-red-500" title="Elimina">
                        <Icons.X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <ThisWeekWidget dailyTaskLogs={dailyTaskLogs} activeHabits={activeHabits} now={now} />
          </div>
        </div>

        {/* COL 3 - Projects */}
        <div className="dashboard-panel overflow-hidden md:col-span-6 flex min-h-0 flex-col p-5">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="flex items-center gap-2 dashboard-section-title text-indigo-500 dark:text-indigo-400">
              <Icons.Square className="w-3.5 h-3.5" /> Projects
            </h2>
            <button
              onClick={createProject}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
            >
              <Icons.Plus className="h-3 w-3" />
              <span>Nuovo</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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
                            onAddChild={(tid, val) => updateProject(project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
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
                                  updateProject(project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                                  setProjectTaskDrafts(prev => ({ ...prev, [project.id]: '' }));
                                }
                              }
                            }}
                            placeholder="Add task... (Enter)"
                            className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
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
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 shrink-0 border-t border-zinc-100 dark:border-white/[0.05] pt-3">
                  <h3 className="flex items-center gap-2 dashboard-section-title text-indigo-500 dark:text-indigo-400">
                    <Icons.MessageCircle className="w-3.5 h-3.5" /> Shared
                  </h3>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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
                                  onAddChild={(tid, val) => updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
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
                                        updateSharedDashboardProject(shared.share_id, project.id, p => ({ ...p, tasks: [...(p.tasks || []), createTaskNode(title)] }));
                                        setProjectTaskDrafts(prev => ({ ...prev, [`${shared.share_id}-${project.id}`]: '' }));
                                      }
                                    }
                                  }}
                                  placeholder="Add task... (Enter)"
                                  className="seamless-input text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
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

      {/* LIFE GOALS */}
      <div className="shrink-0 px-5 pb-10">
        <div className="dashboard-panel flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 dashboard-section-title text-violet-500 dark:text-violet-400">
              <Icons.Target className="w-3.5 h-3.5" /> Life Goals
            </h2>
            <button
              onClick={() => updateLifeGoals(p => ({ ...p, collapsed: !p.collapsed }))}
              className="dashboard-action-btn"
            >
              {lifeGoals.collapsed ? <Icons.ChevronDown className="h-3.5 w-3.5" /> : <Icons.ChevronUp className="h-3.5 w-3.5" />}
            </button>
          </div>

          {!lifeGoals.collapsed && (
            <div className="flex flex-col gap-3">
              {lifeGoals.tiers.map((tier) => {
                const completedCount = tier.goals.filter(g => g.done).length;
                const totalCount = tier.goals.length;

                return (
                  <div
                    key={tier.id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200/60 dark:border-white/[0.04]"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50')}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-zinc-50');
                      try { const d = JSON.parse(e.dataTransfer.getData('application/json')); if (d.type === 'lifeGoal') moveGoalToTier(d.goalId, tier.id); } catch (_) { }
                    }}
                  >
                    {/* Tier header */}
                    <div
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]"
                      onClick={() => toggleTierCollapse(tier.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{tier.emoji}</span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{tier.name}</span>
                        <span className="text-xs text-zinc-400">{completedCount}/{totalCount}</span>
                      </div>
                      <Icons.ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${tier.collapsed ? '' : 'rotate-180'}`} />
                    </div>

                    {!tier.collapsed && (
                      <div className="animate-slide-down flex flex-col gap-3 px-3 pb-3">
                        {tier.goals.length === 0 && (
                          <div className="relative overflow-hidden min-h-[3.25rem] rounded-xl border border-dashed border-zinc-200 dark:border-white/[0.06] flex items-center">
                            <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">+</span>
                            <span className="relative z-10 pl-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trascina qui</span>
                          </div>
                        )}
                        {/* QUICK GOALS */}
                        {tier.goals.some(g => g.type === 'quick') && (
                          <div className="flex flex-col gap-1.5">
                            <span className="px-1 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400">Quick</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                              {tier.goals.filter(g => g.type === 'quick').map((goal) => (
                                <LifeGoalCard
                                  key={goal.id} goal={goal} accent={tier.color} stats={{}} percentage={0}
                                  onToggle={(gid, val) => { updateGoal(gid, g => ({ ...g, done: val })); setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t)); }}
                                  onDelete={deleteGoal}
                                  onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                  onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                  onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                  deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                  setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                  getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                  onAddToTop3={(gid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: `lg-${gid}`, taskId: gid }); }}
                                  hasFreeTop3Slot={top3Manual.some(s => !s)}
                                  onPromoteProject={promoteGoalToProjects}
                                  onPromoteQuick={promoteGoalToQuickTasks}
                                  isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                  isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                  renderTasks={() => null}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PROJECT GOALS */}
                        {tier.goals.some(g => g.type === 'project') && (
                          <div className="flex flex-col gap-1.5">
                            <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">Projects</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                              {tier.goals.filter(g => g.type === 'project').map((goal) => {
                                const stats = countTreeStats(goal.tasks);
                                const percentage = Math.round(stats.ratio * 100);
                                return (
                                  <LifeGoalCard
                                    key={goal.id} goal={goal} accent={tier.color} stats={stats} percentage={percentage}
                                    onToggle={(gid, val) => { updateGoal(gid, g => ({ ...g, done: val })); setQuickTasks(prev => prev.map(t => t.lifeGoalId === gid ? { ...t, done: val } : t)); }}
                                    onDelete={deleteGoal}
                                    onRename={(gid, val, type) => updateGoal(gid, g => ({ ...g, title: val, type: type || g.type }))}
                                    onDeadline={(gid, val) => updateGoal(gid, g => ({ ...g, deadline: val || null }))}
                                    onDeadlineClick={(gid, val) => { updateGoal(gid, g => ({ ...g, deadline: val.trim() || null })); setGoalDeadlineEditing(null); }}
                                    deadlineEditing={goalDeadlineEditing} deadlineInput={goalDeadlineInput}
                                    setDeadlineInput={setGoalDeadlineInput} setDeadlineEditing={setGoalDeadlineEditing}
                                    getDeadlineColorClass={getDeadlineColorClass} formatDeadline={formatDeadline}
                                    onAddToTop3={() => { }}
                                    hasFreeTop3Slot={false}
                                    onPromoteProject={promoteGoalToProjects}
                                    onPromoteQuick={promoteGoalToQuickTasks}
                                    isLinkedToProject={projects.some((project) => project.lifeGoalId === goal.id)}
                                    isLinkedToQuick={quickTasks.some((task) => task.lifeGoalId === goal.id && !task.parentId)}
                                    renderTasks={() => (
                                      <>
                                        {goal.tasks?.map((node) => (
                                          <DenseTaskNode
                                            key={node.id} node={node} depth={0} projectId={`lg-${goal.id}`} projectAccent={tier.color}
                                            onToggle={(tid, val) => { updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, done: val })) })); setProjects(prev => prev.map(p => p.lifeGoalId === goal.id ? { ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) } : p)); }}
                                            onDelete={(tid) => updateGoal(goal.id, g => ({ ...g, tasks: removeNodeFromTree(g.tasks, tid) }))}
                                            onRename={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, title: val })) }))}
                                            onDeadline={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                                            onAddChild={(tid, val) => updateGoal(goal.id, g => ({ ...g, tasks: updateNodeInTree(g.tasks, tid, n => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })) }))}
                                            onAddToTop3={(pid, tid) => { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { projectId: pid, taskId: tid }); }}
                                            hasFreeTop3Slot={top3Manual.some(s => !s)}
                                          />
                                        ))}
                                        <div className="pt-1">
                                          <input
                                            value={goalTaskDrafts[goal.id] ?? ''}
                                            onChange={(e) => setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const title = (goalTaskDrafts[goal.id] ?? '').trim(); if (title) { updateGoal(goal.id, g => ({ ...g, tasks: [...(g.tasks || []), createTaskNode(title)] })); setGoalTaskDrafts(prev => ({ ...prev, [goal.id]: '' })); } } }}
                                            placeholder="+ task..."
                                            className="seamless-input text-sm text-zinc-500 placeholder:text-zinc-300"
                                          />
                                        </div>
                                      </>
                                    )}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { const title = window.prompt("Quick goal:"); if (title) addGoalToTier(tier.id, title, 'General', 'quick'); }}
                            className="dashboard-chip text-[10px] hover:text-zinc-600"
                          >
                            <Icons.Plus className="h-2.5 w-2.5" /> Quick
                          </button>
                          <button
                            onClick={() => { const title = window.prompt("Progetto:"); if (title) addGoalToTier(tier.id, title, 'General', 'project'); }}
                            className="dashboard-chip text-[10px] hover:text-zinc-600"
                          >
                            <Icons.Plus className="h-2.5 w-2.5" /> Project
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}