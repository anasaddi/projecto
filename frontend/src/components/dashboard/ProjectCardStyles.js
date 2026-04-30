/**
 * Unified Project Card Styles
 * Consistent visual styling across all project card variants
 */

export const PROJECT_CARD_STYLES = {
  // Container styles
  container: {
    base: 'group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-[0_26px_60px_-36px_rgba(79,70,229,0.22)] dark:border-white/[0.08] dark:bg-[#0b0e14]/70 dark:shadow-none',
    hover: 'hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.22)] dark:hover:border-white/[0.12]',
    expanded: 'ring-1 ring-zinc-200/80 dark:ring-white/[0.08] shadow-[0_16px_32px_-22px_rgba(99,102,241,0.18)]',
  },
  
  // Accent bar styles
  accentBar: {
    base: 'shrink-0 rounded-full bg-gradient-to-b',
    size: {
      normal: 'h-12 w-1.5',
      compact: 'h-8 w-1',
    },
  },
  
  // Header section
  header: {
    base: 'flex items-start gap-3 p-4 sm:p-5',
  },
  
  // Title styles
  title: {
    base: 'w-full resize-none overflow-hidden bg-transparent font-semibold leading-snug tracking-tight outline-none break-words',
    size: 'text-sm',
    color: {
      normal: 'text-zinc-900 dark:text-zinc-50',
      done: 'text-zinc-400 line-through',
    },
  },
  
  // Progress bar container
  progressContainer: {
    base: 'h-2 flex-1 overflow-hidden rounded-full',
    bg: 'bg-zinc-100/90 ring-1 ring-zinc-200/40 dark:bg-white/[0.06] dark:ring-white/[0.05]',
  },
  
  // Progress bar fill
  progressFill: 'h-full rounded-full transition-[width] duration-500 ease-out',
  
  // Percentage text
  percentage: {
    base: 'shrink-0 text-xs font-bold tabular-nums',
  },
  
  // Task list container
  taskList: {
    base: 'rounded-b-[28px] border-t border-zinc-100 bg-zinc-50/70 p-4 dark:border-white/[0.04] dark:bg-black/20 flex flex-col gap-1',
  },
  
  // Action buttons
  actionButton: {
    base: 'rounded-lg p-1.5 transition-colors',
    default: 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300',
    active: 'text-zinc-800 bg-zinc-100 dark:text-zinc-100 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50',
  },
};

// Accent color configurations
export const ACCENT_COLORS = {
  indigo: { 
    bar: 'from-dark-violet to-dark-violetLight', 
    text: 'text-indigo-600 dark:text-dark-violetLight',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(124,92,255,0.2)]' 
  },
  sky: { 
    bar: 'from-dark-cyan to-[#4DD0E1]', 
    text: 'text-sky-600 dark:text-dark-cyan',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(34,184,240,0.2)]' 
  },
  violet: { 
    bar: 'from-dark-violet to-dark-violetLight', 
    text: 'text-violet-600 dark:text-dark-violetLight',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(124,92,255,0.2)]' 
  },
  emerald: { 
    bar: 'from-dark-teal to-[#26A69A]', 
    text: 'text-emerald-600 dark:text-dark-teal',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(22,199,163,0.2)]' 
  },
  amber: { 
    bar: 'from-dark-amber to-[#FFCA28]', 
    text: 'text-amber-600 dark:text-dark-amber',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
  },
  rose: { 
    bar: 'from-dark-rose to-[#EF5350]', 
    text: 'text-rose-600 dark:text-dark-rose',
    glow: 'shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
  },
};

export function getAccentColor(accent) {
  return ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
}
