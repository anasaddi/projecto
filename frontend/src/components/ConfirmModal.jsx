import React from 'react';

/**
 * Modal di conferma (sostituisce window.confirm).
 * @param {boolean} open
 * @param {string} title
 * @param {string} message
 * @param {string} confirmLabel - default "Conferma"
 * @param {string} cancelLabel - default "Annulla"
 * @param {'default'|'danger'} variant - danger = bottone rosso
 * @param {() => void} onConfirm
 * @param {() => void} onCancel
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  variant = 'default',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full p-6">
        <h2 id="confirm-modal-title" className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm?.(); onCancel?.(); }}
            className={`focus-ring px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors min-h-[44px] ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-zinc-900 dark:bg-indigo-500 hover:bg-zinc-800 dark:hover:bg-indigo-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
