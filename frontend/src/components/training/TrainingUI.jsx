import React from 'react';
import { cn } from '../../lib/utils';
import { Card as DashboardCard } from '../dashboard/Card';
import { ACCENT, TABLE, COMPACT_INPUT, PERIOD_TRACK, PERIOD_BTN, PERIOD_BTN_IDLE } from './trainingTableTheme';

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

export { TABLE, ACCENT, PERIOD_TRACK, PERIOD_BTN, PERIOD_BTN_IDLE };
