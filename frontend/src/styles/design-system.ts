/**
 * Design System v2.0 - Complete Token System
 * Comprehensive design tokens for consistent UI/UX
 */

// ============================================
// COLOR SYSTEM
// ============================================
export const colors = {
  // Primary Brand Colors
  primary: {
    50: 'bg-indigo-50 dark:bg-indigo-950/30',
    100: 'bg-indigo-100 dark:bg-indigo-900/40',
    200: 'bg-indigo-200 dark:bg-indigo-800/50',
    300: 'bg-indigo-300 dark:bg-indigo-700',
    400: 'bg-indigo-400 dark:bg-indigo-600',
    500: 'bg-indigo-500',
    600: 'bg-indigo-600',
    700: 'bg-indigo-700',
    800: 'bg-indigo-800',
    900: 'bg-indigo-900',
  },
  primaryText: {
    50: 'text-indigo-50',
    100: 'text-indigo-100',
    200: 'text-indigo-200',
    300: 'text-indigo-300',
    400: 'text-indigo-400',
    500: 'text-indigo-500',
    600: 'text-indigo-600 dark:text-indigo-400',
    700: 'text-indigo-700 dark:text-indigo-300',
    800: 'text-indigo-800 dark:text-indigo-200',
    900: 'text-indigo-900 dark:text-indigo-100',
  },
  
  // Semantic Colors - Success
  success: {
    light: 'bg-emerald-50 dark:bg-emerald-950/30',
    DEFAULT: 'bg-emerald-500',
    dark: 'bg-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  
  // Semantic Colors - Warning
  warning: {
    light: 'bg-amber-50 dark:bg-amber-950/30',
    DEFAULT: 'bg-amber-500',
    dark: 'bg-amber-600',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  
  // Semantic Colors - Error
  error: {
    light: 'bg-red-50 dark:bg-red-950/30',
    DEFAULT: 'bg-red-500',
    dark: 'bg-red-600',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  
  // Semantic Colors - Info
  info: {
    light: 'bg-blue-50 dark:bg-blue-950/30',
    DEFAULT: 'bg-blue-500',
    dark: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  
  // Neutral Colors
  neutral: {
    0: 'bg-white dark:bg-zinc-950',
    50: 'bg-zinc-50 dark:bg-zinc-900',
    100: 'bg-zinc-100 dark:bg-zinc-800',
    200: 'bg-zinc-200 dark:bg-zinc-700',
    300: 'bg-zinc-300 dark:bg-zinc-600',
    400: 'bg-zinc-400 dark:bg-zinc-500',
    500: 'bg-zinc-500',
    600: 'bg-zinc-600',
    700: 'bg-zinc-700',
    800: 'bg-zinc-800',
    900: 'bg-zinc-900',
    950: 'bg-zinc-950',
  },
  neutralText: {
    primary: 'text-zinc-900 dark:text-zinc-50',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    tertiary: 'text-zinc-400 dark:text-zinc-500',
    disabled: 'text-zinc-300 dark:text-zinc-600',
    inverse: 'text-white dark:text-zinc-950',
  },
} as const;

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================
export const typography = {
  // Display - For hero sections
  display: {
    sm: 'text-3xl font-bold tracking-tight',
    md: 'text-4xl font-bold tracking-tight',
    lg: 'text-5xl font-bold tracking-tight',
  },
  
  // Headings - Clear hierarchy
  heading: {
    h1: 'text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
    h2: 'text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50',
    h3: 'text-lg font-semibold text-zinc-900 dark:text-zinc-50',
    h4: 'text-base font-semibold text-zinc-900 dark:text-zinc-50',
    h5: 'text-sm font-semibold text-zinc-900 dark:text-zinc-50',
  },
  
  // Body text
  body: {
    large: 'text-base font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed',
    DEFAULT: 'text-sm font-normal text-zinc-700 dark:text-zinc-300 leading-relaxed',
    small: 'text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed',
  },
  
  // UI Elements
  ui: {
    label: 'text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400',
    button: 'text-sm font-medium',
    caption: 'text-xs font-normal text-zinc-500 dark:text-zinc-400',
    overline: 'text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500',
  },
  
  // Special
  numeric: 'tabular-nums font-medium',
  mono: 'font-mono text-sm',
} as const;

// ============================================
// SPACING SYSTEM (4px base unit)
// ============================================
export const spacing = {
  // Base units
  0: '0',
  1: '0.5',   // 4px
  2: '1',     // 8px
  3: '1.5',   // 12px
  4: '2',     // 16px
  5: '2.5',   // 20px
  6: '3',     // 24px
  8: '4',     // 32px
  10: '5',    // 40px
  12: '6',    // 48px
  16: '8',    // 64px
  20: '10',   // 80px
  24: '12',   // 96px
  
  // Semantic spacing
  xs: '0.5',  // 4px
  sm: '1',    // 8px
  md: '2',    // 16px
  lg: '3',    // 24px
  xl: '4',    // 32px
  '2xl': '6', // 48px
} as const;

// ============================================
// BORDER RADIUS SYSTEM
// ============================================
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',     // 2px
  DEFAULT: 'rounded',   // 4px
  md: 'rounded-md',     // 6px
  lg: 'rounded-lg',     // 8px
  xl: 'rounded-xl',     // 12px
  '2xl': 'rounded-2xl', // 16px
  '3xl': 'rounded-3xl', // 24px
  full: 'rounded-full',
} as const;

// ============================================
// SHADOW SYSTEM
// ============================================
export const shadows = {
  none: 'shadow-none',
  xs: 'shadow-sm',
  sm: 'shadow',
  DEFAULT: 'shadow-md',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  glow: {
    primary: 'shadow-lg shadow-indigo-500/25',
    success: 'shadow-lg shadow-emerald-500/25',
    warning: 'shadow-lg shadow-amber-500/25',
    error: 'shadow-lg shadow-red-500/25',
  },
} as const;

// ============================================
// ANIMATION SYSTEM
// ============================================
export const animation = {
  // Durations
  fast: 'duration-150',
  DEFAULT: 'duration-200',
  slow: 'duration-300',
  slower: 'duration-500',
  
  // Easings
  ease: 'ease-out',
  easeIn: 'ease-in',
  easeInOut: 'ease-in-out',
  spring: 'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  
  // Common transitions
  fade: 'transition-opacity duration-200',
  scale: 'transition-transform duration-200',
  colors: 'transition-colors duration-200',
  all: 'transition-all duration-200 ease-out',
  
  // Hover effects
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200',
    scale: 'hover:scale-105 transition-transform duration-200',
    glow: 'hover:shadow-lg hover:shadow-indigo-500/20 transition-shadow duration-200',
    brighten: 'hover:brightness-110 transition-all duration-200',
  },
  
  // Active effects
  active: {
    press: 'active:scale-[0.98] transition-transform duration-100',
    dim: 'active:opacity-80 transition-opacity duration-100',
  },
} as const;

// ============================================
// COMPONENT TOKENS
// ============================================
export const components = {
  // Card variants
  card: {
    // Hierarchy levels
    elevated: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md rounded-2xl',
    flat: 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl',
    outlined: 'bg-transparent border-2 border-zinc-200 dark:border-zinc-700 rounded-xl',
    ghost: 'bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-xl',
    
    // Interactive states
    interactive: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    selected: 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900',
    
    // Padding sizes
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
      xl: 'p-6',
    },
  },
  
  // Button variants
  button: {
    // Styles
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100',
    outline: 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-700 dark:text-zinc-300',
    ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    
    // Sizes
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-xl',
    icon: 'h-10 w-10 p-0 flex items-center justify-center rounded-lg',
    
    // States
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    loading: 'opacity-70 cursor-wait',
  },
  
  // Input variants
  input: {
    base: 'w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
    focus: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    success: 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500',
  },
  
  // Badge variants
  badge: {
    sm: 'px-2 py-0.5 text-[10px] font-semibold rounded-full',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-full',
    lg: 'px-3 py-1.5 text-sm font-semibold rounded-full',
    
    // Colors
    neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    primary: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  },
} as const;

// ============================================
// LAYOUT TOKENS
// ============================================
export const layout = {
  // Container widths
  container: {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  },
  
  // Grid columns
  grid: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  },
  
  // Gap sizes
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================
export const zIndex = {
  hide: '-z-10',
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modal: 'z-40',
  popover: 'z-50',
  tooltip: 'z-60',
} as const;

// ============================================
// FOCUS & ACCESSIBILITY
// ============================================
export const focus = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900',
  ringInset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500',
  visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900',
} as const;

// ============================================
// COMBINED EXPORTS
// ============================================
export const ds = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animation,
  components,
  layout,
  zIndex,
  focus,
} as const;

export default ds;
