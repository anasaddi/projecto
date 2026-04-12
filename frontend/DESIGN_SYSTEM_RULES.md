# Design System - Regole Vincolanti

## 🚫 REGOLE ASSOLUTE (Mai violare)

### 1. SPACING
```tsx
// ❌ SBAGLIATO - Valori arbitrari
<div className="px-10 py-6 m-5 gap-3">
<Card className="p-7">

// ✅ CORRETTO - Solo tokens
import { spacing } from '@/styles';
<div className={cn(spacing.px.lg, spacing.py.xl, spacing.gap.md)}>
<Card padding="lg">
```

### 2. BUTTON
```tsx
// ❌ SBAGLIATO - Override spacing
<Button className="px-10 py-6 text-xl">

// ✅ CORRETTO - Solo variant + size
<Button variant="primary" size="lg">
<Button variant="secondary" size="sm" loading>
<Button fullWidth>  {/* Se serve full width */}
```

### 3. CARD
```tsx
// ❌ SBAGLIATO - Padding custom
<Card className="p-7">
<Card className="px-5 py-3">

// ✅ CORRETTO - Solo padding prop
<Card padding="md">    {/* default */}
<Card padding="lg">    {/* più spazio */}
<Card padding="none">  {/* control totale interno */}
```

### 4. TYPOGRAPHY
```tsx
// ❌ SBAGLIATO - Size a caso
<h1 className="text-4xl">
<p className="text-[15px]">

// ✅ CORRETTO - Solo scale definita
<h1 className={t.text['2xl']}>   {/* Titoli pagina */}
<h2 className={t.text.xl}>       {/* Sezioni */}
<p className={t.text.base}>      {/* Body */}
<span className={t.text.sm}>     {/* Default */}
<span className={t.text.xs}>     {/* Caption */}
```

### 5. COLORS
```tsx
// ❌ SBAGLIATO - Colori custom
<div className="bg-[#f5f5f5]">
<p className="text-[#333]">

// ✅ CORRETTO - Solo palette
<div className={t.bg.DEFAULT}>
<p className={t.text.primary}>
<p className={t.text.secondary}>
```

## 📐 SPACING SYSTEM

| Token    | Valore | Uso                           |
|----------|--------|-------------------------------|
| xs       | 4px    | Micro spazi (icone)           |
| sm       | 8px    | Spazi interni minimi          |
| md       | 16px   | **STANDARD** - Card, sezioni  |
| lg       | 24px   | Sezioni grandi                |
| xl       | 32px   | Layout principali             |
| 2xl      | 48px   | Hero, sezioni importanti      |

## 🎯 COMPONENT API

### Button
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}
```

### Card
```tsx
interface CardProps {
  hover?: boolean;
  padding: 'none' | 'sm' | 'md' | 'lg';
}
```

### Input
```tsx
interface InputProps {
  variant: 'default' | 'error';
  // NO altri variants
}
```

## 🔍 AUDIT AUTOMATICO

Esegui periodicamente per trovare violazioni:

```bash
# Nella root del frontend
cd frontend

# Cerca spacing hardcoded
grep -r "px-[0-9]" src/components/ src/pages/
grep -r "py-[0-9]" src/components/ src/pages/
grep -r "m-[0-9]" src/components/ src/pages/
grep -r "gap-[0-9]" src/components/ src/pages/

# Cerca colori hex
grep -r "#[0-9a-fA-F]\{3,\}" src/

# Cerca text size custom
grep -r "text-\[" src/
```

**Se trovi risultati → FIX IMMEDIATO**

## ✅ CHECKLIST VALIDAZIONE

Prima di ogni commit:

- [ ] Nessun spacing hardcoded (solo tokens)
- [ ] Nessun colore custom (solo palette)
- [ ] Button usa solo variant/size definite
- [ ] Card usa solo padding prop
- [ ] Gerarchia tipografica rispettata
- [ ] Layout responsive testato (mobile/tablet/desktop)
- [ ] Hover/focus states funzionanti
- [ ] Nessun elemento "appiccicato" o "troppo distante"

## 📖 ESEMPI PRATICI

### Sezione Dashboard
```tsx
import { spacing, hierarchy, layoutRules } from '@/styles';
import { Card, CardHeader, CardBody } from '@/components/ui';

export function DashboardStats() {
  return (
    <section className={spacing.section.md}>
      {/* Titolo sezione */}
      <h2 className={hierarchy.section.title}>Statistiche</h2>
      
      {/* Grid cards */}
      <div className={layoutRules.grid.cols4}>
        {stats.map(stat => (
          <Card key={stat.id} hover>
            <CardBody>
              <p className={t.text.xs}>{stat.label}</p>
              <p className={t.text['2xl']}>{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

### Form
```tsx
import { spacing } from '@/styles';
import { Input, Button } from '@/components/ui';

export function SearchForm() {
  return (
    <form className={spacing.gap.md}>
      <Input placeholder="Cerca..." />
      <Button size="md" variant="primary">
        Cerca
      </Button>
    </form>
  );
}
```

## 🚨 VIOLAZIONI COMUNI

| Violazione                  | Perché è sbagliata           | Fix                    |
|-----------------------------|------------------------------|------------------------|
| `<Button className="px-10">`| Rompe consistenza            | Usa `size="lg"`        |
| `<Card className="p-7">`    | Padding non standard         | Usa `padding="lg"`     |
| `text-[15px]`               | Non scala, non responsive    | Usa `t.text.sm/base`   |
| `gap-3`                     | Non nella scala              | Usa `gap-2` o `gap-4`  |
| `mb-5`                      | Valore dispari, non scalare  | Usa `mb-4` o `mb-6`    |

## 💡 FILOSOFIA

> "Meglio avere 5 opzioni consistenti che 100 opzioni caotiche"

Il design system è **vincolante per design**:
- Non puoi sbagliare se segui le API
- Se hai bisogno di qualcosa di diverso, **prima aggiungi il token**
- **Mai** bypassare con className custom

Questo garantisce che tra 6 mesi l'UI sia ancora consistente.
