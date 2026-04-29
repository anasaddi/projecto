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
    bar: 'from-indigo-500 to-violet-500', 
    text: 'text-indigo-600 dark:text-indigo-400',
    glow: 'shadow-[0_0_14px_rgba(99,102,241,0.35)] dark:shadow-[0_0_18px_rgba(129,140,248,0.32)]' 
  },
  sky: { 
    bar: 'from-sky-500 to-cyan-500', 
    text: 'text-sky-600 dark:text-sky-400',
    glow: 'shadow-[0_0_14px_rgba(14,165,233,0.32)] dark:shadow-[0_0_18px_rgba(56,189,248,0.28)]' 
  },
  violet: { 
    bar: 'from-violet-500 to-purple-500', 
    text: 'text-violet-600 dark:text-violet-400',
    glow: 'shadow-[0_0_14px_rgba(168,85,247,0.34)] dark:shadow-[0_0_18px_rgba(192,132,252,0.3)]' 
  },
  emerald: { 
    bar: 'from-emerald-500 to-teal-500', 
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:shadow-[0_0_18px_rgba(52,211,153,0.26)]' 
  },
  amber: { 
    bar: 'from-amber-500 to-orange-500', 
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-[0_0_14px_rgba(245,158,11,0.28)] dark:shadow-[0_0_18px_rgba(251,191,36,0.24)]' 
  },
  rose: { 
    bar: 'from-rose-500 to-pink-500', 
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-[0_0_14px_rgba(244,63,94,0.28)] dark:shadow-[0_0_18px_rgba(251,113,133,0.24)]' 
  },
};

export function getAccentColor(accent) {
  return ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
}
