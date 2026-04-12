/**
 * SPACING TOKENS - Vincoli assoluti per il sistema di layout
 * 
 * REGOLE:
 * - Mai usare valori hardcoded (px-10, py-6, m-5, etc.)
 * - Solo questi valori sono consentiti
 * - Ogni componente DEVE usare questi token
 * 
 * Se hai bisogno di uno spacing diverso, PRIMA aggiungi qui,
 * POI aggiorni il componente. MAI bypassare.
 */

export const spacing = {
  // Internal component padding (Card, Button, etc.)
  xs: 'p-1',      // 4px - solo per micro-spazi
  sm: 'p-2',      // 8px - spazi interni minimi
  md: 'p-4',      // 16px - STANDARD padding componenti
  lg: 'p-6',      // 24px - sezioni, card grandi
  xl: 'p-8',      // 32px - layout principali
  '2xl': 'p-12',  // 48px - hero, sezioni importanti

  // Horizontal only
  px: {
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
    xl: 'px-8',
  },

  // Vertical only
  py: {
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-6',
    xl: 'py-8',
  },

  // Gaps (flex/grid)
  gap: {
    xs: 'gap-1',   // 4px
    sm: 'gap-2',   // 8px
    md: 'gap-4',   // 16px - STANDARD
    lg: 'gap-6',   // 24px
    xl: 'gap-8',   // 32px
  },

  // Section spacing (tra blocchi)
  section: {
    sm: 'space-y-4',
    md: 'space-y-6',  // STANDARD tra sezioni
    lg: 'space-y-8',
    xl: 'space-y-12',
  },

  // Margins
  mx: {
    auto: 'mx-auto',
    sm: 'mx-2',
    md: 'mx-4',
    lg: 'mx-6',
  },

  my: {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-6',
    xl: 'my-8',
  },
} as const;

/**
 * LAYOUT RULES - Pattern di layout consentiti
 */
export const layoutRules = {
  // Container max-width
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Page padding
  page: 'p-4 md:p-6 lg:p-8',
  
  // Grid patterns
  grid: {
    cols2: 'grid grid-cols-1 sm:grid-cols-2',
    cols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  // Flex patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center gap-2',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
} as const;

/**
 * VISUAL HIERARCHY RULES
 * 
 * Ogni livello ha spaziatura e dimensione predefinite:
 * 
 * HERO (titoli pagina):      text-3xl mb-8
 * SECTION (sezioni):         text-xl mb-6  
 * SUBSECTION (sottosezioni): text-lg mb-4
 * BODY (contenuto):          text-base mb-2
 * CAPTION (didascalie):      text-sm text-zinc-500
 */
export const hierarchy = {
  hero: {
    title: 'text-3xl font-bold mb-8',
    subtitle: 'text-lg text-zinc-600 dark:text-zinc-400 mb-8',
  },
  section: {
    title: 'text-xl font-semibold mb-6',
    content: 'mb-6',
  },
  subsection: {
    title: 'text-lg font-medium mb-4',
    content: 'mb-4',
  },
  body: {
    text: 'text-base mb-2',
    small: 'text-sm mb-2',
  },
  caption: 'text-xs text-zinc-500 dark:text-zinc-400',
} as const;
