/**
 * VISUAL VALIDATION CHECKLIST
 * 
 * Come usare:
 * 1. Apri ogni pagina dell'app
 * 2. Verifica ogni punto della checklist
 * 3. Segna ✅ o ❌
 * 
 * Se trovi ❌ → FIX IMMEDIATO
 */

export const visualValidation = {
  // 1. SPACING CONSISTENCY
  spacing: {
    name: 'Spacing Consistency',
    checks: [
      'Tutte le Card usano padding uniforme (p-4 default)',
      'Gap tra elementi in lista: gap-2 (liste strette) o gap-4 (default)',
      'Sezioni separate da space-y-6 (mai margini a caso)',
      'Nessun px-10, py-6, m-5 o valori custom sparsi',
      'Container page usa padding responsive: p-4 md:p-6 lg:p-8',
    ],
  },

  // 2. TYPOGRAPHY HIERARCHY
  typography: {
    name: 'Typography Hierarchy',
    checks: [
      'Titolo pagina: text-2xl font-bold (dashboard)',
      'Titolo sezione: text-lg font-semibold',
      'Titolo card/sottosezione: text-base font-medium',
      'Body text: text-sm (default) o text-base (importante)',
      'Caption/metadata: text-xs text-zinc-500',
      'Nessun text-xl, text-3xl sparsi senza motivo',
    ],
  },

  // 3. COLOR USAGE
  color: {
    name: 'Color Usage',
    checks: [
      'Background: bg-zinc-50 (light) / bg-zinc-900 (dark)',
      'Card bg: bg-white / bg-zinc-800',
      'Text primario: text-zinc-900 / text-zinc-50',
      'Text secondario: text-zinc-600 / text-zinc-400',
      'Text terziario: text-zinc-500 / text-zinc-500',
      'Accent: SOLO indigo-500/600 per azioni importanti',
      'Danger: SOLO red-500/600 per distruzione',
      'Success: green-500/600',
      'Nessun colore custom (#hex) fuori dai tokens',
    ],
  },

  // 4. COMPONENT CONSISTENCY
  components: {
    name: 'Component Consistency',
    checks: [
      'Button: SOLO variant ["primary","secondary","ghost","danger"]',
      'Button: SOLO size ["sm","md","lg"] - mai h-14 o px-10',
      'Card: padding SOLO ["none","sm","md","lg"]',
      'Input: variant SOLO ["default","error"]',
      'Checkbox: mai modificato con className custom',
      'Tutti i componenti usano tokens, mai valori hardcoded',
    ],
  },

  // 5. LAYOUT PATTERNS
  layout: {
    name: 'Layout Patterns',
    checks: [
      'Grid stats: grid-cols-2 lg:grid-cols-4',
      'Grid card: grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      'Flex righe: items-center justify-between',
      'Flex colonne: flex-col gap-4',
      'Container centrato: max-w-7xl mx-auto',
      'Nessun layout custom senza motivo valido',
    ],
  },

  // 6. RESPONSIVE BEHAVIOR
  responsive: {
    name: 'Responsive Behavior',
    checks: [
      'Mobile: tutto stacked (flex-col, grid-cols-1)',
      'Tablet (md): 2 colonne dove appropriato',
      'Desktop (lg): layout completo (3-4 colonne)',
      'Padding responsive: p-4 → md:p-6 → lg:p-8',
      'Testi non diventano troppo piccoli/grandi',
    ],
  },

  // 7. INTERACTION FEEDBACK
  interaction: {
    name: 'Interaction Feedback',
    checks: [
      'Hover states su tutti i button e card cliccabili',
      'Disabled states visibili (opacity-50)',
      'Loading states con spinner',
      'Error states con border-color red-500',
      'Focus visible per accessibilità',
      'Transizioni smooth su hover (transition DEFAULT)',
    ],
  },

  // 8. VISUAL RHYTHM
  rhythm: {
    name: 'Visual Rhythm',
    checks: [
      'Spaziatura verticale consistente (4-6-8 pattern)',
      'Nessun elemento "appiccicato" o "troppo distante"',
      'Gerarchia chiara: titolo > sezione > contenuto',
      'Allineamento consistente (tutto left o tutto center)',
      'Bordi e shadow sottili, non invasivi',
    ],
  },
};

/**
 * QUICK AUDIT SCRIPT
 * 
 * Da eseguire periodicamente per trovare violazioni:
 * 
 * ```bash
 * # Cerca spacing hardcoded
 * grep -r "px-[0-9]" src/components/
 * grep -r "py-[0-9]" src/components/
 * grep -r "m-[0-9]" src/components/
 * grep -r "gap-[0-9]" src/components/
 * 
 * # Cerca colori hardcoded
 * grep -r "#[0-9a-fA-F]" src/
 * 
 * # Cerca text size custom
 * grep -r "text-[0-9]" src/
 * ```
 */
