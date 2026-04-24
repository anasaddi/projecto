import React, { memo } from 'react';
import { CardV3 } from '../ui/CardV3';

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

const STATS: Stat[] = [
  { label: 'Focus Score', value: '87%', change: '+12%', trend: 'up', icon: '🎯', color: '#6366f1' },
  { label: 'Tasks Done', value: '24', change: '+5', trend: 'up', icon: '✓', color: '#22c55e' },
  { label: 'Streak', value: '12d', change: '0', trend: 'neutral', icon: '🔥', color: '#f59e0b' },
  { label: 'Productivity', value: '92', change: '-3', trend: 'down', icon: '📈', color: '#ef4444' },
];

export const StatsMiniV3 = memo(function StatsMiniV3() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {STATS.map((stat) => (
        <CardV3 key={stat.label} padding="sm" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--d3-radius-md)] flex items-center justify-center text-lg"
            style={{ backgroundColor: `${stat.color}15` }}
          >
            {stat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--d3-text-muted)] truncate">{stat.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--d3-text)]">{stat.value}</span>
              <span
                className={`text-xs ${
                  stat.trend === 'up'
                    ? 'text-[var(--d3-success)]'
                    : stat.trend === 'down'
                    ? 'text-[var(--d3-danger)]'
                    : 'text-[var(--d3-text-muted)]'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </CardV3>
      ))}
    </div>
  );
});
