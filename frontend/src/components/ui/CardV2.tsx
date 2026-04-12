import { cn } from '../../lib/utils';
import { ds } from '../../styles/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

// ============================================
// CARD VARIANTS
// ============================================
const cardVariants = cva(
  // Base styles
  'relative overflow-hidden transition-all duration-200 ease-out',
  {
    variants: {
      // Visual hierarchy
      variant: {
        elevated: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-md',
        flat: 'bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60',
        outlined: 'bg-transparent border-2 border-zinc-200 dark:border-zinc-700',
        ghost: 'bg-transparent border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800/60',
        accent: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800/50',
      },
      // Size/padding
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
        xl: 'p-6',
        none: '',
      },
      // Border radius
      radius: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
      // Interactive states
      interactive: {
        true: 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] active:duration-100',
        false: '',
      },
      // Selected state
      selected: {
        true: 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      size: 'md',
      radius: 'lg',
      interactive: false,
      selected: false,
    },
  }
);

// ============================================
// CARD COMPONENT
// ============================================
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  glow?: boolean;
  glowColor?: 'primary' | 'success' | 'warning' | 'error';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    radius, 
    interactive, 
    selected,
    glow = false,
    glowColor = 'primary',
    children, 
    ...props 
  }, ref) => {
    const glowClasses = {
      primary: 'shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10',
      success: 'shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10',
      warning: 'shadow-lg shadow-amber-500/20 dark:shadow-amber-500/10',
      error: 'shadow-lg shadow-red-500/20 dark:shadow-red-500/10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, radius, interactive, selected }),
          glow && glowClasses[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================
const cardHeaderVariants = cva(
  'flex items-center justify-between',
  {
    variants: {
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
        none: '',
      },
      bordered: {
        true: 'border-b border-zinc-200 dark:border-zinc-800',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      bordered: false,
    },
  }
);

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {
  icon?: React.ReactNode;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ 
    className, 
    size, 
    bordered,
    icon,
    iconColor = 'text-indigo-500',
    title,
    subtitle,
    action,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardHeaderVariants({ size, bordered }), className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn('flex-shrink-0', iconColor)}>
              {icon}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================
// CARD BODY
// ============================================
export const CardBody = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('flex-1 min-h-0', className)} {...props}>
      {children}
    </div>
  );
});

CardBody.displayName = 'CardBody';

// ============================================
// CARD FOOTER
// ============================================
const cardFooterVariants = cva(
  'flex items-center justify-between',
  {
    variants: {
      size: {
        sm: 'pt-2 mt-2',
        md: 'pt-3 mt-3',
        lg: 'pt-4 mt-4',
        none: '',
      },
      bordered: {
        true: 'border-t border-zinc-100 dark:border-zinc-800',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      bordered: false,
    },
  }
);

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, size, bordered, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardFooterVariants({ size, bordered }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// ============================================
// PROGRESS BAR COMPONENT
// ============================================
const progressBarVariants = cva(
  'w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800',
  {
    variants: {
      size: {
        sm: 'h-1 rounded-full',
        md: 'h-1.5 rounded-full',
        lg: 'h-2 rounded-full',
        xl: 'h-3 rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'indigo' | 'emerald' | 'amber' | 'rose';
  animated?: boolean;
  showValue?: boolean;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    className, 
    size,
    value,
    max = 100,
    color = 'primary',
    animated = true,
    showValue = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    const colorClasses = {
      primary: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
      error: 'bg-gradient-to-r from-red-500 to-rose-500',
      indigo: 'bg-indigo-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn(progressBarVariants({ size }))}>
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              colorClasses[color],
              animated && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="flex justify-between mt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

// ============================================
// BADGE COMPONENT
// ============================================
const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors',
  {
    variants: {
      variant: {
        neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
        primary: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
        success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] rounded-full',
        md: 'px-2.5 py-1 text-xs rounded-full',
        lg: 'px-3 py-1.5 text-sm rounded-full',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Export all
export { cardVariants, cardHeaderVariants, cardFooterVariants, badgeVariants };
