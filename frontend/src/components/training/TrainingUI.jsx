import React from 'react';

// Piccole intestazioni per kg, r, s
export const ColHeader = ({ label, className = '' }) => (
  <span className={`text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-[0.1em] text-center w-full block ${className}`}>{label}</span>
);

// Shared UI Components
export const Card = ({ children, className = '' }) => (
  <div className={`rounded-[2rem] bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl shadow-zinc-200/10 dark:shadow-black/20 transition-all duration-300 hover:border-zinc-300/50 dark:hover:border-zinc-700/50 hover:shadow-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${colorClass}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  </div>
);

export const AthleteAvatar = ({ initial, colorClass }) => (
  <div className={`rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm p-[5px] ${colorClass}`}>
    {initial}
  </div>
);

// Form Input UI
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
      className={`w-full bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl text-xs text-center font-bold text-zinc-900 dark:text-zinc-100 focus:bg-white focus:dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-inner shadow-zinc-100/50 dark:shadow-black/20 ${className}`}
    />
  );
};

export const ModernCheckbox = ({ checked, onChange, colorClass = 'accent-blue-500' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`w-[18px] h-[18px] rounded-lg border-2 border-zinc-300/80 dark:border-zinc-700/80 bg-white/50 dark:bg-zinc-900/50 transition-all cursor-pointer hover:scale-110 shadow-sm ${colorClass}`}
  />
);
