import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';

/**
 * Unified Add Item Input Bar
 * Based on the Habits input design - consistent across all dashboard sections
 * 
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {function} props.onChange - Change handler
 * @param {function} props.onSubmit - Submit handler (on Enter or button click)
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.buttonColor - Color theme: 'sky' | 'rose' | 'indigo' | 'emerald' | 'amber' | 'violet'
 * @param {boolean} props.disabled - Disable the button
 * @param {string} props.keyboardHint - Keyboard shortcut hint (default: '↵')
 */
export function AddItemInputBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Aggiungi...',
  buttonColor = 'sky',
  disabled = false,
  keyboardHint = '↵',
}) {
  const colorThemes = {
    sky: {
      button: 'from-sky-500 to-cyan-600',
      shadow: 'shadow-sky-500/25',
      hoverShadow: 'hover:shadow-sky-500/30',
      focusRing: 'focus:border-sky-500 focus:ring-sky-500/20',
    },
    rose: {
      button: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/25',
      hoverShadow: 'hover:shadow-rose-500/30',
      focusRing: 'focus:border-rose-500 focus:ring-rose-500/20',
    },
    indigo: {
      button: 'from-indigo-500 to-violet-600',
      shadow: 'shadow-indigo-500/25',
      hoverShadow: 'hover:shadow-indigo-500/30',
      focusRing: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    },
    emerald: {
      button: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      hoverShadow: 'hover:shadow-emerald-500/30',
      focusRing: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    },
    amber: {
      button: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      hoverShadow: 'hover:shadow-amber-500/30',
      focusRing: 'focus:border-amber-500 focus:ring-amber-500/20',
    },
    violet: {
      button: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
      hoverShadow: 'hover:shadow-violet-500/30',
      focusRing: 'focus:border-violet-500 focus:ring-violet-500/20',
    },
  };

  const theme = colorThemes[buttonColor] || colorThemes.sky;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-zinc-200/70 bg-zinc-100/85 px-4 py-3 pr-9 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500 ${theme.focusRing} focus:ring-2`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hidden sm:block">
          {keyboardHint}
        </span>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.button} text-white shadow-lg ${theme.shadow} transition-all hover:shadow-xl ${theme.hoverShadow} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Icons.Plus className="h-5 w-5" />
      </motion.button>
    </div>
  );
}

export default AddItemInputBar;
