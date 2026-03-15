import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

/**
 * Checkbox universale con animazione bump
 */
export function TaskCheckbox({ done, onClick, className = '' }) {
  const [bump, setBump] = useState(false);
  const handleClick = (e) => {
    e.stopPropagation();
    setBump(true);
    onClick(e);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBump(false)}
      className={`task-checkbox shrink-0 ${done ? 'checked' : ''} ${bump ? 'checkbox-bump' : ''} ${className}`}
    >
      {done && <Icons.Check className="h-2.5 w-2.5" />}
    </button>
  );
}

/**
 * KebabMenu — dropdown minimale con azioni contestuali
 */
export function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="dashboard-action-btn opacity-0 group-hover:opacity-100"
        title="Azioni"
      >
        <Icons.MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] animate-slide-down rounded-lg border border-zinc-200/80 bg-white py-1 shadow-lg shadow-zinc-900/10 dark:border-white/10 dark:bg-zinc-800 dark:shadow-black/40">
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-zinc-100 dark:border-white/5" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(e); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${item.danger
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'
                  }`}
              >
                {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
