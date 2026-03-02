import { useEffect, useMemo, useRef, useState } from 'react'
import { useDashboardStats } from '../context/DashboardStatsContext'

/** Design system: stone, sky, amber, emerald, rose. Layout progetti: bento-style (SaaSFrame, Linear, Notion) – size=hierarchy, gutter uniformi, hover scale+shadow. */
const STORAGE_KEY = 'km-dashboard-v1'
const MAX_TASK_DEPTH = 2 // task -> subtask -> sub-subtask
const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
}

function toDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromDateKey(value) {
  if (!value) return null
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date)
  const mondayOffset = (d.getDay() + 6) % 7
  return addDays(d, -mondayOffset)
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1)
}

const DEFAULT_HABITS = [
  { id: 'daily-no-nut', title: '🚫 No nut', locked: false },
  { id: 'daily-workout', title: '💪 Workout', locked: false },
  { id: 'daily-pray', title: '🕌 Pray', locked: false },
  { id: 'daily-sleep', title: '😴 Sleep 7.5h+', locked: false },
  { id: 'daily-no-smoke', title: '🚭 No smoke', locked: true },
  { id: 'daily-read', title: '📖 Read', locked: true },
  { id: 'daily-journal', title: '📓 Journaling', locked: true },
  { id: 'daily-no-nails', title: '✋ No nail biting', locked: true },
]

function buildDefaultState() {
  return {
    dailyTaskTemplates: DEFAULT_HABITS.map((h) => ({ ...h, id: uid('daily') })),
    dailyTaskLogs: {},
    projects: [
      {
        id: uid('project'),
        title: 'Personal system upgrade',
        active: true,
        tasks: [
          {
            id: uid('task'),
            title: 'Define weekly goals',
            done: false,
            priority: 4,
            children: [
              { id: uid('task'), title: 'Draft goals', done: true, priority: 3, children: [] },
              { id: uid('task'), title: 'Review and finalize', done: false, priority: 4, children: [] },
            ],
          },
        ],
      },
      {
        id: uid('project'),
        title: 'Blog & contenuti',
        active: true,
        tasks: [
          { id: uid('task'), title: 'Outline articolo dashboard', done: false, priority: 3, children: [] },
          { id: uid('task'), title: 'Pubblicare su Medium', done: false, priority: 2, children: [] },
        ],
      },
      {
        id: uid('project'),
        title: 'Health & routine',
        active: true,
        tasks: [
          { id: uid('task'), title: 'Scheda allenamento settimanale', done: false, priority: 4, children: [] },
        ],
      },
    ],
    prayerLogs: {},
    top3Manual: [null, null, null],
    quickTasks: [],
  }
}

function getExtraProjectByTitle(title) {
  if (title === 'Blog & contenuti') return { id: uid('project'), title: 'Blog & contenuti', active: true, tasks: [{ id: uid('task'), title: 'Outline articolo dashboard', done: false, priority: 3, children: [] }, { id: uid('task'), title: 'Pubblicare su Medium', done: false, priority: 2, children: [] }] }
  if (title === 'Health & routine') return { id: uid('project'), title: 'Health & routine', active: true, tasks: [{ id: uid('task'), title: 'Scheda allenamento settimanale', done: false, priority: 4, children: [] }] }
  return null
}

const DEFAULT_PROJECT_TITLES = ['Blog & contenuti', 'Health & routine']

function loadState() {
  const fallback = buildDefaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    const top3Raw = parsed?.top3Manual
    const top3Manual = Array.isArray(top3Raw) && top3Raw.length >= 3
      ? top3Raw.slice(0, 3).map((s) => {
          if (!s || typeof s !== 'object') return null
          if (s.quickTaskId) return { quickTaskId: s.quickTaskId }
          if (s.projectId && s.taskId) return { projectId: s.projectId, taskId: s.taskId }
          return null
        })
      : fallback.top3Manual
    let projects = Array.isArray(parsed?.projects) ? [...parsed.projects] : fallback.projects
    const existingTitles = new Set(projects.map((p) => p.title))
    DEFAULT_PROJECT_TITLES.forEach((title) => {
      if (!existingTitles.has(title)) {
        const proj = getExtraProjectByTitle(title)
        if (proj) { projects = [...projects, proj]; existingTitles.add(title) }
      }
    })
    const rawDaily = parsed?.dailyTaskTemplates
    const hasNewHabits = Array.isArray(rawDaily) && rawDaily.length > 0 && rawDaily.some((t) => /No nut|Workout|Pray|Sleep 7\.5h|No smoke|Read|Journaling|No nail/i.test(t.title || ''))
    const dailyTaskTemplates = hasNewHabits
      ? rawDaily.map((t) => ({ ...t, category: t.category || 'routine', locked: t.locked === true }))
      : fallback.dailyTaskTemplates
    return {
      dailyTaskTemplates,
      dailyTaskLogs: parsed?.dailyTaskLogs && typeof parsed.dailyTaskLogs === 'object' ? parsed.dailyTaskLogs : {},
      projects,
      prayerLogs: parsed?.prayerLogs && typeof parsed.prayerLogs === 'object' ? parsed.prayerLogs : {},
      top3Manual,
      quickTasks: Array.isArray(parsed?.quickTasks) ? parsed.quickTasks : fallback.quickTasks,
    }
  } catch (_) {
    return fallback
  }
}

function findTaskInProjects(projects, projectId, taskId) {
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null
  let found = null
  function walk(nodes) {
    for (const n of nodes || []) {
      if (n.id === taskId) { found = { node: n, projectTitle: project.title }; return }
      if (Array.isArray(n.children) && n.children.length) walk(n.children)
    }
  }
  walk(project.tasks)
  return found
}

function resolveTop3Slots(projects, top3Manual, quickTasks = []) {
  return top3Manual.map((slot) => {
    if (!slot) return null
    if (slot.quickTaskId) {
      const qt = quickTasks.find((t) => t.id === slot.quickTaskId)
      if (!qt) return { ...slot, missing: true }
      return {
        ...slot,
        title: qt.title,
        projectTitle: 'Task veloce',
        done: qt.done,
        isQuick: true,
      }
    }
    const res = findTaskInProjects(projects, slot.projectId, slot.taskId)
    if (!res) return { ...slot, missing: true }
    return {
      ...slot,
      title: res.node.title,
      projectTitle: res.projectTitle,
      priority: res.node.priority,
      done: res.node.done,
    }
  })
}

function formatPercent(ratio) {
  if (!Number.isFinite(ratio)) return '0%'
  return `${Math.round(ratio * 100)}%`
}

