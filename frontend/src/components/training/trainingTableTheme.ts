export type TrainingAccent = 'strength' | 'aw' | 'hyp' | 'neutral';

export const ACCENT = {
  strength: {
    cardBorder: 'border-blue-500/25 dark:border-blue-500/30',
    cardRing: 'ring-1 ring-blue-500/10',
    headerBar: 'bg-blue-500',
    headerBg:
      'bg-gradient-to-r from-blue-500/[0.08] to-transparent dark:from-blue-500/12 border-b border-zinc-200/60 dark:border-zinc-800/80',
    badge: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    pillActive: 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400',
    rowHover: 'hover:bg-blue-50/30 dark:hover:bg-blue-950/20',
    weekHighlight: 'text-blue-700 dark:text-blue-300 font-black bg-blue-50/60 dark:bg-blue-900/20',
    subtitle: 'text-blue-600 dark:text-blue-400',
  },
  aw: {
    cardBorder: 'border-amber-500/25 dark:border-amber-500/30',
    cardRing: 'ring-1 ring-amber-500/10',
    headerBar: 'bg-amber-500',
    headerBg:
      'bg-gradient-to-r from-amber-500/[0.08] to-transparent dark:from-amber-500/12 border-b border-zinc-200/60 dark:border-zinc-800/80',
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    pillActive: 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400',
    rowHover: 'hover:bg-amber-50/25 dark:hover:bg-amber-950/15',
    weekHighlight: 'text-amber-700 dark:text-amber-300 font-black bg-amber-50/60 dark:bg-amber-900/20',
    subtitle: 'text-amber-600 dark:text-amber-400',
  },
  hyp: {
    cardBorder: 'border-emerald-500/25 dark:border-emerald-500/30',
    cardRing: 'ring-1 ring-emerald-500/10',
    headerBar: 'bg-emerald-500',
    headerBg:
      'bg-gradient-to-r from-emerald-500/[0.08] to-transparent dark:from-emerald-500/12 border-b border-zinc-200/60 dark:border-zinc-800/80',
    badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    pillActive: 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400',
    rowHover: 'hover:bg-emerald-50/25 dark:hover:bg-emerald-950/15',
    weekHighlight: 'text-emerald-700 dark:text-emerald-300 font-black bg-emerald-50/60 dark:bg-emerald-900/20',
    subtitle: 'text-emerald-600 dark:text-emerald-400',
  },
  neutral: {
    cardBorder: 'border-zinc-200/60 dark:border-white/[0.08]',
    cardRing: '',
    headerBar: 'bg-zinc-400',
    headerBg: 'bg-zinc-50/80 dark:bg-white/[0.02] border-b border-zinc-200/60 dark:border-zinc-800/80',
    badge: 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
    pillActive: 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-700 dark:text-zinc-200',
    rowHover: 'hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]',
    weekHighlight: 'text-zinc-700 dark:text-zinc-300 font-black bg-zinc-100/80 dark:bg-zinc-800/40',
    subtitle: 'text-zinc-500 dark:text-zinc-400',
  },
} as const;

export const TABLE = {
  wrap: 'overflow-x-auto custom-scrollbar',
  table: 'w-full text-left border-collapse text-sm',
  thead: 'bg-zinc-50/90 dark:bg-zinc-800/70',
  theadRow: 'text-[11px] font-bold uppercase tracking-wide text-zinc-500 border-b border-zinc-200/60 dark:border-zinc-800/80',
  th: 'py-2 px-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500',
  thAnas: 'py-2 px-2 text-[11px] font-bold uppercase tracking-wide text-center text-blue-500 min-w-[128px]',
  thFlavio: 'py-2 px-2 text-[11px] font-bold uppercase tracking-wide text-center text-emerald-500 min-w-[128px]',
  thSxDx: 'py-2 px-1.5 text-[11px] font-bold uppercase tracking-wide text-center min-w-[3rem]',
  tr: 'transition-colors',
  td: 'py-1 px-2 border-r border-zinc-100/80 dark:border-zinc-800/50 last:border-r-0',
  tdAthlete: 'py-1 px-2 border-r border-zinc-100/80 dark:border-zinc-800/50 last:border-r-0 w-[118px]',
  tbody: 'divide-y divide-zinc-100/80 dark:divide-zinc-800/40',
  inner: 'rounded-xl overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80',
} as const;

export const COMPACT_INPUT =
  'h-8 w-11 min-w-0 rounded-lg border border-zinc-200/80 bg-zinc-50 px-1 text-center text-xs font-bold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20';

export const COMPACT_INPUT_SM =
  'h-8 w-9 min-w-0 rounded-lg border border-zinc-200/80 bg-zinc-50 px-1 text-center text-xs font-bold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20';

export const PERIOD_TRACK =
  'flex items-center gap-0.5 bg-zinc-100/80 dark:bg-zinc-800/60 p-0.5 rounded-lg overflow-x-auto custom-scrollbar';

export const PERIOD_BTN = 'font-bold transition-all shrink-0 rounded-md text-[10px]';
export const PERIOD_BTN_IDLE =
  'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300';
