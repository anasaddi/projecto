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
  sectionGap: 'space-y-6',
  surface:
    'rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden',
  surfaceFlat:
    'rounded-2xl border border-zinc-200/60 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden',
  surfacePadding: 'px-0',
  columnWidth: '148px',
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
    'grid items-center gap-x-2 sm:gap-x-3 px-3 py-2.5 text-xs transition-colors',
  gridCols:
    'grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,auto)]',
  gridColsHistory:
    'grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,auto)_1.75rem]',
  index: 'text-[10px] font-black text-zinc-400 tabular-nums text-center',
  name: 'text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight',
  badge: 'text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 rounded shrink-0',
  athleteBlock: 'flex items-center gap-1 justify-end',
  athleteLabel: 'text-[9px] font-black uppercase w-8 text-center shrink-0',
  done: 'bg-emerald-50/70 dark:bg-emerald-950/20',
  divider: 'border-b border-zinc-100/90 dark:border-zinc-800/50 last:border-b-0',
} as const;

export const SCROLLBAR_CSS = `
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
`;
