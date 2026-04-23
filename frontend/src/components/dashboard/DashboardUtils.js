export const STORAGE_KEY = 'km-dashboard-v2';
export const BC_CHANNEL = 'km-dashboard-v2-sync';
export const MAX_TASK_DEPTH = 2;
export const POMODORO_STORAGE = 'km-pomodoro-v2';
export const POMODORO_DURATION = 25 * 60;

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  return addDays(d, -mondayOffset);
}

export function startOfMonth(date = new Date()) { return new Date(date.getFullYear(), date.getMonth(), 1); }
export function startOfYear(date = new Date()) { return new Date(date.getFullYear(), 0, 1); }

export function formatCountdown(ms) {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

export function findTaskInProjects(projects, projectId, taskId, lifeGoals = null) {
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
      const lgProj = tier.goals?.find(g => g.id === projectId || `lg-${g.id}` === projectId);
      if (lgProj) {
        let found = null;
        if (lgProj.id === taskId) return { node: lgProj, projectTitle: `LG: ${tier.name}` };
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

export function resolveTop3Slots(projects, top3Manual, quickTasks = [], lifeGoals = null, sharedDashboards = []) {
  return top3Manual.map((slot) => {
    if (!slot) return null;
    if (slot.quickTaskId) {
      const qt = quickTasks.find((t) => t.id === slot.quickTaskId && (slot.shareId != null ? t.shareId === slot.shareId : !t.shareId));
      if (!qt) return { ...slot, missing: true };
      return { ...slot, title: qt.title, projectTitle: 'Quick Task', done: qt.done, isQuick: true };
    }
    if (slot.shareId) {
      const sd = sharedDashboards.find((s) => s.share_id === slot.shareId);
      const sharedProjects = sd?.data?.projects ?? [];
      const res = findTaskInProjects(sharedProjects, slot.projectId, slot.taskId, null);
      if (!res) return { ...slot, missing: true };
      return { ...slot, title: res.node.title, projectTitle: res.projectTitle ?? sd?.title, done: res.node.done };
    }
    const res = findTaskInProjects(projects, slot.projectId, slot.taskId, lifeGoals);
    if (!res) return { ...slot, missing: true };
    return { ...slot, title: res.node.title, projectTitle: res.projectTitle, done: res.node.done };
  });
}

export function countTreeStats(nodes) {
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

export function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    return { ...node, children: updateNodeInTree(Array.isArray(node.children) ? node.children : [], nodeId, updater) };
  });
}

export function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeNodeFromTree(Array.isArray(node.children) ? node.children : [], nodeId) }));
}

export function collectNodeAndDescendantIds(nodes, targetId) {
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

export function createTaskNode(title) {
  return { id: uid('task'), title: title.trim(), done: false, children: [], deadline: undefined, workingBy: undefined };
}

/** Data scadenza leggibile (es. 15 mar 2025) */
export function formatDeadlineDisplay(v) {
  const d = fromDateKey(v);
  if (!d) return '';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fromDateKey(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

export function formatDeadline(v) {
  const d = fromDateKey(v);
  return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
}

export function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (daysUntil <= 2) return 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30';
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  if (daysUntil <= 14) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';
}

/** Returns 'Scaduta' if deadline is in the past, otherwise null (for label/badge). */
export function getDeadlinePastLabel(deadlineKey) {
  if (!deadlineKey) return null;
  const dead = fromDateKey(deadlineKey);
  if (!dead) return null;
  const today = startOfDay(new Date());
  return dead < today ? 'Scaduta' : null;
}

export function buildDefaultLifeGoals() {
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
          mkG('Completare PROJECTO', 'Conoscenza', 'project'),
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

export function buildDefaultState() {
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
    timelineRoutines: {},
    timelinePanelExpanded: true,
  };
}

export function normalizeLifeGoals(lg, fallback) {
  if (!lg || !Array.isArray(lg.tiers) || lg.tiers.length === 0) return fallback;
  const projectTitles = [
    'Eliminare ogni addiction', 'Completare PROJECTO', 'Pagare tutti i debiti',
    'Correre una maratona', 'Ottenere il brevetto da pilota', 'Iniziare memorizzazione del Corano (Hafiz)',
    'Imparare 5 nuove lingue', 'Completare Quran Hafiz', 'Costruire la dream house',
    'Padroneggiare i viaggi astrali', 'Costruire una moschea', 'Creare una nuova lingua ottimizzata'
  ];
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

export function loadDashboardStateFromStorage(fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
      timelineRoutines: parsed.timelineRoutines && typeof parsed.timelineRoutines === 'object' ? parsed.timelineRoutines : fallback.timelineRoutines,
      timelinePanelExpanded: parsed.timelinePanelExpanded !== undefined ? parsed.timelinePanelExpanded : true,
    };
  } catch (err) {
    console.error('Failed to parse dashboard state from localStorage:', err);
    return fallback;
  }
}

export const PRAYER_SLOTS =['Fajr-Dhuhr', 'Dhuhr-Asr', 'Asr-Maghrib', 'Maghrib-Isha', 'Isha-Fajr'];

export function getCurrentSlotKey(date = new Date()) {
  const h = date.getHours();
  const m = date.getMinutes();
  const time = h + m / 60;
  
  // Mappatura oraria approssimata per assegnare i task in auto
  if (time >= 5 && time < 12.5) return 'Fajr-Dhuhr'; 
  if (time >= 12.5 && time < 15.5) return 'Dhuhr-Asr';  
  if (time >= 15.5 && time < 18.0) return 'Asr-Maghrib';
  if (time >= 18.0 && time < 19.5) return 'Maghrib-Isha';
  return 'Isha-Fajr'; 
}