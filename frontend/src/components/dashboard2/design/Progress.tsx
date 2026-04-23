import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const progressVariants = cva('relative overflow-hidden', {
  variants: {
    variant: {
      default: 'bg-stone-200 dark:bg-stone-700',
      primary: 'bg-indigo-100 dark:bg-indigo-900/30',
      success: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    size: {
      sm: 'h-1.5 rounded-full',
      md: 'h-2 rounded-full',
      lg: 'h-3 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const barVariants = cva('h-full rounded-full transition-all duration-500 ease-out', {
  variants: {
    color: {
      default: 'bg-stone-900 dark:bg-indigo-500',
      primary: 'bg-indigo-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    },
  },
  defaultVariants: {
    color: 'default',
  },
});

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number;
  max?: number;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  labelClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, variant, size, value, max = 100, color, showLabel, labelClassName, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className={cn('flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5', labelClassName)}>
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div className={cn(progressVariants({ variant, size }))}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(barVariants({ color }))}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color = 'stroke-indigo-500',
  className,
  children,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-stone-200 dark:stroke-stone-700"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};
