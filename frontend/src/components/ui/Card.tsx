import { cn } from '../../lib/utils';
import { t } from '../../styles/tokens';
import { spacing } from '../../styles/spacing';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'subtle';
}

export function Card({ children, className, hover = false, padding = 'md', variant = 'default', ...props }: CardProps) {
  const paddingMap = {
    none: '',
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const variantClasses = {
    default: `${t.border.DEFAULT} ${t.bg.DEFAULT}`,
    accent: 'border-2 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20',
    subtle: 'border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30',
  };

  return (
    <div
      className={cn(
        'overflow-hidden',
        t.radius.xl,
        t.shadow.md,
        t.transition.DEFAULT,
        hover && 'hover:shadow-lg',
        paddingMap[padding],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'border-b', 
        t.border.light, 
        spacing.md,
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(spacing.md, className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & { 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variantClasses = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        t.radius.full,
        t.weight.medium,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
