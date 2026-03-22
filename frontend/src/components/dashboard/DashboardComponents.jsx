import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
 * KebabMenu — dropdown minimale con azioni contestuali (portal per evitare clipping)
 */
export function KebabMenu({ items, onOpenChange, alwaysVisible = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 140;
    const menuH = 120;
    const gap = 4;
    const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
    const spaceBelow = window.innerHeight - rect.bottom;
    const below = spaceBelow >= menuH + gap || spaceBelow >= rect.top;
    setPos({
      top: below ? rect.bottom + gap : rect.top - menuH - gap,
      left,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dropdown = open && (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[140px] animate-slide-down rounded-lg border border-zinc-200/80 bg-white py-1 shadow-lg shadow-zinc-900/10 dark:border-zinc-700/80 dark:bg-zinc-800/95 dark:border-white/[0.08] dark:shadow-black/50"
      style={{ top: pos.top, left: pos.left }}
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} className="my-1 border-t border-zinc-100 dark:border-white/5" />
        ) : (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(e); }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${item.danger
              ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
              : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.06]'
              }`}
          >
            {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );

  return (
    <>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          ref={btnRef}
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          className={`dashboard-action-btn ${alwaysVisible ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'}`}
          title="Azioni (Elimina progetto, scadenza)"
        >
          <Icons.MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      {createPortal(dropdown, document.body)}
    </>
  );
}
