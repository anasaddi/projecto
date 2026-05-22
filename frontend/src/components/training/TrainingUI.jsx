import React from 'react';
import { cn } from '../../lib/utils';
import { Card as DashboardCard } from '../dashboard/Card';

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
