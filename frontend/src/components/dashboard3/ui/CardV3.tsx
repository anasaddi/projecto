import React, { memo } from 'react';

interface CardV3Props {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const CardV3 = memo(function CardV3({
  children,
  className = '',
  elevated = false,
  padding = 'md',
  onClick,
}: CardV3Props) {
  const baseClasses = 'd3-card bg-[var(--d3-surface)] border border-[var(--d3-border)] rounded-[var(--d3-radius-lg)]';
  const elevatedClass = elevated ? 'd3-card-elevated' : '';
  const paddingClass = paddingClasses[padding];
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${elevatedClass} ${paddingClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
