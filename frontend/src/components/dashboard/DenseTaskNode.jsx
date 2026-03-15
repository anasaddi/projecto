import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';

const MAX_TASK_DEPTH = 2;

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
  if (!deadlineKey || isDone) return 'text-gray-400 bg-gray-50 dark:bg-gray-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';
}

export function DenseTaskNode({ node, depth, projectId, projectAccent, onToggle, onDelete, onRename, onDeadline, onAddChild, onToggleTop3, onMove, hasFreeTop3Slot = true, checkIsTop3 = () => false, parentId = null }) {
  const isTop3 = checkIsTop3(node.id);
  const [draft, setDraft] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
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
              className="flex-1 bg-transparent border-b border-indigo-400 outline-none text-xs py-0.5 text-zinc-900 dark:text-zinc-100"
            />
          ) : (
            <span className={`flex-1 break-words text-xs leading-relaxed ${node.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300 font-medium'}`}>
              {node.title}
            </span>
          )}
          
          {/* Deadline pill */}
          {node.deadline && !editing && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeadline(true); }}
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tabular-nums border border-transparent hover:border-current transition-colors ${getDeadlineColorClass(node.deadline, node.done)}`}
            >
              {formatDeadline(node.deadline)}
            </button>
          )}
        </div>

        {/* Hover Actions */}
        <div className={`flex items-center gap-0.5 transition-opacity ml-1 pr-1 ${isTop3 ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}>
          {!node.done && (isTop3 || hasFreeTop3Slot) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleTop3(projectId, node.id); }} 
              className={`dashboard-action-btn ${isTop3 ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`} 
              title={isTop3 ? "Remove from Focus" : "Pin to Focus"}
            >
              <Icons.Target className="h-3 w-3" />
            </button>
          )}
          {canAddChild && !node.done && (
            <button onClick={(e) => { e.stopPropagation(); setOpenAdd(true); }} className="dashboard-action-btn text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Subtask">
              <Icons.Plus className="h-3 w-3" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setShowDeadline(true); }} className="dashboard-action-btn text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5" title="Deadline">
            <Icons.Calendar className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="dashboard-action-btn text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5" title="Rinomina">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="dashboard-action-btn text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Elimina">
            <Icons.X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Inline Deadline Editor */}
        {showDeadline && (
          <div className="absolute z-20 top-0 right-0 mt-8 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 p-3 animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scadenza</h4>
              <button onClick={() => setShowDeadline(false)}><Icons.X className="h-3 w-3" /></button>
            </div>
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/5 rounded-lg p-2 text-xs mb-3 outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button onClick={() => { setDeadlineInput(''); onDeadline?.(node.id, null); setShowDeadline(false); }} className="flex-1 py-1.5 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5 transition-colors">Rimuovi</button>
              <button onClick={handleDeadlineSave} className="flex-1 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">Salva</button>
            </div>
          </div>
        )}
      </div>

      {/* Children rendering */}
      {expanded && hasChildren && (
        <div className="ml-2.5 pl-2.5 border-l border-zinc-100 dark:border-white/[0.04] space-y-0.5 flex flex-col w-full">
          {node.children.map((child) => (
            <DenseTaskNode
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              projectAccent={projectAccent}
              onToggle={onToggle}
              onDelete={onDelete}
              onRename={onRename}
              onDeadline={onDeadline}
              onAddChild={onAddChild}
              onToggleTop3={onToggleTop3}
              onMove={onMove}
              parentId={node.id}
              hasFreeTop3Slot={hasFreeTop3Slot}
              checkIsTop3={checkIsTop3}
            />
          ))}
        </div>
      )}

      {/* Inline subtask creation */}
      {openAdd && (
        <div className="ml-5 mt-1 animate-slide-down">
          <input
            autoFocus
            type="text"
            placeholder="Nuova sotto-attività..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) { onAddChild(node.id, draft); setDraft(''); setOpenAdd(false); }
              if (e.key === 'Escape') { setDraft(''); setOpenAdd(false); }
            }}
            onBlur={() => { if (!draft.trim()) setOpenAdd(false); }}
            className="w-full bg-transparent border-b border-indigo-400/50 outline-none text-xs py-0.5 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}
    </div>
  );
}
