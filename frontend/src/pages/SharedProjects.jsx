import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';

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
};

/**
 * ----------------------------------------------------------------------
 * UTILS
 * ----------------------------------------------------------------------
 */
function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-gray-400 bg-gray-50 dark:bg-gray-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (daysUntil <= 2) return 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30';
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';
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

/**
 * ----------------------------------------------------------------------
 * COMPONENTS
 * ----------------------------------------------------------------------
 */

function SharedTaskNode({ node, depth, projectId, projectAccent, onToggle, onDelete, onRename, onDeadline, onAddChild, onMove, parentId = null }) {
  const [draft, setDraft] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(node.deadline || '');
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const canAddChild = depth < 2;

  const handleDeadlineSave = () => {
    onDeadline?.(node.id, deadlineInput.trim() || null);
    setShowDeadline(false);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'shared-task', projectId, taskId: node.id, parentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="flex flex-col w-full"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-500/5'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-500/5'); }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation();
        e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-500/5');
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload.type === 'shared-task' && payload.projectId === projectId && payload.parentId === parentId) {
            onMove(payload.taskId);
          }
        } catch (_) {}
      }}
    >
      <div 
        draggable
        onDragStart={handleDragStart}
        className="flex items-start gap-1.5 py-1 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group/row cursor-grab active:cursor-grabbing"
      >
        <div className="w-3.5 flex justify-center shrink-0 mt-0.5">
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              {expanded ? <Icons.ChevronDown className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />}
            </button>
          ) : <span className="w-3 h-3" />}
        </div>

        <button onClick={() => onToggle(node.id, !node.done)} className={`shrink-0 mt-0.5 ${node.done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-400'}`}>
          {node.done ? <Icons.CheckCircle className="w-3.5 h-3.5" /> : <Icons.Circle className="w-3.5 h-3.5" />}
        </button>
        
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_5.5rem_auto] items-center gap-2">
          <div className="min-w-0" onDoubleClick={() => setEditing(true)}>
            {editing ? (
              <input
                autoFocus
                defaultValue={node.title}
                onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
                className="w-full bg-white dark:bg-gray-800 border border-indigo-400 rounded px-1 text-xs outline-none py-0"
              />
            ) : (
              <span onClick={() => onToggle(node.id, !node.done)} className={`text-xs cursor-pointer truncate block ${node.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                {node.title}
              </span>
            )}
          </div>

          {(node.deadline || showDeadline) && (
            <div className="flex justify-end">
              {showDeadline ? (
                <input
                  type="date"
                  value={deadlineInput || ''}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  onBlur={handleDeadlineSave}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDeadlineSave(); if (e.key === 'Escape') setShowDeadline(false); }}
                  autoFocus
                  className="w-full max-w-[7rem] text-[10px] py-0.5 px-1.5 rounded-md border border-amber-400 bg-white dark:bg-gray-800 outline-none"
                />
              ) : (
                <button onClick={() => setShowDeadline(true)} className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] shrink-0 ${getDeadlineColorClass(node.deadline, node.done)}`}>
                  <Icons.Calendar className="w-3 h-3 shrink-0" />
                  <span className="tabular-nums">{formatDeadline(node.deadline)}</span>
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity justify-end">
            {!node.deadline && !showDeadline && (
              <button onClick={() => setShowDeadline(true)} className="p-0.5 text-gray-500 hover:text-amber-500" title="Scadenza">
                <Icons.Calendar className="w-3 h-3" />
              </button>
            )}
            {canAddChild && (
              <button onClick={() => setOpenAdd(!openAdd)} className="p-0.5 text-gray-500 hover:text-indigo-500" title="Subtask">
                <Icons.Plus className="w-3 h-3" />
              </button>
            )}
            <button onClick={() => onDelete(node.id)} className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Elimina">
              <Icons.X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {openAdd && canAddChild && (
        <div className="flex pl-6 pr-1 py-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const t = draft.trim(); if (t) { onAddChild(node.id, t); setDraft(''); setOpenAdd(false); } } if (e.key === 'Escape') setOpenAdd(false); }}
            placeholder="Subtask..."
            className="flex-1 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-[11px] outline-none"
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div className="ml-5 pl-2 border-l-2 border-indigo-300 dark:border-indigo-600 flex flex-col">
          {node.children.map((child, cIdx) => (
            <SharedTaskNode
              key={child.id} node={child} depth={depth + 1} projectId={projectId}
              onToggle={onToggle} onDelete={onDelete} onRename={onRename} onDeadline={onDeadline} onAddChild={onAddChild} 
              onMove={(tid) => onMove(tid, cIdx, node.id)} parentId={node.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SharedProjects() {
  const { shareId } = useParams();
  
  // Stato unico per tutto il dashboard
  const [dashboard, setDashboard] = useState({
    projects: [],
    quickTasks: [],
    title: "Progetti Condivisi",
    loading: true,
    error: null,
    isSaving: false
  });

  // Ref per gestire la sincronizzazione senza loop
  const syncRef = useRef({
    lastLocalChange: 0,
    isSaving: false,
    pendingSave: false,
    lastServerData: null
  });

  // Funzione unica per caricare i dati (Polling & Initial)
  const fetchShared = async (isPoll = false) => {
    // Se abbiamo cambiato qualcosa localmente negli ultimi 3 secondi, non sovrascrivere col server
    if (isPoll && (syncRef.current.isSaving || Date.now() - syncRef.current.lastLocalChange < 3000)) return;

    try {
      const res = await api.training.getSharedDashboard(shareId);
      if (!res) return;

      const serverTitle = res.title || "Progetti Condivisi";
      let serverProjects = [];
      let serverQuickTasks = [];

      if (res.data) {
        if (Array.isArray(res.data)) {
          serverProjects = res.data;
        } else {
          serverProjects = res.data.projects || [];
          serverQuickTasks = res.data.quickTasks || [];
        }
      }

      // Confronto profondo semplificato per evitare re-render inutili
      const serverStateStr = JSON.stringify({ p: serverProjects, q: serverQuickTasks, t: serverTitle });
      if (syncRef.current.lastServerData === serverStateStr) return;
      syncRef.current.lastServerData = serverStateStr;

      setDashboard(prev => ({
        ...prev,
        projects: serverProjects,
        quickTasks: serverQuickTasks,
        title: serverTitle,
        loading: false
      }));
    } catch (err) {
      if (!isPoll) setDashboard(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  // Caricamento iniziale
  useEffect(() => {
    fetchShared();
    const pollInterval = setInterval(() => fetchShared(true), 3000);
    return () => clearInterval(pollInterval);
  }, [shareId]);

  // Motore di salvataggio automatico (Debounced)
  useEffect(() => {
    if (dashboard.loading) return;

    const performSave = async () => {
      if (syncRef.current.isSaving) {
        syncRef.current.pendingSave = true;
        return;
      }

      syncRef.current.isSaving = true;
      setDashboard(prev => ({ ...prev, isSaving: true }));

      try {
        const payload = { projects: dashboard.projects, quickTasks: dashboard.quickTasks };
        await api.training.updateSharedDashboard(shareId, payload, dashboard.title);
        // Aggiorniamo il "lastServerData" con quello che abbiamo appena mandato per evitare che il poll lo veda come "nuovo"
        syncRef.current.lastServerData = JSON.stringify({ p: dashboard.projects, q: dashboard.quickTasks, t: dashboard.title });
      } catch (err) {
        console.error("Save failed:", err);
      } finally {
        syncRef.current.isSaving = false;
        setDashboard(prev => ({ ...prev, isSaving: false }));
        // Se c'è stato un altro cambiamento mentre salvavamo, salviamo di nuovo
        if (syncRef.current.pendingSave) {
          syncRef.current.pendingSave = false;
          performSave();
        }
      }
    };

    const timer = setTimeout(performSave, 800);
    return () => clearTimeout(timer);
  }, [dashboard.projects, dashboard.quickTasks, dashboard.title]);

  // Helper per aggiornare lo stato locale e segnare il cambiamento
  const updateLocal = (updater) => {
    syncRef.current.lastLocalChange = Date.now();
    setDashboard(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  };

  const addQuickTask = (title) => {
    if (!title?.trim()) return;
    updateLocal(prev => ({
      quickTasks: [{ id: uid('qtask'), title: title.trim(), done: false, created_at: Date.now() }, ...prev.quickTasks]
    }));
  };

  const toggleQuickTask = (id) => {
    updateLocal(prev => ({
      quickTasks: prev.quickTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const deleteQuickTask = (id) => {
    updateLocal(prev => ({
      quickTasks: prev.quickTasks.filter(t => t.id !== id)
    }));
  };

  const updateProject = (id, updater) => {
    updateLocal(prev => ({
      projects: prev.projects.map(x => x.id === id ? updater(x) : x)
    }));
  };

  const createProject = () => {
    updateLocal(prev => ({
      projects: [{ id: uid('project'), title: 'Nuovo Progetto', tasks: [] }, ...prev.projects]
    }));
  };

  const deleteProject = (id) => {
    updateLocal(prev => ({
      projects: prev.projects.filter(x => x.id !== id)
    }));
  };

  const [quickTaskDraft, setQuickTaskDraft] = useState("");
  const [projectTaskDrafts, setProjectTaskDrafts] = useState({});

  if (dashboard.loading) return <div className="p-8 text-center text-gray-500 font-medium">Caricamento spazio condiviso...</div>;
  if (dashboard.error) return <div className="p-8 text-center text-red-500">Errore: {dashboard.error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 p-4 sm:p-8 md:p-10 font-sans selection:bg-indigo-500/30 antialiased overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* MAIN CONTENT: PROJECTS */}
        <div className="flex-1 space-y-8 min-w-0 order-2 lg:order-1">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <input 
                value={dashboard.title} 
                onChange={(e) => updateLocal({ title: e.target.value })}
                className="text-3xl font-extrabold tracking-tight bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 -ml-1 w-full sm:w-auto"
              />
              <p className="text-gray-500 text-sm font-medium">Spazio di lavoro condiviso</p>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {dashboard.isSaving && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Salvataggio...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dashboard.projects.map((proj) => {
              const stats = countTreeStats(proj.tasks);
              return (
                <motion.div 
                  layout
                  key={proj.id} 
                  className="flex flex-col bg-white dark:bg-[#1a1d24] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-fit"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex-1 min-w-0 mr-2">
                      <input
                        defaultValue={proj.title}
                        onBlur={(e) => updateProject(proj.id, p => ({ ...p, title: e.target.value }))}
                        className="w-full text-sm font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full tabular-nums">
                        {stats.completed}/{stats.total}
                      </div>
                      <button onClick={() => deleteProject(proj.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                    {proj.tasks.map((task, idx) => (
                      <SharedTaskNode
                        key={task.id} node={task} depth={0} projectId={proj.id}
                        onToggle={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) }))}
                        onDelete={(tid) => updateProject(proj.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }))}
                        onRename={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                        onDeadline={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val })) }))}
                        onAddChild={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), { id: uid('task'), title: val, done: false, children: [] }] })) }))}
                        onMove={(tid, targetIdx, parentId) => updateProject(proj.id, p => {
                          if (parentId) {
                            return { ...p, tasks: updateNodeInTree(p.tasks, parentId, parent => {
                              const next = [...(parent.children || [])];
                              const fromIdx = next.findIndex(t => t.id === tid);
                              if (fromIdx === -1) return parent;
                              const [removed] = next.splice(fromIdx, 1);
                              next.splice(targetIdx, 0, removed);
                              return { ...parent, children: next };
                            }) };
                          }
                          const next = [...p.tasks];
                          const fromIdx = next.findIndex(t => t.id === tid);
                          if (fromIdx === -1) return p;
                          const [removed] = next.splice(fromIdx, 1);
                          next.splice(targetIdx, 0, removed);
                          return { ...p, tasks: next };
                        })}
                      />
                    ))}
                  </div>

                  <div className="p-4 pt-0">
                    <input
                      value={projectTaskDrafts[proj.id] || ''}
                      onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [proj.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = projectTaskDrafts[proj.id]?.trim();
                          if (val) {
                            updateProject(proj.id, p => ({ ...p, tasks: [...p.tasks, { id: uid('task'), title: val, done: false, children: [] }] }));
                            setProjectTaskDrafts(prev => ({ ...prev, [proj.id]: '' }));
                          }
                        }
                      }}
                      placeholder="+ Aggiungi task..."
                      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </motion.div>
              );
            })}

            <button 
              onClick={createProject}
              className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-gray-400 hover:text-indigo-500 group min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Icons.Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold">Crea Progetto</span>
            </button>
          </div>
        </div>

        {/* SIDEBAR: QUICK TASKS */}
        <aside className="w-full lg:w-72 shrink-0 order-1 lg:order-2 pt-[76px]">
          <div className="sticky top-8 space-y-4">
            <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icons.Zap className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Quick Tasks</h2>
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                <div className="relative">
                  <input
                    value={quickTaskDraft}
                    onChange={(e) => setQuickTaskDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { addQuickTask(quickTaskDraft); setQuickTaskDraft(""); } }}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-amber-500 transition-colors"
                  />
                  <button 
                    onClick={() => { addQuickTask(quickTaskDraft); setQuickTaskDraft(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    <Icons.Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[600px]">
                  <AnimatePresence initial={false}>
                    {dashboard.quickTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                      >
                        <button 
                          onClick={() => toggleQuickTask(task.id)}
                          className={`shrink-0 ${task.done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
                        >
                          {task.done ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.Circle className="w-4 h-4" />}
                        </button>
                        <span className={`flex-1 text-[11px] min-w-0 truncate ${task.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                          {task.title}
                        </span>
                        <button 
                          onClick={() => deleteQuickTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Icons.Trash className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {dashboard.quickTasks.length === 0 && (
                    <div className="py-8 text-center space-y-2">
                      <div className="text-gray-300 dark:text-gray-700 text-2xl">⚡</div>
                      <p className="text-[10px] text-gray-400 font-medium">Nessuna task veloce</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
