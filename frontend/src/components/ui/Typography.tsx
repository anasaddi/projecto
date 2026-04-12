import { cn } from '../../lib/utils';

// ============================================
// TYPOGRAPHY CLASSES - Export for use
// ============================================
export const typography = {
  // Display
  'display-lg': 'text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
  'display-md': 'text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
  'display-sm': 'text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
  
  // Headings
  h1: 'text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
  h2: 'text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50',
  h3: 'text-lg font-semibold text-zinc-900 dark:text-zinc-50',
  h4: 'text-base font-semibold text-zinc-900 dark:text-zinc-50',
  h5: 'text-sm font-semibold text-zinc-900 dark:text-zinc-50',
  h6: 'text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-50',
  
  // Body
  'body-lg': 'text-base font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed',
  body: 'text-sm font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed',
  'body-sm': 'text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed',
  
  // UI Elements
  label: 'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400',
  caption: 'text-xs font-normal text-zinc-500 dark:text-zinc-400',
  overline: 'text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500',
  button: 'text-sm font-medium',
  
  // Special
  numeric: 'tabular-nums font-medium',
  mono: 'font-mono text-sm',
} as const;

// ============================================
// COLOR CLASSES
// ============================================
export const textColors = {
  default: '',
  primary: 'text-indigo-600 dark:text-indigo-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  muted: 'text-zinc-500 dark:text-zinc-400',
  inverse: 'text-white dark:text-zinc-950',
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================
export function getTextClass(
  variant: keyof typeof typography = 'body',
  color: keyof typeof textColors = 'default',
  extraClasses?: string
): string {
  return cn(typography[variant], textColors[color], extraClasses);
}

// ============================================
// TEXT COMPONENT (Simple)
// ============================================
export interface TextProps {
  children: React.ReactNode;
  variant?: keyof typeof typography;
  color?: keyof typeof textColors;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

export function Text({ 
  children, 
  variant = 'body', 
  color = 'default', 
  className,
  as: Component = 'span'
}: TextProps) {
  const classes = getTextClass(variant, color, className);
  
  if (Component === 'p') {
    return <p className={classes}>{children}</p>;
  }
  if (Component === 'div') {
    return <div className={classes}>{children}</div>;
  }
  return <span className={classes}>{children}</span>;
}

// ============================================
// HEADING COMPONENT
// ============================================
export interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: keyof typeof textColors;
  className?: string;
}

export function Heading({ 
  children, 
  level = 1, 
  color = 'default',
  className 
}: HeadingProps) {
  const variantKey = `h${level}` as keyof typeof typography;
  const classes = getTextClass(variantKey, color, className);
  
  switch (level) {
    case 1: return <h1 className={classes}>{children}</h1>;
    case 2: return <h2 className={classes}>{children}</h2>;
    case 3: return <h3 className={classes}>{children}</h3>;
    case 4: return <h4 className={classes}>{children}</h4>;
    case 5: return <h5 className={classes}>{children}</h5>;
    case 6: return <h6 className={classes}>{children}</h6>;
    default: return <h1 className={classes}>{children}</h1>;
  }
}

// ============================================
// CONVENIENCE COMPONENTS
// ============================================
export function Label({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return <span className={cn(typography.label, className)}>{children}</span>;
}

export function Caption({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return <span className={cn(typography.caption, className)}>{children}</span>;
}

export function Numeric({ 
  children, 
  className 
}: { children: React.ReactNode; className?: string }) {
  return <span className={cn(typography.numeric, className)}>{children}</span>;
}
