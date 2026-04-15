import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { POMODORO_DURATION, POMODORO_STORAGE, toDateKey } from './DashboardUtils';
import { Card, CardHeader, CardBody } from './Card';
import { useDashboardStore } from '../../store/dashboardStore';

export function PomodoroCompact() {
  const [remaining, setRemaining] = useState(POMODORO_DURATION);
  const [status, setStatus] = useState('idle');
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef(null);
  const activePomodoroTask = useDashboardStore((s) => s.activePomodoroTask);
  const setActivePomodoroTask = useDashboardStore((s) => s.setActivePomodoroTask);
  const toggleQuickTask = useDashboardStore((s) => s.toggleQuickTask);
  const toggleProjectTask = useDashboardStore((s) => s.toggleProjectTask);
  
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

  const handleComplete = () => {
    setStatus('idle');
    setRemaining(POMODORO_DURATION);
    setSessionsToday((s) => {
      const next = s + 1;
      try { localStorage.setItem(POMODORO_STORAGE, JSON.stringify({ date: todayKey, sessions: next })); } catch (_) { }
      if (typeof window !== 'undefined' && window.Notification?.permission === 'granted') new window.Notification('Pomodoro completato!');
      return next;
    });
    // Auto-mark the linked task as done
    if (activePomodoroTask) {
      if (activePomodoroTask.quickTaskId) {
        toggleQuickTask(activePomodoroTask.quickTaskId, true);
      } else if (activePomodoroTask.projectId && activePomodoroTask.taskId) {
        toggleProjectTask(activePomodoroTask.projectId, activePomodoroTask.taskId, true);
      }
      setActivePomodoroTask(null);
    }
  };

  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          handleComplete();
          return POMODORO_DURATION;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status, todayKey, activePomodoroTask]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const progress = 1 - remaining / POMODORO_DURATION;

  const timeLeft = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const handleStartFocus = () => {
    setStatus('running');
    setRemaining(POMODORO_DURATION);
  };

  const handleStop = () => {
    setStatus('idle');
    setRemaining(POMODORO_DURATION);
    if (activePomodoroTask) setActivePomodoroTask(null);
  };

  return (
    <Card className="flex flex-col select-none" glow={status === 'running'} glowColor="indigo">
      <CardBody padding="normal" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">Focus</span>
            <div className="text-3xl sm:text-4xl font-semibold tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
              {timeLeft}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
             <div className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 mr-1">
              {sessionsToday} sess
            </div>
            <button
               type="button"
               onClick={handleStop}
               className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
               title="Reset"
             >
               <Icons.RotateCcw className="h-4 w-4" />
             </button>
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

        <div className="flex gap-2">
          {status === 'idle' && (
            <button onClick={handleStartFocus} className="bg-indigo-600 hover:bg-indigo-500 text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-[0_0_16px_rgba(99,102,241,0.25)] dark:shadow-[0_0_16px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
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
              <button onClick={handleStop} className="bg-zinc-200 dark:bg-white/[0.06] hover:bg-zinc-300 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-100 w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all border border-zinc-200 dark:border-white/[0.06]">
                <Icons.Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}
        </div>

        <div className="h-[3px] w-full bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </CardBody>
    </Card>
  );
}
