import React from 'react';

const CYCLE_ACTIVE = [
  'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-orange-500 dark:text-orange-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-rose-500 dark:text-rose-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-violet-500 dark:text-violet-400 shadow-sm',
];

export default function WeekSelector({
  weeks = 5,
  current,
  onChange,
  cycleDividers = false,
  compact = false,
  className = '',
}) {
  const btnClass = compact ? 'w-6 h-6 rounded-md text-xs' : 'w-7 h-7 rounded-lg text-xs';

  return (
    <div className={`flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl overflow-x-auto custom-scrollbar ${className}`}>
      {Array.from({ length: weeks }, (_, i) => i + 1).map(w => (
        <React.Fragment key={w}>
          {cycleDividers && w > 1 && w % 5 === 1 && (
            <div className="w-px h-4 bg-gray-300 dark:bg-zinc-600 shrink-0 mx-0.5" />
          )}
          <button
            type="button"
            onClick={() => onChange(w)}
            className={`${btnClass} font-bold transition-all shrink-0 ${
              current === w
                ? cycleDividers
                  ? CYCLE_ACTIVE[Math.floor((w - 1) / 5)]
                  : 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            }`}
          >
            {w}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
