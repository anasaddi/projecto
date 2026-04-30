import React from 'react';
import { motion } from 'framer-motion';

/**
 * Unified Card Component - Design System
 * Modern, consistent card component for all dashboard sections
 */

const baseClasses = `
  relative overflow-hidden
  rounded-[18px]
  border border-zinc-200 dark:border-dark-borderSubtle
  bg-white dark:bg-dark-surface1
  backdrop-blur-2xl
  shadow-sm dark:shadow-xl
  transition-all duration-300 ease-out
`;

export function Card({ 
  children, 
  className = '',
  hover = true,
  glow = false,
  glowColor = 'indigo',
  ...props 
}) {
  const glowStyles = {
    indigo: 'ring-1 ring-indigo-500/20 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_48px_-20px_rgba(99,102,241,0.28),0_36px_70px_-36px_rgba(99,102,241,0.2)] dark:ring-indigo-400/20',
    success: 'ring-1 ring-emerald-500/20 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_48px_-20px_rgba(16,185,129,0.28),0_36px_70px_-36px_rgba(16,185,129,0.2)] dark:ring-emerald-400/20 animate-glow-success',
  };
  return (
    <div
      className={`
        ${baseClasses}
        ${hover ? 'hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-dark-borderStrong hover:shadow-md dark:hover:shadow-2xl' : ''}
        ${glow ? (glowStyles[glowColor] || glowStyles.indigo) : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  children = null, 
  icon: Icon,
  iconColor = 'text-indigo-500',
  title,
  subtitle,
  action,
  className = '' 
}) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-zinc-100 p-4 sm:gap-4 sm:p-5 dark:border-dark-borderSubtle ${className}`}>
      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-zinc-100 dark:bg-dark-surface2 ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-[15px] font-[650] tracking-tight text-zinc-900 dark:text-dark-textPrimary">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-[13px] font-medium text-zinc-500 dark:text-dark-textSecondary">{subtitle}</p>}
          {children && !title && children}
        </div>
      </div>
      {action && <div className="shrink-0 self-start sm:self-center">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', padding = 'normal' }) {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    normal: 'p-4 sm:p-5',
    large: 'p-5 sm:p-6'
  };
  
  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-dark-borderSubtle dark:bg-dark-surface2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Animated Card Entry
 */
export function AnimatedCard({ children, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  );
}

/**
 * Progress Bar - Modern style
 */
export function ProgressBar({ 
  value, 
  max = 100,
  color = 'indigo',
  size = 'md',
  showLabel = false,
  className = '' 
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const colorClasses = {
    indigo: 'from-indigo-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    sky: 'from-sky-500 to-cyan-500',
    violet: 'from-violet-500 to-purple-500'
  };
  const barGradient = colorClasses[color] || colorClasses.indigo;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 ${sizeClasses[size]} rounded-full bg-zinc-200 dark:bg-dark-surface3 overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-[600] tabular-nums text-zinc-500 dark:text-dark-textMuted w-8 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * Badge - Consistent badge styling
 */
export function Badge({ 
  children, 
  variant = 'default',
  size = 'sm',
  className = '' 
}) {
  const variantClasses = {
    default: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-dark-surface3 dark:text-dark-textSecondary dark:border-dark-borderSubtle',
    primary: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-dark-violet/10 dark:text-dark-violetLight dark:border-dark-violet/30',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-dark-teal/10 dark:text-dark-teal dark:border-dark-teal/30',
    warning: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-dark-amber/10 dark:text-dark-amber dark:border-dark-amber/30',
    danger: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-dark-rose/10 dark:text-dark-rose dark:border-dark-rose/30'
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-semibold tracking-tight shadow-sm shadow-zinc-200/40 dark:shadow-none
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
    </span>
  );
}

/**
 * Action Button - Consistent micro-interactions
 */
export function ActionButton({ 
  children, 
  onClick,
  variant = 'ghost',
  size = 'md',
  danger = false,
  className = '',
  title
}) {
  const variantClasses = {
    ghost: 'bg-transparent hover:bg-zinc-100/90 dark:hover:bg-white/[0.06]',
    subtle: 'bg-zinc-100/90 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08]',
    filled: danger 
      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/25' 
      : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-500/25'
  };
  
  const sizeClasses = {
    sm: 'p-1.5 sm:p-1',
    md: 'p-2 sm:p-1.5',
    lg: 'p-2.5 sm:p-2'
  };
  
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        rounded-[12px] transition-all duration-200
        active:scale-[0.95]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${danger ? 'text-rose-500 hover:text-rose-600 dark:text-dark-rose dark:hover:text-rose-400' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-dark-textMuted dark:hover:bg-dark-surface3 dark:hover:text-dark-textPrimary'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
