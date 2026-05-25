import React from 'react';
import { cn } from '../../lib/utils';
import { Card as DashboardCard } from '../dashboard/Card';
import {
  ACCENT,
  TABLE,
  COMPACT_INPUT,
  COMPACT_INPUT_SM,
  PERIOD_TRACK,
  PERIOD_BTN,
  PERIOD_BTN_IDLE,
  PAGE,
  BRAND,
  ROW,
  SCROLLBAR_CSS,
} from './trainingDesignSystem';

// Piccole intestazioni per kg, r, s
export const ColHeader = ({ label, className = '' }) => (
  <span className={`text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] text-center w-full block ${className}`}>{label}</span>
);

/** Training tables — shared dashboard Card, no hover lift */
export const Card = ({ children, className = '' }) => (
  <DashboardCard hover={false} className={className}>
    {children}
  </DashboardCard>
);

export function TrainingCard({ accent = 'neutral', children, className = '' }) {
  const a = ACCENT[accent] || ACCENT.neutral;
  return (
    <Card className={cn('overflow-hidden', a.cardBorder, a.cardRing, className)}>
      {children}
    </Card>
  );
}

export function TrainingBlockHeader({
  accent = 'neutral',
  title,
  subtitle,
  right,
  stacked = false,
  className = '',
}) {
  const a = ACCENT[accent] || ACCENT.neutral;
  return (
    <div className={cn('px-3 py-2.5', a.headerBg, stacked && 'space-y-2', className)}>
      <div className={cn('flex gap-2', stacked ? 'flex-col' : 'flex-row items-center justify-between')}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-1 h-7 rounded-full shrink-0', a.headerBar)} />
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider truncate">
              {title}
            </h3>
            {subtitle && (
              <span className={cn('inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded', a.badge)}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {right && <div className={stacked ? 'w-full' : 'shrink-0'}>{right}</div>}
      </div>
    </div>
  );
}

const CYCLE_ACTIVE_AW = [
  'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-orange-500 dark:text-orange-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-rose-500 dark:text-rose-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-violet-500 dark:text-violet-400 shadow-sm',
];

export function PeriodPills({
  accent = 'aw',
  count = 5,
  current,
  onChange,
  start = 1,
  label = (n) => String(n),
  cycleDividers = false,
  compact = false,
  className = '',
}) {
  const a = ACCENT[accent] || ACCENT.aw;
  const btnSize = compact ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <div className={cn(PERIOD_TRACK, className)}>
      {Array.from({ length: count }, (_, i) => start + i).map(n => (
        <React.Fragment key={n}>
          {cycleDividers && n > start && (n - start) % 5 === 0 && (
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 shrink-0 mx-0.5" />
          )}
          <button
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              PERIOD_BTN,
              btnSize,
              current === n
                ? cycleDividers && accent === 'aw'
                  ? CYCLE_ACTIVE_AW[Math.floor((n - start) / 5)]
                  : a.pillActive
                : PERIOD_BTN_IDLE
            )}
          >
            {label(n)}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

export function TrainingTableWrap({ children, className = '' }) {
  return <div className={cn(TABLE.wrap, className)}>{children}</div>;
}

export function TrainingTable({ children, className = '' }) {
  return <table className={cn(TABLE.table, className)}>{children}</table>;
}

export function TrainingThead({ children, className = '' }) {
  return <thead className={cn(TABLE.thead, className)}>{children}</thead>;
}

export function TrainingTh({ children, className = '', center = false }) {
  return <th className={cn(TABLE.th, center && 'text-center', className)}>{children}</th>;
}

export function TrainingTr({ children, accent = 'neutral', className = '' }) {
  const a = ACCENT[accent] || ACCENT.neutral;
  return <tr className={cn(TABLE.tr, a.rowHover, 'text-xs', className)}>{children}</tr>;
}

export function TrainingTd({ children, className = '', athlete = false, ...rest }) {
  return (
    <td className={cn(athlete ? TABLE.tdAthlete : TABLE.td, className)} {...rest}>
      {children}
    </td>
  );
}

export function AthleteColumnHeaders({ suffix = 'kg/r', mode = 'pair' }) {
  if (mode === 'sxdx') {
    return (
      <>
        <th className={cn(TABLE.thSxDx, 'text-blue-500')}>A SX</th>
        <th className={cn(TABLE.thSxDx, 'text-blue-500')}>A DX</th>
        <th className={cn(TABLE.thSxDx, 'text-emerald-500')}>F SX</th>
        <th className={cn(TABLE.thSxDx, 'text-emerald-500')}>F DX</th>
        <th className={cn(TABLE.thSxDx, 'text-blue-500 w-9')}>A ✓</th>
        <th className={cn(TABLE.thSxDx, 'text-emerald-500 w-9')}>F ✓</th>
      </>
    );
  }
  return (
    <>
      <th className={TABLE.thAnas}>Anas{suffix ? ` (${suffix})` : ''}</th>
      <th className={TABLE.thFlavio}>Flavio{suffix ? ` (${suffix})` : ''}</th>
    </>
  );
}

export function CategorySectionTitle({ icon: Icon, label, accent = 'neutral' }) {
  const styles = {
    strength: {
      gradient: 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400',
      iconBox: 'bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    aw: {
      gradient: 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400',
      iconBox: 'bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    hyp: {
      gradient: 'from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400',
      iconBox: 'bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    neutral: {
      gradient: 'from-zinc-600 to-zinc-500',
      iconBox: 'bg-zinc-500/10 border border-zinc-500/20',
      iconColor: 'text-zinc-600 dark:text-zinc-400',
    },
  };
  const s = styles[accent] || styles.neutral;
  return (
    <div className="flex items-center gap-3 px-2 mb-2">
      <div className={cn('p-2 rounded-xl', s.iconBox)}>
        <Icon size={16} className={s.iconColor} />
      </div>
      <span
        className={cn(
          'text-sm font-black uppercase tracking-[0.25em] text-zinc-800 dark:text-zinc-200 bg-clip-text text-transparent bg-gradient-to-r',
          s.gradient
        )}
      >
        {label}
      </span>
    </div>
  );
}

export const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }) => (
  <div className="flex items-center gap-3.5 mb-5 px-1">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${colorClass}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">{title}</h3>
      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{subtitle}</p>
    </div>
  </div>
);

export const AthleteAvatar = ({ initial, colorClass }) => (
  <div className={`rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm p-[6px] w-6 h-6 ${colorClass}`}>
    {initial}
  </div>
);

const inputBase =
  'h-8 w-full rounded-lg border border-zinc-200/80 bg-zinc-50 text-center text-xs font-bold text-zinc-900 outline-none transition-colors placeholder:text-zinc-300 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export const ModernInput = ({ value, onChange, placeholder, type = 'text', step, className = '' }) => {
  const isNumericValue = value === '' || value === null || (!isNaN(parseFloat(value)) && isFinite(value));
  const actualType = (type === 'number' && value && !isNumericValue) ? 'text' : type;

  return (
    <input
      type={actualType}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(inputBase, className)}
    />
  );
};

