import React from 'react';

// Piccole intestazioni per kg, r, s
export const ColHeader = ({ label, className = '' }) => (
  <span className={`text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-[0.1em] ${className}`}>{label}</span>
);

// Shared UI Components
export const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
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
  // Determiniamo il tipo effettivo dell'input per evitare errori HTML5 con valori non numerici (es. "5-8")
  const isNumericValue = value === '' || value === null || (!isNaN(parseFloat(value)) && isFinite(value));
  const actualType = (type === 'number' && value && !isNumericValue) ? 'text' : type;

  return (
    <input
      type={actualType}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/60 rounded-lg text-xs text-center font-semibold text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500 ${className}`}
    />
  );
};

export const ModernCheckbox = ({ checked, onChange, colorClass = 'accent-blue-500' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`w-4 h-4 rounded-md border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 transition-all cursor-pointer ${colorClass}`}
  />
);
