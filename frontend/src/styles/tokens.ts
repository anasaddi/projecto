/**
 * Design Tokens - STRICT TAILWIND SCALE ONLY
 * ZERO custom pixel values - use Tailwind scale or don't use tokens
 */

export const t = {
  // Border Radius - TAILWIND SCALE ONLY
  radius: {
    sm: 'rounded-md',    // 6px
    md: 'rounded-lg',    // 8px
    lg: 'rounded-xl',    // 12px
    xl: 'rounded-2xl',   // 16px
    '2xl': 'rounded-3xl', // 24px
    full: 'rounded-full', // 9999px
  },

  // Shadows - 4 VARIANTS MAX
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  // Border Colors - 3 VARIANTS MAX
  border: {
    DEFAULT: 'border-zinc-200 dark:border-zinc-700',
    light: 'border-zinc-100 dark:border-zinc-800',
    accent: 'border-indigo-500',
  },

  // Background - 3 VARIANTS MAX
  bg: {
    DEFAULT: 'bg-white dark:bg-zinc-900',
    muted: 'bg-zinc-50 dark:bg-zinc-800',
    accent: 'bg-indigo-500',
  },

  // Typography - TAILWIND SCALE ONLY
  text: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
  },

  // Font Weight
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },

  // Spacing - TAILWIND SCALE
  spacing: {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-6',
  },

  // Gap
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  },

  // Transitions
  transition: {
    DEFAULT: 'transition-all duration-200',
  },
} as const;

export type Tokens = typeof t;