export function CompactInput({ value, onChange, placeholder, type = 'text', step, size = 'md', className = '' }) {
  const isNumericValue = value === '' || value === null || (!isNaN(parseFloat(value)) && isFinite(value));
  const actualType = (type === 'number' && value && !isNumericValue) ? 'text' : type;
  return (
    <input
      type={actualType}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(size === 'sm' ? COMPACT_INPUT_SM : COMPACT_INPUT, className)}
    />
  );
}

const checkboxAccent = {
  'accent-indigo-500': 'accent-indigo-500',
  'accent-blue-500': 'accent-blue-500',
  'accent-emerald-500': 'accent-emerald-500',
  'accent-amber-500': 'accent-amber-500',
};

export const ModernCheckbox = ({ checked, onChange, colorClass = 'accent-indigo-500' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={cn(
      'w-4 h-4 rounded border border-zinc-300 dark:border-white/[0.1] bg-white dark:bg-zinc-950 transition-all cursor-pointer hover:border-indigo-500 shadow-sm',
      checkboxAccent[colorClass] || colorClass
    )}
  />
);

export function TrainingSurface({ children, className = '', flat = false }) {
  return (
    <div className={cn(flat ? PAGE.surfaceFlat : PAGE.surface, className)}>
      {children}
    </div>
  );
}

export function TrainingSessionHeader({ title, subtitle, progressPercent, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800/80">
      <div className="min-w-0">
        {subtitle && (
          <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', BRAND.label)}>
            {subtitle}
          </span>
        )}
        <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 capitalize tracking-tight mt-0.5 truncate">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {progressPercent != null && (
          <div className="flex flex-col items-end gap-1 min-w-[100px]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {progressPercent}%
            </span>
            <div className={cn('w-full h-1.5 rounded-full overflow-hidden', BRAND.progressTrack)}>
              <div className={cn('h-full rounded-full transition-all duration-500', BRAND.progress)} style={{ width: `${Math.min(100, progressPercent)}%` }} />
            </div>
          </div>
        )}
        {right}
      </div>
    </div>
  );
}

export function TrainingSection({ accent = 'neutral', title, subtitle, right, children, className = '', noBorder }) {
  return (
    <div className={cn(!noBorder && 'border-b border-zinc-200/60 dark:border-zinc-800/80 last:border-b-0', className)}>
      <TrainingBlockHeader accent={accent} title={title} subtitle={subtitle} right={right} />
      {children}
    </div>
  );
}

