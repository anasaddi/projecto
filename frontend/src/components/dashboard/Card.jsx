import React from 'react';
import { motion } from 'framer-motion';

/**
 * Unified Card Component - Design System
 * Modern, consistent card component for all dashboard sections
 */

const baseClasses = `
  relative overflow-hidden
  rounded-2xl
  border border-zinc-200/60 dark:border-white/[0.08]
  bg-white/80 dark:bg-[#161920]/80
  backdrop-blur-xl
  shadow-sm shadow-zinc-200/50 dark:shadow-black/20
  transition-all duration-300 ease-out
`;

export function Card({ 
  children, 
  className = '',
  hover = true,
  glow = false,
  ...props 
}) {
  return (
    <div
      className={`
        ${baseClasses}
        ${hover ? 'hover:shadow-lg hover:shadow-zinc-300/40 dark:hover:shadow-black/40 hover:-translate-y-0.5' : ''}
        ${glow ? 'ring-1 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  children, 
  icon: Icon,
  iconColor = 'text-indigo-500',
  title,
  subtitle,
  action,
  className = '' 
}) {
  return (
    <div className={`flex items-center justify-between gap-3 p-4 border-b border-zinc-100 dark:border-white/[0.04] ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={`p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] ${iconColor} shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{subtitle}</p>}
          {children && !title && children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', padding = 'normal' }) {
  const paddingClasses = {
    none: '',
    small: 'p-2',
    normal: 'p-4',
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
    <div className={`px-4 py-3 border-t border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.02] ${className}`}>
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
    sky: 'from-sky-500 to-cyan-500'
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 ${sizeClasses[size]} rounded-full bg-zinc-200 dark:bg-white/[0.08] overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colorClasses[color]} shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-bold tabular-nums text-zinc-500 dark:text-zinc-400 w-8 text-right">
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
    default: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]',
    primary: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
    success: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    warning: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    danger: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1 rounded-full border font-semibold tracking-tight
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
    ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.06]',
    subtle: 'bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08]',
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
        rounded-lg transition-all duration-200
        active:scale-[0.95]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${danger ? 'text-rose-500 hover:text-rose-600' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
