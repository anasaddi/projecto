import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';
import { t, spacing, hierarchy, layoutRules } from '../styles';

/**
 * DESIGN SYSTEM VALIDATION PAGE
 * 
 * Apri questa pagina per validare visivamente:
 * - Gerarchia tipografica
 * - Spaziatura consistente
 * - Componenti funzionanti
 * - Dark mode
 * 
 * Route: /design-system-validation
 */
export function DesignSystemValidation() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className={layoutRules.container}>
        <div className={layoutRules.page}>
          {/* HERO */}
          <header className={spacing.section.xl}>
            <h1 className={hierarchy.hero.title}>
              Design System Validation
            </h1>
            <p className={hierarchy.hero.subtitle}>
              Verifica visiva di tutti i tokens e componenti
            </p>
          </header>

          {/* 1. TYPOGRAPHY */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>1. Typography Hierarchy</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.lg}>
                  <div>
                    <h1 className="text-3xl font-bold">Hero Title (3xl)</h1>
                    <p className={t.text.sm}>text-3xl - Titoli pagina principali</p>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Section Title (2xl)</h2>
                    <p className={t.text.sm}>text-2xl - Sezioni importanti</p>
                  </div>
                  <div>
                    <h3 className={t.text.xl}>Subsection (xl)</h3>
                    <p className={t.text.sm}>text-xl - Sottosezioni</p>
                  </div>
                  <div>
                    <h4 className={t.text.lg}>Card Title (lg)</h4>
                    <p className={t.text.sm}>text-lg - Titoli card</p>
                  </div>
                  <div>
                    <p className={t.text.base}>Body Text (base)</p>
                    <p className={t.text.sm}>text-base - Contenuto importante</p>
                  </div>
                  <div>
                    <p className={t.text.sm}>Default Text (sm)</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">text-sm - Default per UI</p>
                  </div>
                  <div>
                    <p className={t.text.xs}>Caption (xs)</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">text-xs - Metadata, didascalie</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 2. SPACING */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>2. Spacing Scale</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.md}>
                  {[
                    { token: 'xs', value: '4px', cls: spacing.xs },
                    { token: 'sm', value: '8px', cls: spacing.sm },
                    { token: 'md', value: '16px', cls: spacing.md },
                    { token: 'lg', value: '24px', cls: spacing.lg },
                    { token: 'xl', value: '32px', cls: spacing.xl },
                    { token: '2xl', value: '48px', cls: spacing['2xl'] },
                  ].map(s => (
                    <div key={s.token} className={s.cls + ' bg-indigo-100 dark:bg-indigo-900/30 rounded'}>
                      <code className={t.text.xs}>
                        spacing.{s.token} = {s.value}
                      </code>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 3. BUTTONS */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>3. Buttons</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.lg}>
                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>Variants</h4>
                    <div className={cn(layoutRules.flex.start, 'flex-wrap')}>
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>Sizes</h4>
                    <div className={layoutRules.flex.start}>
                      <Button size="sm">Small</Button>
                      <Button size="md">Medium</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>States</h4>
                    <div className={layoutRules.flex.start}>
                      <Button loading>Loading</Button>
                      <Button disabled>Disabled</Button>
                      <Button fullWidth>Full Width</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>With Icons</h4>
                    <div className={layoutRules.flex.start}>
                      <Button icon="➕">Add</Button>
                      <Button variant="secondary" icon="🔍">Search</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 4. CARDS */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>4. Cards</h2>
            <div className={cn(layoutRules.grid.cols3, spacing.gap.md)}>
              <Card hover>
                <CardHeader>
                  <h4 className={t.text.base}>Default Padding</h4>
                </CardHeader>
                <CardBody>
                  <p className={t.text.sm}>Padding "md" (16px) - Standard</p>
                </CardBody>
              </Card>

              <Card padding="lg" hover>
                <CardHeader>
                  <h4 className={t.text.base}>Large Padding</h4>
                </CardHeader>
                <CardBody>
                  <p className={t.text.sm}>Padding "lg" (24px) - Più spazio</p>
                </CardBody>
              </Card>

              <Card padding="sm" hover>
                <CardHeader>
                  <h4 className={t.text.base}>Small Padding</h4>
                </CardHeader>
                <CardBody>
                  <p className={t.text.sm}>Padding "sm" (8px) - Compatto</p>
                </CardBody>
              </Card>
            </div>
          </section>

          {/* 5. FORMS */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>5. Forms</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.lg}>
                  <div>
                    <label className={cn(t.text.sm, t.weight.medium, 'block mb-2')}>
                      Default Input
                    </label>
                    <Input placeholder="Type something..." />
                  </div>

                  <div>
                    <label className={cn(t.text.sm, t.weight.medium, 'block mb-2')}>
                      Error State
                    </label>
                    <Input error placeholder="Error input" />
                  </div>

                  <div className={layoutRules.flex.start}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                    />
                    <span className={t.text.sm}>Checkbox example</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 6. COLORS */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>6. Color Palette</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.md}>
                  <h4 className={t.text.sm}>Text Colors</h4>
                  <div className={layoutRules.grid.cols3}>
                    <div className={spacing.md + ' bg-zinc-100 dark:bg-zinc-800 rounded'}>
                      <p className="text-zinc-900 dark:text-zinc-50">Primary Text</p>
                      <code className={t.text.xs}>zinc-900 / zinc-50</code>
                    </div>
                    <div className={spacing.md + ' bg-zinc-100 dark:bg-zinc-800 rounded'}>
                      <p className="text-zinc-600 dark:text-zinc-400">Secondary Text</p>
                      <code className={t.text.xs}>zinc-600 / zinc-400</code>
                    </div>
                    <div className={spacing.md + ' bg-zinc-100 dark:bg-zinc-800 rounded'}>
                      <p className="text-zinc-500">Tertiary Text</p>
                      <code className={t.text.xs}>zinc-500 / zinc-500</code>
                    </div>
                  </div>

                  <h4 className={t.text.sm}>Accent Colors</h4>
                  <div className={layoutRules.grid.cols4}>
                    <div className={spacing.md + ' bg-indigo-50 dark:bg-indigo-900/20 rounded'}>
                      <p className="text-indigo-600 dark:text-indigo-400">Primary</p>
                      <code className={t.text.xs}>indigo-500/600</code>
                    </div>
                    <div className={spacing.md + ' bg-green-50 dark:bg-green-900/20 rounded'}>
                      <p className="text-green-600">Success</p>
                      <code className={t.text.xs}>green-500/600</code>
                    </div>
                    <div className={spacing.md + ' bg-yellow-50 dark:bg-yellow-900/20 rounded'}>
                      <p className="text-yellow-600">Warning</p>
                      <code className={t.text.xs}>yellow-500/600</code>
                    </div>
                    <div className={spacing.md + ' bg-red-50 dark:bg-red-900/20 rounded'}>
                      <p className="text-red-600">Danger</p>
                      <code className={t.text.xs}>red-500/600</code>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 7. LAYOUT PATTERNS */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>7. Layout Patterns</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.lg}>
                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>Grid 2 cols</h4>
                    <div className={layoutRules.grid.cols2}>
                      <div className={spacing.md + ' bg-zinc-100 dark:bg-zinc-800 rounded'}>
                        <code className={t.text.xs}>Item 1</code>
                      </div>
                      <div className={spacing.md + ' bg-zinc-100 dark:bg-zinc-800 rounded'}>
                        <code className={t.text.xs}>Item 2</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'mb-3')}>Flex Between</h4>
                    <div className={layoutRules.flex.between}>
                      <span className={t.text.sm}>Left</span>
                      <span className={t.text.sm}>Right</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* 8. RULES */}
          <section className={spacing.section.xl}>
            <h2 className={hierarchy.section.title}>8. Design Rules</h2>
            <Card>
              <CardBody>
                <div className={spacing.gap.md}>
                  <div className={spacing.md + ' bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded'}>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'text-red-700 dark:text-red-300 mb-2')}>
                      🚫 Mai Fare
                    </h4>
                    <ul className={cn(t.text.sm, 'list-disc pl-5 space-y-1')}>
                      <li>Usare px-10, py-6, m-5 (valori custom)</li>
                      <li>Override Button con className="px-10"</li>
                      <li>Colori hex (#333, #f5f5f5)</li>
                      <li>Text size custom (text-sm)</li>
                      <li>Gap non standard (gap-3, gap-5)</li>
                    </ul>
                  </div>

                  <div className={spacing.md + ' bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded'}>
                    <h4 className={cn(t.text.sm, t.weight.medium, 'text-green-700 dark:text-green-300 mb-2')}>
                      ✅ Sempre Fare
                    </h4>
                    <ul className={cn(t.text.sm, 'list-disc pl-5 space-y-1')}>
                      <li>Usare spacing.md, spacing.lg, etc.</li>
                      <li>Button size="md" o size="lg"</li>
                      <li>t.text.primary, t.text.secondary</li>
                      <li>t.text.sm, t.text.base, t.text.lg</li>
                      <li>gap.md, gap.lg dalla scala</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>

          {/* FOOTER */}
          <footer className={cn(spacing.section.xl, 'text-center text-zinc-500')}>
            <p className={t.text.sm}>
              Design System v1.0 • Tutti i componenti usano tokens vincolanti
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Helper cn locale per questa pagina
import { cn } from '../lib/utils';
