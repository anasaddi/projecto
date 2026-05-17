import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clearDashboardPersistence } from '../db/localDb';

const TargetIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Icona principale app: gradient indigo/purple + target, usata ovunque (header, welcome, favicon-style) */
export function AppLogo({ size = 'md', className = '' }) {
  const [clickCount, setClickCount] = useState(0);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [resetting, setResetting] = useState(false);

  const sizes = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'w-12 h-12',
    lg: 'h-16 w-16',
  };
  const iconSizes = {
    xs: 'h-4 w-4',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };
  const s = sizes[size] || sizes.md;
  const is = iconSizes[size] || iconSizes.md;

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setClickCount(prev => {
      const next = prev + 1;
      if (next === 3) {
        setShowResetMenu(true);
        return 0;
      }
      setTimeout(() => setClickCount(0), 1000);
      return next;
    });
  }, []);

  const handleReset = useCallback(async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const { api } = await import('../api/client');
      await api.training.resetDailyLogs();
      await clearDashboardPersistence();
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
      setResetting(false);
      setShowResetMenu(false);
    }
  }, [resetting]);

  const modal = showResetMenu
    ? createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetMenu(false); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Reset Log Giornalieri
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Vuoi resettare tutti i log giornalieri (habits, preghiere, completamenti)? Questa azione non può essere annullata.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetMenu(false)}
                disabled={resetting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 min-w-[80px]"
              >
                {resetting ? 'Reset…' : 'Resetta'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white shrink-0 shadow-[0_2px_8px_rgba(99,102,241,0.35),0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-white/20 ${s} ${className}`}
        tabIndex={0}
        onClick={handleClick}
      >
        <TargetIcon className={`${is} drop-shadow-md`} />
      </div>
      {modal}
    </>
  );
}