export function AthleteInputs({
  weight,
  reps,
  completed,
  onWeight,
  onReps,
  onToggle,
  athlete = 'anas',
}) {
  const checkColor = athlete === 'anas' ? 'accent-blue-500' : 'accent-emerald-500';
  return (
    <div className={ROW.athleteBlock}>
      <span className={cn(ROW.athleteLabel, athlete === 'anas' ? 'text-blue-500' : 'text-emerald-500')}>
        {athlete === 'anas' ? 'A' : 'F'}
      </span>
      <CompactInput value={weight} onChange={onWeight} placeholder="kg" type="number" step="0.5" />
      {onReps && <CompactInput value={reps} onChange={onReps} size="sm" placeholder="r" />}
      <ModernCheckbox checked={completed} onChange={onToggle} colorClass={checkColor} />
    </div>
  );
}

export function AthleteSessionRow({
  index,
  exerciseName,
  badge,
  accent = 'neutral',
  anasWeight = '',
  flavioWeight = '',
  anasReps,
  flavioReps,
  anasCompleted = false,
  flavioCompleted = false,
  onAnasWeight,
  onFlavioWeight,
  onAnasReps,
  onFlavioReps,
  onAnasToggle,
  onFlavioToggle,
  trailing,
  className = '',
}) {
  const a = ACCENT[accent] || ACCENT.neutral;
  const bothDone = anasCompleted && flavioCompleted;
  const badgeBg =
    accent === 'strength' ? 'bg-blue-600' :
    accent === 'aw' ? 'bg-amber-600' :
    accent === 'hyp' ? 'bg-emerald-600' : 'bg-zinc-500';

  return (
    <div
      className={cn(
        ROW.grid,
        ROW.gridCols,
        trailing ? ROW.gridColsHistory : '',
        ROW.divider,
        a.rowHover,
        bothDone && ROW.done,
        className
      )}
    >
      <span className={ROW.index}>{String(index).padStart(2, '0')}</span>
      <div className="min-w-0 flex items-center gap-2">
        <span className={cn(ROW.name, bothDone && 'text-zinc-400 dark:text-zinc-600')}>{exerciseName}</span>
        {badge && <span className={cn(ROW.badge, badgeBg)}>{badge}</span>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <AthleteInputs
          athlete="anas"
          weight={anasWeight}
          reps={anasReps}
          completed={anasCompleted}
          onWeight={onAnasWeight}
          onReps={onAnasReps}
          onToggle={onAnasToggle}
        />
        <AthleteInputs
          athlete="flavio"
          weight={flavioWeight}
          reps={flavioReps}
          completed={flavioCompleted}
          onWeight={onFlavioWeight}
          onReps={onFlavioReps}
          onToggle={onFlavioToggle}
        />
      </div>
      {trailing && <div className="flex justify-center">{trailing}</div>}
    </div>
  );
}

export function TrainingDayHeader({
  dayName,
  dayNum,
  isToday,
  isSelected,
  isCompleted,
  onClick,
  onToggleComplete,
}) {
  return (
    <div className="relative px-1 pt-2 pb-1">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all w-full border',
          isSelected
            ? cn(BRAND.ring, 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-300/60 dark:border-indigo-500/40')
            : isToday
              ? 'border-indigo-200/80 dark:border-indigo-500/30 bg-white dark:bg-zinc-900/60'
              : 'border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
        )}
      >
        <span className={cn('text-[9px] font-black uppercase tracking-widest', isToday ? BRAND.label : 'text-zinc-400')}>
          {dayName}
        </span>
        <span className="text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">{dayNum}</span>
      </button>
      {onToggleComplete && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleComplete(); }}
          className={cn(
            'absolute top-1 right-1 p-0.5 rounded-md transition-all z-10',
            isCompleted ? 'text-white bg-emerald-500' : 'text-zinc-300 hover:text-emerald-500'
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </button>
      )}
    </div>
  );
}

export function CalendarExerciseChip({ name, accent = 'strength', subtitle }) {
  const a = ACCENT[accent] || ACCENT.neutral;
  return (
    <div className={cn('rounded-lg border px-2 py-1.5 text-center min-h-[2.75rem] flex flex-col justify-center', a.cardBorder, a.headerBg)}>
      <span className="text-[9px] font-bold uppercase tracking-tight text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
        {name}
      </span>
      {subtitle && <span className={cn('text-[8px] font-semibold mt-0.5', a.subtitle)}>{subtitle}</span>}
    </div>
  );
}

export function TrainingPageLayout({ children }) {
  return (
    <div className={cn(PAGE.maxWidth, 'mx-auto', PAGE.sectionGap, 'px-4 py-4 pb-10')}>
      {children}
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_CSS }} />
    </div>
  );
}

export {
  TABLE,
  ACCENT,
  COMPACT_INPUT,
  COMPACT_INPUT_SM,
  PERIOD_TRACK,
  PERIOD_BTN,
  PERIOD_BTN_IDLE,
  PAGE,
  BRAND,
  ROW,
  SCROLLBAR_CSS,
};