function formatCountdown(ms) {
  const safe = Math.max(0, ms)
  const totalSec = Math.floor(safe / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

const POMODORO_DURATION = 25 * 60 // seconds
const POMODORO_STORAGE = 'km-pomodoro'

function PomodoroTimer() {
  const [remaining, setRemaining] = useState(POMODORO_DURATION)
  const [status, setStatus] = useState('idle') // idle | running | paused
  const [sessionsToday, setSessionsToday] = useState(0)
  const intervalRef = useRef(null)

  const todayKey = toDateKey(new Date())

  useEffect(() => {
    const stored = localStorage.getItem(POMODORO_STORAGE)
    if (stored) {
      try {
        const { date, sessions } = JSON.parse(stored)
        if (date === todayKey) setSessionsToday(sessions)
      } catch (_) {}
    }
  }, [todayKey])

  useEffect(() => {
    if (status !== 'running') return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setStatus('idle')
          setSessionsToday((s) => {
            const next = s + 1
            localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ date: todayKey, sessions: next }))
            if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') {
              new window.Notification('Pomodoro completato!')
            }
            return next
          })
          return POMODORO_DURATION
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [status, todayKey])

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const progress = 1 - remaining / POMODORO_DURATION

  return (
    <div className="rounded-2xl border-[1.5px] border-stone-200/90 bg-white shadow-xl shadow-stone-200/20 dark:border-stone-600/50 dark:bg-stone-800/95 dark:shadow-stone-950/40 ring-1 ring-stone-900/5 dark:ring-white/5">
      <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-stone-100 dark:border-stone-600/50 bg-stone-50/30 dark:bg-stone-800/50">
        <span className="text-[9px] uppercase tracking-widest font-black text-stone-700 dark:text-stone-200">Pomodoro</span>
        <span className="text-[9px] font-black tabular-nums px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">{sessionsToday} oggi</span>
      </div>
      <div className="p-2">
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-200 dark:text-stone-600" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="url(#pomodoroGrad)" strokeWidth="2" strokeLinecap="round" className="transition-all duration-1000" strokeDasharray={100} strokeDashoffset={100 - progress * 100} />
              <defs>
                <linearGradient id="pomodoroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums tracking-tight text-stone-800 dark:text-stone-100">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {status === 'idle' && (
              <button type="button" onClick={() => { setStatus('running'); setRemaining(POMODORO_DURATION) }} className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-[9px] uppercase tracking-widest font-black text-white shadow-md shadow-sky-500/30 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg transition-all active:scale-95">
                Avvia
              </button>
            )}
            {status === 'running' && (
              <button type="button" onClick={() => setStatus('paused')} className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[9px] uppercase tracking-widest font-black text-white shadow-md shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-95">
                Pausa
              </button>
            )}
            {status === 'paused' && (
              <>
                <button type="button" onClick={() => setStatus('running')} className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-[9px] uppercase tracking-widest font-black text-white shadow-md shadow-sky-500/30 hover:from-sky-600 hover:to-sky-700 transition-all active:scale-95">
                  Riprendi
                </button>
                <button type="button" onClick={() => { setStatus('idle'); setRemaining(POMODORO_DURATION) }} className="rounded-xl bg-stone-400 px-4 py-2 text-[9px] uppercase tracking-widest font-black text-white hover:bg-stone-500 transition-colors active:scale-95">
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CountdownRing({ label, value, elapsed }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const filled = Math.min(1, Math.max(0, elapsed)) * circ
  const remaining = Math.round((1 - elapsed) * 100)
  const gradId = `countdownGrad-${label}`
  return (
    <div className="flex flex-col items-center rounded-xl border-[1.5px] border-stone-100 dark:border-stone-600/50 bg-gradient-to-b from-amber-50/50 to-stone-50/50 dark:from-amber-950/20 dark:to-stone-800/50 p-2.5 transition-all hover:from-amber-50 dark:hover:from-amber-950/40 hover:border-[1.5px]-amber-200 dark:hover:border-[1.5px]-amber-800/50 hover:shadow-md">
      <div className="relative inline-flex">
        <svg width="52" height="52" className="-rotate-90">
          <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-100 dark:text-amber-900/50" />
          <circle
            cx="26" cy="26" r={r}
            fill="none" stroke={`url(#${gradId})`} strokeWidth="3" strokeLinecap="round"
            className="transition-all duration-500"
            strokeDasharray={circ}
            strokeDashoffset={circ - filled}
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums text-amber-800 dark:text-amber-200">
          {remaining}%
        </span>
      </div>
      <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</span>
      <span className="mt-0.5 text-[9px] font-black tabular-nums text-stone-700 dark:text-stone-300">{value}</span>
    </div>
  )
}

function createTaskNode(title) {
  return {
    id: uid('task'),
    title: title.trim(),
    done: false,
    priority: 3,
    children: [],
    deadline: undefined,
  }
}

function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node)
    return {
      ...node,
      children: updateNodeInTree(Array.isArray(node.children) ? node.children : [], nodeId, updater),
    }
  })
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: removeNodeFromTree(Array.isArray(node.children) ? node.children : [], nodeId),
    }))
}

function countTreeStats(nodes) {
  let total = 0
  let completed = 0
  const walk = (arr) => {
    arr.forEach((n) => {
      total += 1
      if (n.done) completed += 1
      if (Array.isArray(n.children) && n.children.length) walk(n.children)
    })
  }
  walk(nodes || [])
  return { total, completed, ratio: total ? completed / total : 0 }
}

