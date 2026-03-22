import React from 'react';
import { Icons } from './Icons';

/**
 * Single tier row in Life Goals: header (emoji, name, progress bar, collapse) + drop zone + children when expanded.
 */
export function LifeGoalTierRow({ tier, onToggleCollapse, onDrop, children }) {
  const completedCount = tier.goals.filter((g) => g.done).length;
  const totalCount = tier.goals.length;
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="group/tier flex flex-col overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-50/40 dark:border-white/[0.08] dark:bg-white/[0.02] transition-all"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-zinc-50/50', 'dark:bg-white/[0.02]');
      }}
      onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50/50', 'dark:bg-white/[0.02]')}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-zinc-50/50', 'dark:bg-white/[0.02]');
        try {
          const d = JSON.parse(e.dataTransfer.getData('application/json'));
          if (d.type === 'lifeGoal') onDrop(d.goalId, tier.id);
        } catch (_) {}
      }}
    >
      <div
        className="flex cursor-pointer items-center justify-between border-b border-zinc-100/80 px-4 py-3 transition-all hover:bg-zinc-100/50 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
        onClick={() => onToggleCollapse(tier.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-base shadow-inner group-hover/tier:scale-105 transition-transform shrink-0">
            {tier.emoji}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="break-words text-sm font-semibold leading-snug tracking-tight text-zinc-800 dark:text-zinc-100">
              {tier.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] font-bold text-zinc-400 tabular-nums">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
        <Icons.ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${tier.collapsed ? '' : 'rotate-180'}`}
        />
      </div>

      {!tier.collapsed && <div className="animate-slide-down flex flex-col gap-4 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}
