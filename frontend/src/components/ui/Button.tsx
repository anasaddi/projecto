import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { t } from '../../styles/tokens';
import { spacing } from '../../styles/spacing';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconOnly = false, fullWidth = false, className, children, disabled, ...props }, ref) => {
    const base = cn(
      'inline-flex items-center justify-center gap-2',
      t.weight.medium,
      t.transition.DEFAULT,
      'active:scale-[0.98]',
      'disabled:opacity-50 disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
      fullWidth && 'w-full',
      iconOnly && 'p-0'
    );

    const variants = {
      primary: 'bg-zinc-900 dark:bg-indigo-500 text-white hover:bg-zinc-800 dark:hover:bg-indigo-400',
      secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
      ghost: 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'bg-transparent border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
    };

    // Spacing vincolato - nessun override possibile
    const sizes = {
      xs: cn(t.radius.sm, 'h-6 px-2', t.text.xs, iconOnly ? 'w-6' : ''),
      sm: cn(t.radius.sm, 'h-8 px-3', t.text.xs, iconOnly ? 'w-8' : ''),
      md: cn(t.radius.md, 'h-10 px-4', t.text.sm, iconOnly ? 'w-10' : ''),
      lg: cn(t.radius.md, 'h-12 px-6', t.text.base, iconOnly ? 'w-12' : ''),
      xl: cn(t.radius.lg, 'h-14 px-8', t.text.lg, iconOnly ? 'w-14' : ''),
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && icon && <span className={iconOnly ? '' : 'flex items-center'}>{icon}</span>}
        {!iconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