function formatDeadline(dateKey) {
  if (!dateKey) return ''
  const d = fromDateKey(dateKey)
  if (!d) return dateKey
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function ProjectTaskNode({
  node,
  depth,
  projectId,
  onToggle,
  onDelete,
  onRename,
  onDeadline,
  onAddChild,
  getTop3SlotIndex,
  onAddToTop3,
  onRemoveFromTop3,
}) {
  const [draft, setDraft] = useState('')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showDeadline, setShowDeadline] = useState(false)
  const canAddChild = depth < MAX_TASK_DEPTH
  const top3SlotIndex = getTop3SlotIndex ? getTop3SlotIndex(projectId, node.id) : -1
  const isInTop3 = top3SlotIndex >= 0

  const handleRename = (value) => {
    if (onRename && value.trim()) onRename(node.id, value.trim())
    setEditing(false)
  }

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'project', projectId, taskId: node.id }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className="group/task relative cursor-grab active:cursor-grabbing rounded-xl border-[1.5px] border-stone-200/80 dark:border-stone-600/80 bg-white dark:bg-stone-800 px-3 py-2.5 pr-6 shadow-md hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50/80 dark:hover:bg-stone-700/50 transition-all duration-200"
      draggable
      onDragStart={handleDragStart}
    >
      <button
        type="button"
        onClick={() => onDelete(node.id)}
        className="absolute right-1.5 top-2 rounded p-1 text-stone-400 hover:text-rose-500 opacity-0 group-hover/task:opacity-100 transition-opacity"
        aria-label="Rimuovi"
        title="Rimuovi"
      >
        ×
      </button>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={Boolean(node.done)}
          onChange={(e) => onToggle(node.id, e.target.checked)}
          className="h-4 w-4 shrink-0 mt-0.5 rounded border-stone-300 text-sky-600"
        />
        <div className="min-w-0 flex-1">
        {editing && onRename ? (
          <input
            autoFocus
            defaultValue={node.title}
            onBlur={(e) => handleRename(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(e.target.value); if (e.key === 'Escape') setEditing(false) }}
            className="w-full rounded border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 px-1.5 py-0.5 text-[10px] focus:border-sky-400 focus:outline-none"
          />
        ) : (
          <p
            onClick={() => onRename && setEditing(true)}
            className={`text-[10px] break-words cursor-text hover:text-sky-600 ${node.done ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-200'}`}
            title="Clicca per modificare"
          >
            {node.title}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap opacity-0 group-hover/task:opacity-100 transition-opacity">
          {canAddChild && (
            <button type="button" onClick={() => setOpenAdd((v) => !v)} className="text-[10px] text-stone-400 hover:text-sky-600 dark:hover:text-sky-400" title="Aggiungi sottotask">+ sottotask</button>
          )}
          {onAddToTop3 && (
            <button
              type="button"
              onClick={() => { if (isInTop3 && onRemoveFromTop3 && top3SlotIndex >= 0) onRemoveFromTop3(top3SlotIndex); else if (!isInTop3) onAddToTop3(projectId, node.id) }}
              aria-pressed={isInTop3}
              title={isInTop3 ? 'Rimuovi da Top 3' : 'Aggiungi a Top 3'}
              className={`text-[10px] ${isInTop3 ? 'text-sky-600 dark:text-sky-400 font-medium' : 'text-stone-400 hover:text-sky-600 dark:hover:text-sky-400'}`}
            >Top 3</button>
          )}
          {onDeadline && (showDeadline ? (
            <input
              type="date"
              defaultValue={node.deadline || ''}
              onBlur={(e) => { onDeadline(node.id, e.target.value || null); setShowDeadline(false) }}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowDeadline(false) }}
              className="rounded border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 px-1.5 py-0.5 text-[10px] w-28 focus:border-sky-400 focus:outline-none"
            />
          ) : (
            <button type="button" onClick={() => setShowDeadline(true)} className={`text-[10px] ${node.deadline ? 'text-amber-600' : 'text-stone-400 hover:text-amber-600'}`} title="Scadenza">📅</button>
          ))}
          {node.deadline && !editing && !showDeadline && <span className="text-[10px] text-amber-600 dark:text-amber-400 tabular-nums">{formatDeadline(node.deadline)}</span>}
        </div>
        {openAdd && canAddChild && !editing && (
          <div className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nuovo sottotask..."
              className="min-w-0 flex-1 rounded border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 px-2 py-1 text-[9px] focus:border-sky-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const t = draft.trim()
                if (!t) return
                onAddChild(node.id, t)
                setDraft('')
                setOpenAdd(false)
              }}
              className="rounded bg-sky-600 px-2 py-1 text-[9px] text-white hover:bg-sky-700"
            >
              Aggiungi
            </button>
          </div>
        )}
        </div>
      </div>

      {Array.isArray(node.children) && node.children.length > 0 ? (
        <div className="mt-2 space-y-2 border-l border-stone-200 dark:border-stone-600 pl-1.5 ml-0.5">
          {node.children.map((child) => (
            <ProjectTaskNode
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              onToggle={onToggle}
              onDelete={onDelete}
              onRename={onRename}
              onDeadline={onDeadline}
              onAddChild={onAddChild}
              getTop3SlotIndex={getTop3SlotIndex}
              onAddToTop3={onAddToTop3}
              onRemoveFromTop3={onRemoveFromTop3}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function Dashboard2() {
  const initial = useMemo(() => loadState(), [])
  const { setStats } = useDashboardStats()

  const [dailyTaskTemplates, setDailyTaskTemplates] = useState(initial.dailyTaskTemplates)
  const [dailyTaskLogs, setDailyTaskLogs] = useState(initial.dailyTaskLogs)
  const [projects, setProjects] = useState(initial.projects)
  const [prayerLogs, setPrayerLogs] = useState(initial.prayerLogs)
  const [top3Manual, setTop3Manual] = useState(initial.top3Manual || [null, null, null])
  const [quickTasks, setQuickTasks] = useState(initial.quickTasks || [])
  const [quickTaskDraft, setQuickTaskDraft] = useState('')
  const [openQuickAddParentId, setOpenQuickAddParentId] = useState(null)

  const [dailyTaskDraft, setDailyTaskDraft] = useState('')
  const [editingDailyId, setEditingDailyId] = useState(null)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [projectDraft, setProjectDraft] = useState('')
  const [projectTaskDrafts, setProjectTaskDrafts] = useState({})
  const [customStart, setCustomStart] = useState(toDateKey(startOfMonth(new Date())))
  const [customEnd, setCustomEnd] = useState(toDateKey(new Date()))
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dailyTaskTemplates,
          dailyTaskLogs,
          projects,
          prayerLogs,
          top3Manual,
          quickTasks,
        }),
      )
    } catch (_) {}
  }, [dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks])

  const todayKey = toDateKey(now)
  const todayTaskLog = dailyTaskLogs[todayKey] || {}
  const todayPrayerLog = prayerLogs[todayKey] || {}

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates])

  const completionRateForDate = (dateKey) => {
    if (!activeHabits.length) return 0
    const record = dailyTaskLogs[dateKey] || {}
    const done = activeHabits.reduce((acc, t) => acc + (record[t.id] ? 1 : 0), 0)
    return done / activeHabits.length
  }

  const averageRateInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = startOfDay(startDate)
    const end = startOfDay(endDate)
    if (start > end) return 0
    let cursor = new Date(start)
    let count = 0
    let sum = 0
    while (cursor <= end) {
      sum += completionRateForDate(toDateKey(cursor))
      count += 1
      cursor = addDays(cursor, 1)
    }
    return count ? sum / count : 0
  }

  const weekRate = useMemo(() => averageRateInRange(startOfWeek(now), now), [dailyTaskLogs, dailyTaskTemplates, now])
  const monthRate = useMemo(() => averageRateInRange(startOfMonth(now), now), [dailyTaskLogs, dailyTaskTemplates, now])
  const yearRate = useMemo(() => averageRateInRange(startOfYear(now), now), [dailyTaskLogs, dailyTaskTemplates, now])
  const customRate = useMemo(() => averageRateInRange(fromDateKey(customStart), fromDateKey(customEnd)), [dailyTaskLogs, dailyTaskTemplates, customStart, customEnd])

  const weeklyTableRows = useMemo(() => {
    const rows = []
    const weekStart = startOfWeek(now)
    for (let i = 0; i < 8; i++) {
      const start = addDays(weekStart, -7 * i)
      const end = i === 0 ? now : addDays(weekStart, -7 * i + 6)
      const rate = averageRateInRange(start, end)
      const label = i === 0 ? 'In corso' : `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}`
      rows.push({ label, rate })
    }
    return rows
  }, [dailyTaskLogs, dailyTaskTemplates, now])

  const monthlyTableRows = useMemo(() => {
    const rows = []
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = startOfMonth(d)
      const end = addDays(new Date(d.getFullYear(), d.getMonth() + 1, 0), 0)
      const rate = averageRateInRange(start, end)
      rows.push({ label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, rate })
    }
    return rows
  }, [dailyTaskLogs, dailyTaskTemplates, now])

  const yearlyTableRows = useMemo(() => {
    const rows = []
    const y = now.getFullYear()
    for (let i = 0; i < 5; i++) {
      const year = y - i
      const start = new Date(year, 0, 1)
      const end = new Date(year, 11, 31)
      const rate = averageRateInRange(start, end)
      rows.push({ label: String(year), rate })
    }
    return rows
  }, [dailyTaskLogs, dailyTaskTemplates, now])

  const todayDone = activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0)
  const todayRate = activeHabits.length ? todayDone / activeHabits.length : 0

  const focusStreak = useMemo(() => {
    let streak = 0
    let cursor = startOfDay(now)
    while (true) {
      const key = toDateKey(cursor)
      const rate = completionRateForDate(key)
      if (rate >= 1) streak += 1
      else break
      cursor = addDays(cursor, -1)
      if (streak > 365) break
    }
    return streak
  }, [dailyTaskLogs, dailyTaskTemplates, now])

  const toggleDailyTask = (taskId, value) => {
    setDailyTaskLogs((prev) => ({
      ...prev,
      [todayKey]: {
        ...(prev[todayKey] || {}),
        [taskId]: value,
      },
    }))
  }

  const addDailyTask = () => {
    const title = dailyTaskDraft.trim()
    if (!title) return
    setDailyTaskTemplates((prev) => [...prev, { id: uid('daily'), title, category: 'routine' }])
    setDailyTaskDraft('')
  }

  const removeDailyTask = (taskId) => {
    setDailyTaskTemplates((prev) => prev.filter((t) => t.id !== taskId))
    setDailyTaskLogs((prev) => {
      const next = {}
      Object.keys(prev).forEach((dateKey) => {
        next[dateKey] = { ...(prev[dateKey] || {}) }
        delete next[dateKey][taskId]
      })
      return next
    })
    setEditingDailyId(null)
  }

  const updateDailyTask = (taskId, newTitle) => {
    const t = newTitle.trim()
    setEditingDailyId(null)
    if (!t) return
    setDailyTaskTemplates((prev) => prev.map((x) => (x.id === taskId ? { ...x, title: t } : x)))
  }

  const createProject = () => {
    const title = projectDraft.trim()
    if (!title) return
    setProjects((prev) => [...prev, { id: uid('project'), title, active: true, tasks: [] }])
    setProjectDraft('')
  }

  const updateProject = (projectId, updater) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updater(p) : p)))
  }

  const renameProject = (projectId, newTitle) => {
    const t = newTitle.trim()
    if (!t) return
    updateProject(projectId, (p) => ({ ...p, title: t }))
    setEditingProjectId(null)
  }

  const addRootTask = (projectId) => {
    const title = (projectTaskDrafts[projectId] || '').trim()
    if (!title) return
    updateProject(projectId, (p) => ({
      ...p,
      tasks: [...(p.tasks || []), createTaskNode(title)],
    }))
    setProjectTaskDrafts((prev) => ({ ...prev, [projectId]: '' }))
  }

  const toggleProjectTask = (projectId, taskId, value) => {
    updateProject(projectId, (p) => ({
      ...p,
      tasks: updateNodeInTree(p.tasks || [], taskId, (node) => ({ ...node, done: value })),
    }))
  }

  const setProjectTaskPriority = (projectId, taskId, priority) => {
    updateProject(projectId, (p) => ({
      ...p,
      tasks: updateNodeInTree(p.tasks || [], taskId, (node) => ({ ...node, priority })),
    }))
  }

  const addProjectChildTask = (projectId, taskId, title) => {
    updateProject(projectId, (p) => ({
      ...p,
      tasks: updateNodeInTree(p.tasks || [], taskId, (node) => ({
        ...node,
        children: [...(node.children || []), createTaskNode(title)],
      })),
    }))
  }

  const renameProjectTask = (projectId, taskId, newTitle) => {
    const t = newTitle.trim()
    if (!t) return
    updateProject(projectId, (p) => ({
      ...p,
      tasks: updateNodeInTree(p.tasks || [], taskId, (node) => ({ ...node, title: t })),
    }))
  }

  const setProjectTaskDeadline = (projectId, taskId, dateKey) => {
    updateProject(projectId, (p) => ({
      ...p,
      tasks: updateNodeInTree(p.tasks || [], taskId, (node) => ({ ...node, deadline: dateKey || undefined })),
    }))
  }

  const deleteProjectTask = (projectId, taskId) => {
    updateProject(projectId, (p) => ({
      ...p,
      tasks: removeNodeFromTree(p.tasks || [], taskId),
    }))
  }

  const togglePrayer = (prayerName, value) => {
    setPrayerLogs((prev) => ({
      ...prev,
      [todayKey]: {
        ...(prev[todayKey] || {}),
        [prayerName]: value,
      },
    }))
  }

  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, quickTasks), [projects, top3Manual, quickTasks])
  const top3DoneCount = top3Resolved.filter((s) => s && !s.missing && s.done).length
  const top3Score = top3DoneCount / 3
  const prayerDone = PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0)

  const todayFocusScore = todayRate * 0.4 + top3Score * 0.4 + (prayerDone / PRAYERS.length) * 0.2
  const totalFocusItems = activeHabits.length + PRAYERS.length + 3
  const doneFocusItems = todayDone + prayerDone + top3DoneCount

  const addToTop3 = (projectId, taskId) => {
    if (top3Manual.some((s) => s && s.projectId === projectId && s.taskId === taskId)) return
    setTop3Manual((prev) => {
      const next = [...prev]
      const free = next.findIndex((s) => !s)
      if (free === -1) return prev
      next[free] = { projectId, taskId }
      return next
    })
  }

  const [quickTaskDrafts, setQuickTaskDrafts] = useState({})
  const quickSubtaskInputRef = useRef(null)
  const addQuickTask = () => {
    const title = quickTaskDraft.trim()
    if (!title) return
    setQuickTasks((prev) => [...prev, { id: uid('quick'), title, done: false }])
    setQuickTaskDraft('')
  }
  const addQuickTaskChild = (parentId, title) => {
    const fromInput = quickSubtaskInputRef.current?.value
    const t = String(title ?? fromInput ?? quickTaskDrafts[parentId] ?? '').trim()
    if (!t) return
    setQuickTasks((prev) => [...prev, { id: uid('quick'), title: t, done: false, parentId }])
    setQuickTaskDrafts((d) => ({ ...d, [parentId]: '' }))
    if (quickSubtaskInputRef.current) quickSubtaskInputRef.current.value = ''
  }
  const toggleQuickTask = (taskId, value) => {
    setQuickTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: value } : t)))
  }
  const removeQuickTask = (taskId) => {
    setQuickTasks((prev) => prev.filter((t) => t.id !== taskId && t.parentId !== taskId))
  }

  const removeFromTop3 = (index) => {
    setTop3Manual((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  const setTop3SlotAtIndex = (slotIndex, entry) => {
    setTop3Manual((prev) => {
      const next = [...prev]
      const sameEntry = (a, b) => {
        if (!a || !b) return false
        if (a.quickTaskId && b.quickTaskId) return a.quickTaskId === b.quickTaskId
        return a.projectId === b.projectId && a.taskId === b.taskId
      }
      for (let i = 0; i < next.length; i++) {
        if (i !== slotIndex && sameEntry(next[i], entry)) next[i] = null
      }
      next[slotIndex] = entry
      return next
    })
  }

  const isInTop3 = (projectId, taskId) =>
    top3Manual.some((s) => s && s.projectId === projectId && s.taskId === taskId)

  const getTop3SlotIndex = (projectId, taskId) =>
    top3Manual.findIndex((s) => s && s.projectId === projectId && s.taskId === taskId)

  const getTop3SlotIndexForQuick = (quickTaskId) =>
    top3Manual.findIndex((s) => s && s.quickTaskId === quickTaskId)

  const addQuickTaskToTop3 = (quickTaskId) => {
    if (top3Manual.some((s) => s && s.quickTaskId === quickTaskId)) return
    const free = top3Manual.findIndex((s) => !s)
    if (free === -1) return
    setTop3SlotAtIndex(free, { quickTaskId })
  }

  const [draggedTop3Index, setDraggedTop3Index] = useState(null)
  const top3SectionRef = useRef(null)

  const reorderTop3 = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    setTop3Manual((prev) => {
      const next = [...prev]
      ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
      return next
    })
    setDraggedTop3Index(null)
  }

  useEffect(() => {
    setStats({ doneFocusItems, totalFocusItems })
    return () => setStats(null)
  }, [doneFocusItems, totalFocusItems, setStats])

  useEffect(() => {
    setProjects((prev) => {
      if (prev.length >= 3) return prev
      const existing = new Set(prev.map((p) => p.title))
      const toAdd = DEFAULT_PROJECT_TITLES.filter((t) => !existing.has(t)).map((t) => getExtraProjectByTitle(t)).filter(Boolean)
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
  }, [])

  const countdownItems = useMemo(() => {
    const nowDate = new Date(now)
    const startDay = startOfDay(nowDate)
    const endOfDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1)
    const startW = startOfWeek(nowDate)
    const endOfWeek = addDays(startW, 7)
    const startM = startOfMonth(nowDate)
    const endOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1)
    const startY = startOfYear(nowDate)
    const endOfYear = new Date(nowDate.getFullYear() + 1, 0, 1)
    const totalDay = endOfDay - startDay
    const totalWeek = endOfWeek - startW
    const totalMonth = endOfMonth - startM
    const totalYear = endOfYear - startY
    return [
      { label: 'Day', value: formatCountdown(endOfDay - nowDate), elapsed: (nowDate - startDay) / totalDay, total: totalDay },
      { label: 'Week', value: formatCountdown(endOfWeek - nowDate), elapsed: (nowDate - startW) / totalWeek, total: totalWeek },
      { label: 'Month', value: formatCountdown(endOfMonth - nowDate), elapsed: (nowDate - startM) / totalMonth, total: totalMonth },
      { label: 'Year', value: formatCountdown(endOfYear - nowDate), elapsed: (nowDate - startY) / totalYear, total: totalYear },
    ]
  }, [now])

  const cardClass = 'overflow-hidden rounded-2xl border-[1.5px] border-stone-200/90 bg-white shadow-xl shadow-stone-200/20 dark:border-stone-600/50 dark:bg-stone-800/95 dark:shadow-stone-950/40 backdrop-blur-sm'

  return (
    <div className="h-full min-h-screen select-none bg-[linear-gradient(135deg,_#fafaf9_0%,_#f5f5f4_50%,_#e7e5e4_100%)] dark:bg-[linear-gradient(135deg,_#1c1917_0%,_#292524_50%,_#44403c_100%)] px-5 py-6 overflow-y-auto transition-colors">
      <div className="grid min-h-[28rem] grid-cols-1 gap-2 xl:grid-cols-[1fr_300px] xl:grid-rows-[auto_1fr]">
        {/* Hero e (Pomodoro+Top3) in row 1: bordo sotto Top 3 allineato con bordo sotto Hero */}
        <section className={cardClass + ' xl:row-start-1 xl:col-start-1 ring-1 ring-stone-900/5 dark:ring-white/5'}>
            <div className="px-6 py-6">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[9px] uppercase tracking-widest font-black uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">Focus</span>
                <span className="text-2xl font-extrabold tabular-nums tracking-tight text-stone-800 dark:text-stone-50">{doneFocusItems}<span className="text-stone-400 dark:text-stone-500 font-bold">/{totalFocusItems}</span></span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">completati</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="text-stone-500 dark:text-stone-400">Mancano: <span className="font-semibold tabular-nums text-stone-700 dark:text-stone-200">{totalFocusItems - doneFocusItems}</span> task</span>
                <span className="text-stone-300 dark:text-stone-600">·</span>
                <span className="text-stone-500 dark:text-stone-400">Streak: <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{focusStreak}</span> {focusStreak === 1 ? 'giorno' : 'giorni'}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700/80 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 dark:from-sky-500 dark:via-sky-400 dark:to-sky-300 transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                />
              </div>
            </div>
            <div className="border-[1.5px]-t border-stone-100 dark:border-stone-600/50 px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
              <span className="text-[9px] uppercase tracking-widest font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">Prayer</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRAYERS.map((prayer) => (
                  <label key={prayer} className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-lg hover:bg-white/60 dark:hover:bg-stone-700/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(todayPrayerLog[prayer])}
                      onChange={(e) => togglePrayer(prayer, e.target.checked)}
                      className="h-4 w-4 rounded-md border-stone-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 transition-all"
                    />
                    <span className={`text-[9px] uppercase tracking-widest font-black transition-colors ${todayPrayerLog[prayer] ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300'}`}>{prayer}</span>
                  </label>
                ))}
              <span className="text-[9px] font-black tabular-nums text-emerald-600 dark:text-emerald-400 ml-1">{prayerDone}/5</span>
            </div>
            </div>

            {/* Abitudini (sx) + Task veloci (dx) affiancati */}
            <div className="border-[1.5px]-t border-stone-100 dark:border-stone-600/50 bg-stone-50/40 dark:bg-stone-800/40 grid grid-cols-1 sm:grid-cols-2 min-h-0">
              {/* Abitudini – task giornalieri con griglia settimanale */}
              <div className="px-5 py-4 border-[1.5px]-r-0 sm:border-[1.5px]-r border-stone-100 dark:border-stone-600/50 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-black uppercase tracking-[0.15em] text-sky-600 dark:text-sky-400">Abitudini</span>
                  <span className="text-[9px] font-black tabular-nums px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">{todayDone}/{activeHabits.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={dailyTaskDraft}
                    onChange={(e) => setDailyTaskDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDailyTask()}
                    placeholder="Nuova abitudine..."
                    className="flex-1 min-w-[120px] rounded-xl border-[1.5px] border-stone-200 bg-white dark:bg-stone-700/50 dark:border-stone-600/50 dark:text-stone-200 px-3 py-2 text-[10px] text-stone-800 placeholder:text-stone-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 focus:outline-none transition-all"
                  />
                  <button type="button" onClick={addDailyTask} className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-[10px] font-semibold text-white shadow-md shadow-sky-500/25 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all active:scale-95" aria-label="Aggiungi">
                    +
                  </button>
                </div>
                <ul className="mt-2 space-y-2">
                  {dailyTaskTemplates.length === 0 ? (
                    <li className="text-[10px] text-stone-400 dark:text-stone-500 italic">Nessuna abitudine</li>
                  ) : (() => {
                    const weekStart = startOfWeek(now)
                    const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i))
                    const dayLabels = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
                    return dailyTaskTemplates.map((task) => {
                      const isLocked = task.locked
                      const isEditing = !isLocked && editingDailyId === task.id
                      const activeList = dailyTaskTemplates.filter((t) => !t.locked)
                      const isActive = !isLocked && !todayTaskLog[task.id] && activeList.findIndex((t) => !todayTaskLog[t.id]) === activeList.indexOf(task)
                      return (
                        <li
                          key={task.id}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[9px] transition-all duration-300 border-[1.5px] ${isLocked ? 'bg-stone-50 dark:bg-stone-800/50 opacity-80 border-stone-100 dark:border-stone-700/50' : isActive ? 'bg-gradient-to-r from-sky-50 to-sky-100/50 dark:from-sky-900/30 dark:to-sky-950/30 ring-1 ring-sky-300/80 dark:ring-sky-600/50 border-sky-200/60' : 'bg-white dark:bg-stone-700/30 border-stone-200/80 dark:border-stone-600/40 shadow-sm'} ${todayTaskLog[task.id] ? 'opacity-80' : ''}`}
                        >
                          {isLocked ? (
                            <span className="text-stone-400 dark:text-stone-500 shrink-0" title="Da attivare in seguito">🔒</span>
                          ) : (
                            <label className="flex cursor-pointer items-center gap-1.5 min-w-0 flex-1 shrink">
                              <input
                                type="checkbox"
                                checked={Boolean(todayTaskLog[task.id])}
                                onChange={(e) => toggleDailyTask(task.id, e.target.checked)}
                                className="h-3.5 w-3.5 shrink-0 rounded border-stone-300 text-sky-600 focus:ring-2 focus:ring-sky-500/20"
                              />
                              {isEditing ? (
                                <input
                                  autoFocus
                                  defaultValue={task.title}
                                  onBlur={(e) => updateDailyTask(task.id, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') updateDailyTask(task.id, e.target.value); if (e.key === 'Escape') setEditingDailyId(null) }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="min-w-[80px] rounded border-[1.5px]-0 bg-transparent px-1 py-0 text-[9px] text-stone-800 dark:text-stone-200 focus:ring-0 focus:outline-none"
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingDailyId(task.id)}
                                  className={`truncate ${todayTaskLog[task.id] ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-300'} cursor-text hover:text-stone-900 dark:hover:text-stone-100`}
                                  title="Clicca per modificare"
                                >
                                  {task.title}
                                </span>
                              )}
                            </label>
                          )}
                          {isLocked ? (
                            <span className="truncate text-stone-500 dark:text-stone-400 flex-1 min-w-0">{task.title}</span>
                          ) : null}
                          {!isLocked && (
                            <div className="flex gap-0.5 shrink-0" title="Lun–Dom questa settimana">
                              {weekDays.map((day, i) => {
                                const dk = toDateKey(day)
                                const done = dailyTaskLogs[dk]?.[task.id]
                                const isToday = dk === todayKey
                                return (
                                  <span
                                    key={dk}
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-lg text-[9px] font-bold tabular-nums transition-all ${done ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-md shadow-sky-500/30' : isToday ? 'bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-300 ring-1 ring-stone-300/60 dark:ring-stone-500/50' : 'bg-stone-100 dark:bg-stone-700/50 text-stone-400 dark:text-stone-500'}`}
                                    title={dayLabels[i]}
                                  >
                                    {dayLabels[i]}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          {!isLocked && (
                            <button type="button" onClick={() => removeDailyTask(task.id)} className="shrink-0 rounded p-0.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30" aria-label="Elimina">×</button>
                          )}
                        </li>
                      )
                    })
                  })()}
                </ul>
              </div>

              {/* Task veloci – a destra di Abitudini */}
              <div className="px-5 py-4 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">Task veloci</span>
                  <span className="text-[9px] font-black tabular-nums px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{quickTasks.filter((t) => t.done).length}/{quickTasks.length || '0'}</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    value={quickTaskDraft}
                    onChange={(e) => setQuickTaskDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addQuickTask()}
                    placeholder="Aggiungi task veloce..."
                    className="min-w-0 flex-1 rounded-xl border-[1.5px] border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700/50 px-3 py-2 text-[10px] text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:border-[1.5px]-amber-400 focus:ring-2 focus:ring-amber-400/25 focus:outline-none transition-all"
                  />
                  <button type="button" onClick={addQuickTask} className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 text-[10px] font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 shrink-0 transition-all active:scale-95">
                    +
                  </button>
                </div>
                <ul className="space-y-2">
                  {quickTasks.length === 0 ? (
                    <li className="py-1 text-center text-[10px] text-stone-400 dark:text-stone-500 italic">Nessun task veloce</li>
                  ) : (() => {
                    const roots = quickTasks.filter((t) => !t.parentId)
                    const getChildren = (id) => quickTasks.filter((t) => t.parentId === id)
                    return roots.flatMap((task) => {
                      const children = getChildren(task.id)
                      const isInTop3 = getTop3SlotIndexForQuick(task.id) >= 0
                      const top3SlotIndex = getTop3SlotIndexForQuick(task.id)
                      return [
                        <li
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id }))
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          className="group/quick cursor-grab active:cursor-grabbing"
                        >
                          <div className="relative flex items-center gap-2 rounded-lg border-[1.5px] border-stone-200/80 dark:border-stone-600/80 bg-white dark:bg-stone-800 px-3 py-2 pr-6 shadow-sm hover:shadow hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all">
                          <input
                            type="checkbox"
                            checked={Boolean(task.done)}
                            onChange={(e) => toggleQuickTask(task.id, e.target.checked)}
                            className="h-4 w-4 shrink-0 rounded border-stone-300 text-sky-600"
                          />
                          <span className={`flex-1 min-w-0 truncate text-[10px] text-stone-800 dark:text-stone-200 ${task.done ? 'text-stone-400 line-through' : ''}`}>{task.title}</span>
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover/quick:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => { if (isInTop3) removeFromTop3(top3SlotIndex); else addQuickTaskToTop3(task.id) }}
                              className={`text-[10px] ${isInTop3 ? 'text-sky-600 dark:text-sky-400 font-medium' : 'text-stone-400 hover:text-sky-600 dark:hover:text-sky-400'}`}
                              title={isInTop3 ? 'Rimuovi da Top 3' : 'Aggiungi a Top 3'}
                            >Top 3</button>
                            {!task.parentId && (
                              <button
                                type="button"
                                onClick={() => setOpenQuickAddParentId(openQuickAddParentId === task.id ? null : task.id)}
                                className="text-[10px] text-stone-400 hover:text-sky-600 dark:hover:text-sky-400"
                                title="Aggiungi sottotask"
                              >+ sottotask</button>
                            )}
                          </div>
                          <button type="button" onClick={() => removeQuickTask(task.id)} className="absolute right-1.5 top-2 rounded p-1 text-stone-400 hover:text-rose-500" aria-label="Elimina">×</button>
                          </div>
                          {openQuickAddParentId === task.id && (
                            <div className="mt-2 ml-1.5 flex gap-2">
                              <input
                                ref={quickSubtaskInputRef}
                                defaultValue=""
                                key={task.id}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { addQuickTaskChild(task.id, e.target.value); setOpenQuickAddParentId(null) }
                                  if (e.key === 'Escape') setOpenQuickAddParentId(null)
                                }}
                                placeholder="Nuovo sottotask..."
                                className="flex-1 min-w-0 rounded border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 px-2 py-1 text-[9px] focus:border-sky-400 focus:outline-none"
                              />
                              <button type="button" onClick={() => { addQuickTaskChild(task.id); setOpenQuickAddParentId(null) }} className="rounded bg-sky-600 px-2 py-1 text-[9px] text-white hover:bg-sky-700">Aggiungi</button>
                            </div>
                          )}
                        </li>,
                        ...children.map((child) => (
                          <li
                            key={child.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: child.id }))
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            className="group/quick relative flex items-center gap-2 cursor-grab active:cursor-grabbing rounded-lg border-[1.5px] border-stone-200/80 dark:border-stone-600/80 bg-white dark:bg-stone-800 pl-5 pr-6 py-2 shadow-sm hover:shadow hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(child.done)}
                              onChange={(e) => toggleQuickTask(child.id, e.target.checked)}
                              className="h-4 w-4 shrink-0 rounded border-stone-300 text-sky-600"
                            />
                            <span className={`flex-1 min-w-0 truncate text-[10px] text-stone-800 dark:text-stone-200 ${child.done ? 'text-stone-400 line-through' : ''}`}>{child.title}</span>
                            <div className="flex shrink-0 opacity-0 group-hover/quick:opacity-100 transition-opacity">
                              {getTop3SlotIndexForQuick(child.id) >= 0 ? (
                                <button type="button" onClick={() => removeFromTop3(getTop3SlotIndexForQuick(child.id))} className="text-[9px] uppercase tracking-widest font-black text-sky-600 dark:text-sky-400">Top 3</button>
                              ) : (
                                <button type="button" onClick={() => addQuickTaskToTop3(child.id)} className="text-[10px] text-stone-400 hover:text-sky-600 dark:hover:text-sky-400">Top 3</button>
                              )}
                            </div>
                            <button type="button" onClick={() => removeQuickTask(child.id)} className="absolute right-1.5 top-2 rounded p-1 text-stone-400 hover:text-rose-500" aria-label="Elimina">×</button>
                          </li>
                        )),
                      ]
                    })
                  })()}
                </ul>
              </div>

            </div>
          </section>

            {/* Progetti – griglia card affiancate */}
            <section className={`${cardClass} min-w-0 xl:row-start-2 xl:col-start-1 ring-1 ring-stone-900/5 dark:ring-white/5`}>
              <div className="flex items-center justify-between gap-2 px-5 py-4 border-b-[1.5px] border-stone-100 dark:border-stone-600/50 bg-gradient-to-r from-sky-50/50 to-transparent dark:from-sky-950/20 dark:to-transparent">
                <h2 className="text-[10px] font-black text-stone-800 dark:text-stone-50 tracking-tight">Progetti</h2>
                <div className="flex gap-2 flex-1 max-w-sm">
                  <input
                    value={projectDraft}
                    onChange={(e) => setProjectDraft(e.target.value)}
                    placeholder="Nuovo progetto..."
                    className="min-w-0 flex-1 rounded-lg border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-700/50 px-3 py-2 text-[10px] placeholder:text-stone-400 focus:border-sky-400 focus:bg-white dark:focus:bg-stone-700/80 focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-colors"
                  />
                  <button type="button" onClick={createProject} className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-[9px] uppercase tracking-widest font-black text-white shadow-md shadow-sky-500/25 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg shrink-0 transition-all active:scale-95">
                    +
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                {projects.length === 0 ? (
                  <div className="py-16 px-6 text-center text-[10px] text-stone-500 dark:text-stone-400 rounded-xl border-[1.5px]-2 border-[1.5px]-dashed border-stone-200 dark:border-stone-600 bg-stone-50/30 dark:bg-stone-800/30">
                    Nessun progetto. Aggiungine uno sopra.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {projects.map((project) => {
                      const stats = countTreeStats(project.tasks || [])
                      return (
                        <article
                          key={project.id}
                          className={`group/card relative flex flex-col rounded-xl overflow-hidden transition-all duration-300 min-h-[280px] ${
                            project.active
                              ? 'border-l-4 border-l-sky-500 dark:border-l-sky-400 shadow-xl shadow-sky-200/40 dark:shadow-sky-950/50 ring-1 ring-sky-200/60 dark:ring-sky-700/40 bg-white dark:bg-stone-800'
                              : 'border-[1.5px] border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800/95 hover:border-stone-300 dark:hover:border-stone-500 hover:shadow-lg hover:shadow-stone-200/30 dark:hover:shadow-stone-900/40'
                          }`}
                        >
                          <div className="p-2.5 shrink-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0 pr-2">
                                {editingProjectId === project.id ? (
                                  <input
                                    autoFocus
                                    defaultValue={project.title}
                                    onBlur={(e) => renameProject(project.id, e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') renameProject(project.id, e.target.value); if (e.key === 'Escape') setEditingProjectId(null) }}
                                    className="w-full rounded border-[1.5px]-0 border-b-[1.5px]-2 border-stone-300 bg-transparent px-0 py-0.5 text-base font-semibold text-stone-800 dark:text-stone-200 focus:border-sky-500 focus:outline-none"
                                  />
                                ) : (
                                  <p onClick={() => setEditingProjectId(project.id)} className="text-base font-semibold text-stone-800 dark:text-stone-200 cursor-text hover:text-sky-600 line-clamp-2 break-words leading-snug">{project.title}</p>
                                )}
                                <div className="mt-2.5 flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-md bg-stone-100 dark:bg-stone-700 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:text-stone-300 tabular-nums">
                                    {stats.completed}/{stats.total}
                                  </span>
                                  <div className="flex-1 h-2.5 max-w-[90px] rounded-full bg-stone-200 dark:bg-stone-600 overflow-hidden shadow-inner">
                                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 dark:from-sky-500 dark:to-sky-400 transition-all duration-500 shadow-sm" style={{ width: `${Math.round((stats.ratio || 0) * 100)}%` }} />
                                  </div>
                                  <span className="text-[9px] font-black tabular-nums text-stone-800 dark:text-stone-200">{formatPercent(stats.ratio)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateProject(project.id, (p) => ({ ...p, active: !p.active }))}
                                  className={`w-3.5 h-3.5 border-[1.5px] rounded-full transition-all ${
                                    project.active
                                      ? 'bg-sky-500 hover:bg-sky-600 shadow-sm shadow-sky-500/30'
                                      : 'border-[1.5px]-2 border-stone-300 dark:border-stone-500 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 bg-transparent'
                                  }`}
                                  title={project.active ? 'Metti in pausa' : 'Attiva'}
                                />
                                <button
                                  type="button"
                                  onClick={() => setProjects((prev) => prev.filter((p) => p.id !== project.id))}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-stone-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40 dark:hover:text-rose-400 opacity-0 group-hover/card:opacity-100 transition-all text-[10px] font-light"
                                  aria-label="Rimuovi"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <input
                                value={projectTaskDrafts[project.id] || ''}
                                onChange={(e) => setProjectTaskDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
                                placeholder="Nuovo task..."
                                className="min-w-0 flex-1 rounded-lg border-[1.5px] border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-700/30 px-3 py-2 text-[10px] placeholder:text-stone-400 focus:border-sky-400 focus:bg-white dark:focus:bg-stone-700/50 focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-colors"
                              />
                              <button type="button" onClick={() => addRootTask(project.id)} className="rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-[9px] uppercase tracking-widest font-black text-white shadow-md shadow-sky-500/25 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg shrink-0 transition-all active:scale-95">
                                +
                              </button>
                            </div>
                          </div>
                          <div className={`px-4 pb-4 pt-3 flex-1 min-h-0 space-y-1.5 overflow-y-auto ${project.active ? 'bg-sky-50/30 dark:bg-sky-950/20' : 'border-[1.5px]-t border-stone-100 dark:border-stone-700/60'}`}>
                            {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
                              project.tasks.map((node) => (
                                <ProjectTaskNode
                                  key={node.id}
                                  node={node}
                                  depth={0}
                                  projectId={project.id}
                                  onToggle={(taskId, value) => toggleProjectTask(project.id, taskId, value)}
                                  onDelete={(taskId) => deleteProjectTask(project.id, taskId)}
                                  onRename={(taskId, title) => renameProjectTask(project.id, taskId, title)}
                                  onDeadline={(taskId, dateKey) => setProjectTaskDeadline(project.id, taskId, dateKey)}
                                  onAddChild={(taskId, title) => addProjectChildTask(project.id, taskId, title)}
                                  getTop3SlotIndex={getTop3SlotIndex}
                                  onAddToTop3={addToTop3}
                                  onRemoveFromTop3={removeFromTop3}
                                />
                              ))
                            ) : (
                              <p className="py-4 text-center text-[10px] text-stone-500 dark:text-stone-400">Nessun task</p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

        {/* Right column row 1: Pomodoro + Top 3 (bordo sotto Top 3 allineato con bordo sotto Hero) */}
        <div className="flex flex-col gap-2 overflow-y-auto xl:row-start-1 xl:col-start-2 xl:min-h-0">
          <PomodoroTimer />
          <section ref={top3SectionRef} className={cardClass + ' xl:flex-1 xl:min-h-0 xl:flex xl:flex-col'}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-0">
              <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-500/40 ring-2 ring-sky-200/60 dark:ring-sky-800/60" aria-hidden />
              <button
                type="button"
                onClick={() => top3SectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-left text-[10px] font-black tracking-tight text-stone-800 dark:text-stone-50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors focus:outline-none focus:ring-0"
              >
                Top 3
              </button>
            </div>
            <div className="px-5 pt-0 pb-5">
              <p className="mb-1.5 text-[10px] text-stone-500 dark:text-stone-400">Trascina per riordinare, aggiungi da un task (Top 3).</p>
              <ul className="space-y-2.5">
                {[0, 1, 2].map((idx) => {
                  const slot = top3Resolved[idx]
                  const filled = slot && !slot.missing
                  return (
                    <li
                      key={idx}
                      data-slot-index={idx}
                      draggable={filled}
                      onDragStart={() => filled && setDraggedTop3Index(idx)}
                      onDragEnd={() => setDraggedTop3Index(null)}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-sky-300') }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-sky-300') }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('ring-2', 'ring-sky-300')
                        const to = Number(e.currentTarget.dataset.slotIndex)
                        const raw = e.dataTransfer.getData('application/json')
                        if (raw) {
                          try {
                            const payload = JSON.parse(raw)
                            if (payload.type === 'project' && payload.projectId && payload.taskId) {
                              setTop3SlotAtIndex(to, { projectId: payload.projectId, taskId: payload.taskId })
                            } else if (payload.type === 'quick' && payload.quickTaskId) {
                              setTop3SlotAtIndex(to, { quickTaskId: payload.quickTaskId })
                            }
                          } catch (_) {}
                        } else if (draggedTop3Index != null && draggedTop3Index !== to) {
                          reorderTop3(draggedTop3Index, to)
                        }
                        setDraggedTop3Index(null)
                      }}
                      className={`relative rounded-xl border-[1.5px] pl-1.5 pr-8 py-3 transition-all duration-200 ${filled ? 'cursor-grab active:cursor-grabbing border-stone-200 bg-white dark:border-stone-600/60 dark:bg-stone-800 shadow-sm hover:shadow hover:border-stone-300 dark:hover:border-stone-500 hover:bg-stone-50/80 dark:hover:bg-stone-700/60' : 'border-[1.5px]-dashed border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/50'} ${draggedTop3Index === idx ? 'opacity-50 scale-[0.98]' : ''}`}
                    >
                      {(filled || slot?.missing) && (
                        <button
                          type="button"
                          onClick={() => removeFromTop3(idx)}
                          className="absolute right-1.5 top-2 rounded p-1 text-lg leading-none text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-colors"
                          title="Rimuovi da Top 3"
                          aria-label="Rimuovi da Top 3"
                        >
                          ×
                        </button>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 text-[9px] font-black tabular-nums text-white shadow-md shadow-sky-500/30">#{idx + 1}</span>
                        {slot?.missing ? (
                          <span className="flex-1 text-[10px] text-amber-600 dark:text-amber-400">Task rimosso</span>
                        ) : filled ? (
                          <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={!!slot.done}
                              onChange={(e) => slot.isQuick ? toggleQuickTask(slot.quickTaskId, e.target.checked) : toggleProjectTask(slot.projectId, slot.taskId, e.target.checked)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-sky-600 focus:ring-2 focus:ring-sky-500/30"
                              aria-label={`Completa: ${slot.title}`}
                            />
                            <div className="min-w-0">
                              <p className={`truncate text-[10px] ${slot.done ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-800 dark:text-stone-200'}`}>{slot.title}</p>
                              <p className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-400">{slot.projectTitle}</p>
                              </div>
                          </label>
                        ) : (
                          <span className="flex-1 text-[10px] text-stone-400 dark:text-stone-500">Vuoto — aggiungi da un task (pulsante Top 3)</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        </div>

        {/* Right column row 2: Countdown */}
        <section className="rounded-2xl border-[1.5px] border-stone-200/90 bg-white shadow-xl shadow-stone-200/20 dark:border-stone-600/50 dark:bg-stone-800/95 dark:shadow-stone-950/40 ring-1 ring-stone-900/5 dark:ring-white/5 xl:row-start-2 xl:col-start-2">
            <div className="flex items-center gap-2 px-5 py-4 bg-amber-50/30 dark:bg-amber-950/20 border-b-[1.5px] border-stone-100 dark:border-stone-600/50">
              <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/40 ring-2 ring-amber-200/60 dark:ring-amber-800/50" aria-hidden />
              <h3 className="text-[10px] font-black tracking-tight text-stone-800 dark:text-stone-50">Countdown</h3>
            </div>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-2">
                {countdownItems.map((item) => (
                  <CountdownRing key={item.label} label={item.label} value={item.value} elapsed={item.elapsed} />
                ))}
              </div>
            </div>
        </section>
      </div>

    </div>
  )
}

