import React, { memo } from 'react';

interface CardV3Props {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' };

export const CardV3 = memo(function CardV3({
  children,
  className = '',
  elevated = false,
  interactive = false,
  padding = 'sm',
  onClick,
}: CardV3Props) {
  return (
    <div
      className={`d3-card border border-[var(--d3-border)] ${paddingMap[padding]} ${
        elevated ? 'd3-card-elevated' : ''
      } ${interactive ? 'd3-card-interactive' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
