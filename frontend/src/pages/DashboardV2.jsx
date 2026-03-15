import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/client';
import { useDashboardStats } from '../context/DashboardStatsContext';

// Modular Components
import { Icons } from '../components/dashboard/Icons';
import { PomodoroCompact } from '../components/dashboard/PomodoroCompact';
import { FocusHeatmap } from '../components/dashboard/FocusHeatmap';

// New Section Components
import { PrayersCountdowns } from '../components/dashboard/PrayersCountdowns';
import { QuickTasksSection } from '../components/dashboard/QuickTasksSection';
import { Top3Section } from '../components/dashboard/Top3Section';
import { HabitsSection } from '../components/dashboard/HabitsSection';
import { ProjectsSection } from '../components/dashboard/ProjectsSection';
import { LifeGoalsSection } from '../components/dashboard/LifeGoalsSection';

// Utils & Constants
import {
  STORAGE_KEY,
  BC_CHANNEL,
  PRAYERS,
  uid,
  toDateKey,
  formatDeadline,
  getDeadlineColorClass,
  startOfDay,
  addDays,
  startOfWeek,
  startOfMonth,
  formatCountdown,
  resolveTop3Slots,
  updateNodeInTree,
  loadState,
  normalizeLifeGoals,
  buildDefaultLifeGoals,
  POMODORO_STORAGE
} from '../components/dashboard/DashboardUtils';

// Local components removed (now imported from modular files)

/**
 * ----------------------------------------------------------------------
 * CONSTANTS & UTILS
 * ----------------------------------------------------------------------
 */
// Constants, Utils and Mid-level components removed (now imported)

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];
// Local components removed (now imported from modular files)

/**
 * ----------------------------------------------------------------------
 * MAIN DASHBOARD COMPONENT
 * ----------------------------------------------------------------------
 */
