import React from 'react';
import { motion } from 'framer-motion';

/**
 * Unified Card Component - Design System
 * Modern, consistent card component for all dashboard sections
 */

const baseClasses = `
  relative overflow-hidden
  rounded-3xl
  border border-zinc-200/70 dark:border-white/[0.08]
  bg-white/[0.9] dark:bg-[#131820]/90
  backdrop-blur-2xl
  shadow-[0_2px_4px_rgba(15,23,42,0.04),0_12px_40px_-18px_rgba(15,23,42,0.18),0_32px_64px_-36px_rgba(15,23,42,0.14)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),0_16px_48px_-20px_rgba(0,0,0,0.5),0_36px_70px_-36px_rgba(0,0,0,0.4)]
  before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent dark:before:via-white/[0.06]
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
        ${hover ? 'hover:-translate-y-0.5 hover:border-zinc-300/80 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_48px_-20px_rgba(79,70,229,0.22),0_36px_80px_-40px_rgba(79,70,229,0.16)] dark:hover:border-white/[0.12] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.3),0_20px_56px_-24px_rgba(0,0,0,0.6),0_40px_80px_-40px_rgba(0,0,0,0.5)]' : ''}
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
    <div className={`flex items-center justify-between gap-4 border-b border-zinc-100/80 p-5 dark:border-white/[0.04] ${className}`}>
      <div className="flex min-w-0 items-center gap-3.5">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100/90 dark:bg-white/[0.05] ${iconColor} shadow-sm ring-1 ring-white/60 dark:ring-white/[0.04]`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
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
    normal: 'p-5',
    large: 'p-6'
  };
  
  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-zinc-100/80 bg-zinc-50/60 px-5 py-4 dark:border-white/[0.04] dark:bg-white/[0.02] ${className}`}>
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
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
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
      <div className={`flex-1 ${sizeClasses[size]} rounded-full bg-zinc-200 dark:bg-white/[0.08] overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400 w-8 text-right">
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
    default: 'bg-zinc-100/90 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-white/[0.08]',
    primary: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-500/30',
    success: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/30',
    warning: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/30',
    danger: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-500/30'
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
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
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
        rounded-xl border border-transparent transition-all duration-200
        active:scale-[0.95]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${danger ? 'text-rose-500 hover:border-rose-100 hover:text-rose-600 dark:hover:border-rose-500/10' : 'text-zinc-500 hover:border-zinc-200/80 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-white/[0.08] dark:hover:text-zinc-200'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
