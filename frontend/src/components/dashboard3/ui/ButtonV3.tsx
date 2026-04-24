import React, { memo } from 'react';

interface ButtonV3Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  primary: 'd3-btn-primary bg-[var(--d3-primary)] text-white hover:bg-[var(--d3-primary-dark)]',
  secondary: 'd3-btn-secondary bg-[var(--d3-surface-elevated)] border-[var(--d3-border)] text-[var(--d3-text)] hover:border-[var(--d3-border-strong)]',
  ghost: 'bg-transparent text-[var(--d3-text-secondary)] hover:bg-[var(--d3-surface-elevated)] hover:text-[var(--d3-text)]',
  danger: 'bg-[var(--d3-danger)] text-white hover:opacity-90',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const ButtonV3 = memo(function ButtonV3({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: ButtonV3Props) {
  const baseClasses = 'd3-btn inline-flex items-center justify-center gap-2 font-medium rounded-[var(--d3-radius-md)] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});
