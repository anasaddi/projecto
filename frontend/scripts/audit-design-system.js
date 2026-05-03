#!/usr/bin/env node

/**
 * DESIGN SYSTEM AUDIT SCRIPT
 * 
 * Trova violazioni delle regole del design system
 * 
 * Usage:
 *   node scripts/audit-design-system.js
 * 
 * Cosa controlla:
 * - Spacing hardcoded (px-10, py-6, m-5, gap-3, etc.)
 * - Colori hex (#333, #f5f5f5)
 * - Text size custom (text-[15px])
 * - Button con className che override spacing
 * - Card con padding custom
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const VIOLATIONS = [];

// Pattern di violazioni
const PATTERNS = [
  {
    name: 'Spacing hardcoded (px)',
    regex: /px-(?!0|1|2|3|4|5|6|8|10|12)[0-9]+/g,
    severity: 'ERROR',
    message: 'Usa spacing.px.sm/md/lg/xl invece di valori custom'
  },
  {
    name: 'Spacing hardcoded (py)',
    regex: /py-(?!0|1|2|3|4|5|6|8|10|12)[0-9]+/g,
    severity: 'ERROR',
    message: 'Usa spacing.py.sm/md/lg/xl invece di valori custom'
  },
  {
    name: 'Margin hardcoded',
    regex: /\bm-[0-9]+(?!\w)/g,
    severity: 'WARNING',
    message: 'Usa spacing tokens invece di margini custom'
  },
  {
    name: 'Gap non standard',
    regex: /gap-(?!0|1|2|3|4|5|6|8|10|12)[0-9]+/g,
    severity: 'ERROR',
    message: 'Usa spacing.gap.xs/sm/md/lg/xl (solo 1-2-3-4-5-6-8-10-12)'
  },
  {
    name: 'Colore hex',
    regex: /#[0-9a-fA-F]{3,8}/g,
    severity: 'ERROR',
    message: 'Usa solo colori Tailwind (zinc-*, indigo-*, etc.)'
  },
  {
    name: 'Text size custom',
    regex: /text-\[\d+px\]/g,
    severity: 'ERROR',
    message: 'Usa t.text.xs/sm/base/lg/xl invece di valori custom'
  },
  {
    name: 'Button spacing override',
    regex: /<Button[^>]*className=["'][^"']*(?:px-\d+|py-\d+|h-\d+)/g,
    severity: 'ERROR',
    message: 'Non override spacing del Button con className'
  },
  {
    name: 'Card padding custom',
    regex: /<Card[^>]*className=["'][^"']*p-\d+/g,
    severity: 'ERROR',
    message: 'Usa Card padding="sm/md/lg" invece di className'
  }
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  PATTERNS.forEach(pattern => {
    lines.forEach((line, index) => {
      const matches = line.match(pattern.regex);
      if (matches) {
        // Escludi commenti e strings nei tokens
        if (line.includes('//') || line.includes('*') || line.includes('spacing.ts')) {
          return;
        }

        VIOLATIONS.push({
          file: path.relative(SRC_DIR, filePath),
          line: index + 1,
          pattern: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          code: line.trim()
        });
      }
    });
  });
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules e .git
      if (file === 'node_modules' || file === '.git') {
        return;
      }
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      scanFile(filePath);
    }
  });
}

function main() {
  console.log('[AUDIT] Design System Audit\n');
  console.log('Scanning:', SRC_DIR, '\n');

  scanDirectory(SRC_DIR);

  if (VIOLATIONS.length === 0) {
    console.log('[OK] Nessuna violazione trovata!\n');
    process.exit(0);
  }

  // Group by severity
  const errors = VIOLATIONS.filter(v => v.severity === 'ERROR');
  const warnings = VIOLATIONS.filter(v => v.severity === 'WARNING');

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} ERROR${errors.length > 1 ? 'S' : ''}:\n`);
    errors.forEach(v => {
      console.log(`${v.file}:${v.line}`);
      console.log(`  Pattern: ${v.pattern}`);
      console.log(`  ${v.message}`);
      console.log(`  Code: ${v.code}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} WARNING${warnings.length > 1 ? 'S' : ''}:\n`);
    warnings.forEach(v => {
      console.log(`${v.file}:${v.line}`);
      console.log(`  Pattern: ${v.pattern}`);
      console.log(`  ${v.message}`);
      console.log(`  Code: ${v.code}`);
      console.log('');
    });
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${VIOLATIONS.length} violations (${errors.length} errors, ${warnings.length} warnings)`);
  console.log('');

  // Exit with error code if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
