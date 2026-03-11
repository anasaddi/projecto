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
  MessageCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Send: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
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
    chat: [],
    title: "Progetti Condivisi",
    loading: true,
    error: null,
    isConnected: false
  });

  const [chatDraft, setChatDraft] = useState("");
  const chatScrollRef = useRef(null);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  // Helper per costruire l'URL WebSocket corretto
  const getWsUrl = (id) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = 'localhost:8000'; 
    if (window.location.hostname.includes('vercel.app')) {
      host = 'projecto-production-feda.up.railway.app';
    }
    return `${protocol}//${host}/api/training/ws/shared-dashboard/${encodeURIComponent(id)}`;
  };

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const url = getWsUrl(shareId);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setDashboard(prev => ({ ...prev, isConnected: true, error: null }));
    };

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        // Normalizzazione dati in ingresso
        const dataPayload = msg.data || msg;
        const serverProjects = Array.isArray(dataPayload.projects) ? dataPayload.projects : [];
        const serverQuickTasks = Array.isArray(dataPayload.quickTasks) ? dataPayload.quickTasks : [];
        const serverChat = Array.isArray(dataPayload.chat) ? dataPayload.chat : [];
        const serverTitle = msg.title || "Progetti Condivisi";

        setDashboard(prev => ({
          ...prev,
          projects: serverProjects,
          quickTasks: serverQuickTasks,
          chat: serverChat,
          title: serverTitle,
          loading: false
        }));
        
        // Scroll chat to bottom on new messages
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 100);

      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      setDashboard(prev => ({ ...prev, isConnected: false }));
      // Riconnessione automatica
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error('WS Error', err);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [shareId]);

  // Invio aggiornamenti tramite WebSocket
  const sendUpdate = (newState) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        title: newState.title,
        data: {
          projects: newState.projects,
          quickTasks: newState.quickTasks,
          chat: newState.chat
        }
      }));
    }
  };

  // Helper per aggiornare lo stato locale e inviare subito
  const updateLocal = (updater) => {
    setDashboard(prev => {
      const nextPartial = typeof updater === 'function' ? updater(prev) : updater;
      const nextState = { ...prev, ...nextPartial };
      
      // Inviamo l'aggiornamento al server (fire and forget)
      sendUpdate(nextState);
      
      return nextState;
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

  const sendChatMessage = () => {
    if (!chatDraft.trim()) return;
    
    // Generiamo un ID mittente persistente (semplificato)
    let senderId = localStorage.getItem('km-chat-sender-id');
    if (!senderId) {
      senderId = uid('user');
      localStorage.setItem('km-chat-sender-id', senderId);
    }

    const msg = {
      id: uid('msg'),
      text: chatDraft.trim(),
      senderId: senderId,
      timestamp: Date.now()
    };
    
    updateLocal(prev => ({
      chat: [...(prev.chat || []), msg]
    }));
    setChatDraft("");
    
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const [projectTaskDrafts, setProjectTaskDrafts] = useState({});
  const [quickTaskDraft, setQuickTaskDraft] = useState("");

  if (dashboard.loading) return <div className="p-8 text-center text-gray-500 font-medium">Connessione in corso...</div>;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 p-4 sm:p-8 md:p-10 font-sans selection:bg-indigo-500/30 antialiased overflow-x-hidden relative">
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
                {dashboard.isConnected ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/20"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Reconnecting...
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

        {/* SIDEBAR: QUICK TASKS & CHAT */}
        <aside className="w-full lg:w-72 shrink-0 order-1 lg:order-2 pt-[76px] space-y-6">
          {/* QUICK TASKS */}
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm min-h-[300px] flex flex-col">
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
                  onKeyDown={(e) => e.key === 'Enter' && addQuickTask(quickTaskDraft)}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-amber-500 transition-colors"
                />
                <button 
                  onClick={() => { addQuickTask(quickTaskDraft); setQuickTaskDraft(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
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

          {/* CHAT BOX */}
          <div className="bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Icons.MessageCircle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px] custom-scrollbar mb-3" ref={chatScrollRef}>
              {dashboard.chat.map((msg) => {
                const isMe = msg.senderId === localStorage.getItem('km-chat-sender-id');
                // Colore univoco basato sull'ID del mittente per chi non sono io
                const senderColor = isMe ? '' : `hsl(${parseInt(msg.senderId.slice(-4), 16) % 360}, 70%, 45%)`;
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[90%] p-2.5 rounded-2xl text-xs shadow-sm ${
                        isMe 
                          ? 'bg-indigo-500 text-white rounded-tr-none' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {!isMe && (
                        <span className="block text-[9px] font-bold mb-0.5 opacity-80" style={{ color: senderColor }}>
                          User {msg.senderId.slice(0,4)}
                        </span>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              {dashboard.chat.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50 py-10">
                  <Icons.MessageCircle className="w-8 h-8" />
                  <p className="text-[10px]">Inizia a chattare</p>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="relative">
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Messaggio..."
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={!chatDraft.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-600 disabled:opacity-30 transition-colors"
              >
                <Icons.Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>

      </div>
    </div>
  );
}
