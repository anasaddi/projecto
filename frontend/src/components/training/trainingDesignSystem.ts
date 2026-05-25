/** Unified tokens: page shell + tables. Table tokens live in trainingTableTheme. */
export {
  ACCENT,
  TABLE,
  COMPACT_INPUT,
  COMPACT_INPUT_SM,
  PERIOD_TRACK,
  PERIOD_BTN,
  PERIOD_BTN_IDLE,
  type TrainingAccent,
} from './trainingTableTheme';

export const PAGE = {
  maxWidth: 'max-w-6xl',
  sectionGap: 'space-y-5',
  layoutPy: 'py-5 pb-12',
  surface:
    'rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden',
  surfaceFlat:
    'rounded-2xl border border-zinc-200/60 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden',
  surfacePadding: 'px-0',
  columnWidth: '172px',
} as const;

export const BRAND = {
  progress: 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400',
  progressTrack: 'bg-zinc-100 dark:bg-zinc-800/60',
  label: 'text-indigo-600 dark:text-indigo-400',
  ring: 'ring-2 ring-indigo-500/40',
} as const;

/** Shared grid for session rows (TodayCard, Hyp table body as div, etc.) */
export const ROW = {
  grid:
    'grid items-center gap-x-2 sm:gap-x-4 px-3 py-3 sm:py-3.5 text-sm transition-colors',
  gridCols:
    'grid-cols-[2rem_minmax(0,1fr)_minmax(0,auto)] max-sm:grid-cols-[2rem_minmax(0,1fr)] max-sm:[&>*:last-child]:col-span-2 max-sm:[&>*:last-child]:justify-self-stretch',
  gridColsHistory:
    'grid-cols-[2rem_minmax(0,1fr)_minmax(0,auto)_2rem] max-sm:grid-cols-[2rem_minmax(0,1fr)_2rem]',
  index: 'text-[11px] font-black text-zinc-400 tabular-nums text-center',
  name: 'text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-snug',
  badge: 'text-[10px] font-bold uppercase tracking-wide text-white px-1.5 py-0.5 rounded shrink-0',
  athleteBlock: 'flex items-center gap-1.5 justify-end max-sm:justify-center max-sm:flex-wrap',
  athleteLabel: 'text-[10px] font-bold uppercase w-9 text-center shrink-0',
  done: 'bg-emerald-50/70 dark:bg-emerald-950/20',
  divider: 'border-b border-zinc-100/90 dark:border-zinc-800/50 last:border-b-0',
} as const;

export const COLLAPSE = {
  header: 'flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]',
  headerPy: 'px-4 py-3.5',
  contentPx: 'px-0',
  contentPb: 'pb-4',
  chevron: 'text-zinc-400 shrink-0 transition-transform duration-200',
} as const;

export const SCROLLBAR_CSS = `
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
`;
