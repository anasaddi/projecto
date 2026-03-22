import React from 'react';

const TargetIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

/** Icona principale app: gradient indigo/purple + target, usata ovunque (header, welcome, favicon-style) */
export function AppLogo({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-8 w-8',
    sm: 'h-10 w-10',
    md: 'w-12 h-12',
    lg: 'h-16 w-16',
  };
  const iconSizes = {
    xs: 'h-4 w-4',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };
  const s = sizes[size] || sizes.md;
  const is = iconSizes[size] || iconSizes.md;

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-white/20 ${s} ${className}`}
      tabIndex={0}
    >
      <TargetIcon className={`${is} drop-shadow-md`} />
    </div>
  );
}
