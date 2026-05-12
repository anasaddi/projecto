import React, { useState, useCallback } from 'react';
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
      // Reset click count after 1 second
      setTimeout(() => setClickCount(0), 1000);
      return next;
    });
  }, []);

  const handleReset = useCallback(async () => {
    try {
      const { api } = await import('../api/client');
      await api.training.resetDailyLogs();
      await clearDashboardPersistence();
      // Reload page to refresh state
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
      alert('Reset log giornalieri fallito. Riprova tra qualche secondo.');
    }
    setShowResetMenu(false);
  }, []);

  return (
    <>
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white shrink-0 shadow-[0_2px_8px_rgba(99,102,241,0.35),0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-white/20 ${s} ${className}`}
        tabIndex={0}
        onClick={handleClick}
      >
        <TargetIcon className={`${is} drop-shadow-md`} />
      </div>

      {showResetMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Reset Log Giornalieri</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Vuoi resettare tutti i log giornalieri (incluso oggi)? Questa azione non può essere annullata.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetMenu(false)}
                className="px-4 py-2 text-sm rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Annulla
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Resetta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
