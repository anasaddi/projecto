import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { POMODORO_STORAGE, toDateKey, parseSelectedDate } from './DashboardUtils';
import { Card, CardHeader, Badge } from './Card';
import { useDashboardStore } from '../../store/dashboardStore';

const PRESETS = [
  { label: '5m',  minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

export function PomodoroCompact() {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [status, setStatus] = useState('idle');
  const [sessionsToday, setSessionsToday] = useState(0);
  const [checkpointPulse, setCheckpointPulse] = useState(0);
  const [lastCheckpoint, setLastCheckpoint] = useState(0);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);
  const activePomodoroTaskRef = useRef(null);
  const activePomodoroTask = useDashboardStore((s) => s.activePomodoroTask);
  const setActivePomodoroTask = useDashboardStore((s) => s.setActivePomodoroTask);
  const toggleQuickTask = useDashboardStore((s) => s.toggleQuickTask);
  const toggleSharedQuickTask = useDashboardStore((s) => s.toggleSharedQuickTask);
  const toggleProjectTask = useDashboardStore((s) => s.toggleProjectTask);

  useEffect(() => { activePomodoroTaskRef.current = activePomodoroTask; }, [activePomodoroTask]);

  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const selectedKey = toDateKey(parseSelectedDate(selectedDate, new Date()));
  const realTodayKey = toDateKey(new Date());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = localStorage.getItem(POMODORO_STORAGE);
      if (stored) {
        const { date, sessions } = JSON.parse(stored);
        if (date === selectedKey) setSessionsToday(sessions || 0);
        else setSessionsToday(0);
      } else {
        setSessionsToday(0);
      }
    } catch (err) {}
  }, [selectedKey]);

  useEffect(() => {
    if (!completedRef.current) return;
    completedRef.current = false;
    const task = activePomodoroTaskRef.current;
    if (task) {
      if (task.shareId && task.quickTaskId === undefined) toggleSharedQuickTask(task.shareId, task.taskId, true);
      else if (task.quickTaskId) toggleQuickTask(task.quickTaskId, true);
      else if (task.projectId && task.taskId) toggleProjectTask(task.projectId, task.taskId, true);
      setActivePomodoroTask(null);
    }
  });

  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          completedRef.current = true;
          setStatus('idle');
          setSessionsToday((s) => {
            const isViewingToday = selectedKey === realTodayKey;
            const next = isViewingToday ? s + 1 : s;
            if (typeof window !== 'undefined' && window.localStorage) {
              try {
                const stored = localStorage.getItem(POMODORO_STORAGE);
                const prev = stored ? (JSON.parse(stored).date === realTodayKey ? (JSON.parse(stored).sessions || 0) : 0) : 0;
                localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ date: realTodayKey, sessions: prev + 1 }));
              } catch (err) {}
            }
            if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') new window.Notification('Timer completato!');
            return next;
          });
          return selectedMinutes * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status, realTodayKey, selectedMinutes]);

  const totalSeconds = selectedMinutes * 60;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const progress = 1 - remaining / totalSeconds;
  const checkpoint = progress >= 0.75 ? 3 : progress >= 0.5 ? 2 : progress >= 0.25 ? 1 : 0;
  const timeLeft = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - progress * circumference;

  const handleSelectPreset = (minutes) => {
    if (status !== 'idle') return;
    setSelectedMinutes(minutes);
    setRemaining(minutes * 60);
  };

  const handleStart = () => {
    setStatus('running');
  };

  const handleStop = () => {
    setStatus('idle');
    setRemaining(selectedMinutes * 60);
    if (activePomodoroTask) setActivePomodoroTask(null);
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  useEffect(() => {
    if (isIdle) {
      setLastCheckpoint(0);
      setCheckpointPulse(0);
      return;
    }
    if (checkpoint > lastCheckpoint) {
      setLastCheckpoint(checkpoint);
      setCheckpointPulse(checkpoint);
      const t = setTimeout(() => setCheckpointPulse(0), 700);
      return () => clearTimeout(t);
    }
  }, [checkpoint, lastCheckpoint, isIdle]);

  return (
    <Card className="flex flex-col select-none" glow={isRunning} glowColor="indigo">
      <CardHeader
        icon={Icons.Clock}
        iconColor="text-rose-500"
        title="Focus Timer"
        subtitle={isRunning ? 'In corso...' : isPaused ? 'In pausa' : 'Pronto'}
        action={
          sessionsToday > 0 ? (
            <Badge variant="primary" size="sm">{sessionsToday} sess</Badge>
          ) : undefined
        }
      />

      <div className="p-4 flex flex-col gap-4">
        {/* Circular progress + time */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6"
                className="text-zinc-100 dark:text-zinc-800" />
              <motion.circle
                cx="40" cy="40" r="36" fill="none"
                stroke="url(#pomGradient)"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                initial={false}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'linear' }}
              />
              <defs>
                <linearGradient id="pomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-black tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
                {timeLeft}
              </span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 mb-2">
              {[1, 2, 3].map((step) => {
                const reached = checkpoint >= step;
                const pulsing = checkpointPulse === step;
                return (
                  <motion.span
                    key={step}
                    initial={false}
                    animate={pulsing ? { scale: [1, 1.55, 1], opacity: [0.8, 1, 0.9] } : { scale: 1, opacity: reached ? 1 : 0.45 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className={`h-1.5 w-1.5 rounded-full ${reached ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    title={`${step * 25}%`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 min-w-0 mb-2">
            {/* Controls */}
            <div className="flex items-center gap-2">
              {isIdle && (
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white h-9 rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.3)] active:scale-95 transition-all text-xs font-bold"
                >
                  <Icons.Play className="w-3.5 h-3.5 fill-current" />
                  Avvia
                </button>
              )}
              {isRunning && (
                <button
                  onClick={() => setStatus('paused')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white h-9 rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.3)] active:scale-95 transition-all text-xs font-bold"
                >
                  <Icons.Pause className="w-3.5 h-3.5 fill-current" />
                  Pausa
                </button>
              )}
              {isPaused && (
                <button
                  onClick={() => setStatus('running')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white h-9 rounded-xl active:scale-95 transition-all text-xs font-bold"
                >
                  <Icons.Play className="w-3.5 h-3.5 fill-current" />
                  Riprendi
                </button>
              )}
              {!isIdle && (
                <button
                  onClick={handleStop}
                  title="Reset"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06] active:scale-95 transition-all"
                >
                  <Icons.RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Preset chips */}
            <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0">
              {PRESETS.map(({ label, minutes }) => (
                <button
                  key={minutes}
                  onClick={() => handleSelectPreset(minutes)}
                  disabled={!isIdle}
                  className={`shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    selectedMinutes === minutes
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active task indicator */}
        <AnimatePresence>
          {activePomodoroTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 px-3 py-2"
            >
              <Icons.Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate min-w-0 flex-1">
                {activePomodoroTask.title}
              </span>
              <button
                type="button"
                onClick={() => setActivePomodoroTask(null)}
                className="shrink-0 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors"
                title="Scollega task"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
