import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
        primary: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
        success: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        warning: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
        danger: 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300',
        outline: 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded-md',
        md: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
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
