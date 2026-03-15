import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { POMODORO_DURATION, POMODORO_STORAGE, toDateKey } from './DashboardUtils';

export function PomodoroCompact() {
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
        <div className="text-3xl sm:text-4xl font-black tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
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