export default function DashboardV2() {
  const initial = useMemo(() => loadState(), []);
  const { updateStats } = useDashboardStats() || { updateStats: () => { } };

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
          if (msg.type === 'chat' && msg.data) {
            setSharedDashboards(prev => prev.map(item => {
              if (item.share_id !== shareId) return item;
              const chat = Array.isArray(item.data?.chat) ? item.data.chat : [];
              if (chat.some(m => m.id === msg.data.id)) return item;
              return { ...item, data: { ...item.data, chat: [...chat.slice(-99), msg.data] } };
            }));
          } else if (msg.type === 'sync' && msg.data) {
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
          if (message.type === 'chat' && message.data) {
            setSharedDashboards(prev => prev.map(item => {
              if (item.share_id !== shareId) return item;
              const chat = Array.isArray(item.data?.chat) ? item.data.chat : [];
              if (chat.some(m => m.id === message.data.id)) return item;
              return { ...item, data: { ...item.data, chat: [...chat.slice(-99), message.data] } };
            }));
          } else if (message.type === 'sync') {
            const data = message.data || message;
            setSharedDashboards(prev => prev.map(item =>
              item.share_id === shareId ? { ...item, data: data, title: message.title || item.title } : item
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
    if (updateStats) updateStats(doneFocusItems, totalFocusItems);
  }, [doneFocusItems, totalFocusItems, updateStats]);

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
    <div className="h-full w-full flex flex-col overflow-hidden font-sans font-medium select-none selection:bg-indigo-500/30 antialiased">

      {/* HEADER — Dashboard bar: stats + date + actions */}
      <header className="shrink-0 border-b border-zinc-200/50 dark:border-white/[0.06] bg-white/70 dark:bg-[#0b0e14]/70 backdrop-blur-xl shadow-sm dark:shadow-black/50 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: spacer */}
          <div className="w-0 sm:w-4 shrink-0" />

          {/* Center: Live stats */}
          <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
            {focusStreak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 sm:px-3 py-1 sm:py-1.5 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/30">
                <Icons.Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold tabular-nums">{focusStreak}d</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-zinc-100/80 dark:bg-white/[0.06] px-2 sm:px-3 py-1 sm:py-1.5 ring-1 ring-zinc-200/60 dark:ring-white/[0.08]">
              <div className="relative h-1.5 sm:h-2 w-12 sm:w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                />
              </div>
              <span className="min-w-[1.75rem] sm:min-w-[2.25rem] text-[10px] sm:text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
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

      <PrayersCountdowns
        todayPrayerLog={todayPrayerLog}
        togglePrayer={togglePrayer}
        PRAYERS={PRAYERS}
        countdowns={countdowns}
      />

      <div className="flex-1 min-h-0 px-6 pt-3 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 overflow-x-hidden overflow-y-auto lg:overflow-hidden">

        {/* COL 1: Pomodoro, Quick Tasks, Prayers, Countdowns - Span 3 on Large */}
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">
          <PomodoroCompact />

          <QuickTasksSection
            allQuickTasks={allQuickTasks}
            quickTaskDraft={quickTaskDraft}
            setQuickTaskDraft={setQuickTaskDraft}
            addQuickTask={addQuickTask}
            setQuickTasks={setQuickTasks}
            quickTaskEditingId={quickTaskEditingId}
            setQuickTaskEditingId={setQuickTaskEditingId}
            quickTaskEditingTitle={quickTaskEditingTitle}
            setQuickTaskEditingTitle={setQuickTaskEditingTitle}
            quickTaskDeadlineEditing={quickTaskDeadlineEditing}
            setQuickTaskDeadlineEditing={setQuickTaskDeadlineEditing}
            quickTaskDeadlineInput={quickTaskDeadlineInput}
            setQuickTaskDeadlineInput={setQuickTaskDeadlineInput}
            toggleSharedQuickTask={toggleSharedQuickTask}
            toggleQuickTask={toggleQuickTask}
            updateSharedQuickTask={updateSharedQuickTask}
            updateQuickTask={updateQuickTask}
            getDeadlineColorClass={getDeadlineColorClass}
            formatDeadline={formatDeadline}
            top3Manual={top3Manual}
            setTop3SlotAtIndex={setTop3SlotAtIndex}
            removeSharedQuickTask={removeSharedQuickTask}
            removeQuickTask={removeQuickTask}
            reorderQuickTasks={reorderQuickTasks}
            quickTasks={quickTasks}
          />

          <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
        </div>

        {/* COL 2: Top 3, Habits — Span 3 on Large */}
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">

          <Top3Section
            top3Resolved={top3Resolved}
            top3DoneCount={top3DoneCount}
            reorderTop3={reorderTop3}
            setTop3SlotAtIndex={setTop3SlotAtIndex}
            toggleTop3Slot={toggleTop3Slot}
            removeFromTop3={removeFromTop3}
          />

          <HabitsSection
            dailyTaskTemplates={dailyTaskTemplates}
            setDailyTaskTemplates={setDailyTaskTemplates}
            todayDone={todayDone}
            activeHabits={activeHabits}
            habitDraft={habitDraft}
            setHabitDraft={setHabitDraft}
            todayTaskLog={todayTaskLog}
            toggleDailyTask={toggleDailyTask}
            habitEditingId={habitEditingId}
            setHabitEditingId={setHabitEditingId}
            habitEditingTitle={habitEditingTitle}
            setHabitEditingTitle={setHabitEditingTitle}
            toggleHabitLock={toggleHabitLock}
            removeDailyTask={removeDailyTask}
            reorderHabits={reorderHabits}
            dailyTaskLogs={dailyTaskLogs}
            now={now}
          />
        </div>

          <ProjectsSection
            projects={projects}
            createProject={createProject}
            deleteProject={deleteProject}
            updateProject={updateProject}
            toggleProjectTask={toggleProjectTask}
            projectTaskDrafts={projectTaskDrafts}
            setProjectTaskDrafts={setProjectTaskDrafts}
            setTop3Manual={setTop3Manual}
            setTop3SlotAtIndex={setTop3SlotAtIndex}
            top3Manual={top3Manual}
            setDailyCompletionLog={setDailyCompletionLog}
            moveProjectTask={moveProjectTask}
            moveSubtask={moveSubtask}
            projectDeadlineEditing={projectDeadlineEditing}
            projectDeadlineInput={projectDeadlineInput}
            setProjectDeadlineInput={setProjectDeadlineInput}
            setProjectDeadlineEditing={setProjectDeadlineEditing}
            getDeadlineColorClass={getDeadlineColorClass}
            formatDeadline={formatDeadline}
            sharedDashboards={sharedDashboards}
            updateSharedDashboardProject={updateSharedDashboardProject}
            deleteSharedDashboardProject={deleteSharedDashboardProject}
            PROJECT_ACCENTS={PROJECT_ACCENTS}
          />

      </div>

      <LifeGoalsSection
        lifeGoals={lifeGoals}
        updateLifeGoals={updateLifeGoals}
        toggleTierCollapse={toggleTierCollapse}
        moveGoalToTier={moveGoalToTier}
        updateGoal={updateGoal}
        deleteGoal={deleteGoal}
        goalDeadlineEditing={goalDeadlineEditing}
        setGoalDeadlineEditing={setGoalDeadlineEditing}
        goalDeadlineInput={goalDeadlineInput}
        setGoalDeadlineInput={setGoalDeadlineInput}
        getDeadlineColorClass={getDeadlineColorClass}
        formatDeadline={formatDeadline}
        top3Manual={top3Manual}
        setTop3SlotAtIndex={setTop3SlotAtIndex}
        promoteGoalToProjects={promoteGoalToProjects}
        promoteGoalToQuickTasks={promoteGoalToQuickTasks}
        projects={projects}
        quickTasks={quickTasks}
        goalTaskDrafts={goalTaskDrafts}
        setGoalTaskDrafts={setGoalTaskDrafts}
        setProjects={setProjects}
        setQuickTasks={setQuickTasks}
        addGoalToTier={addGoalToTier}
      />
    </div>
  );
}