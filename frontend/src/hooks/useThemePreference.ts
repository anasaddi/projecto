import { useCallback, useEffect, useState } from 'react';

/** Canonical theme storage — matches keys already used in production localStorage. */
export const THEME_STORAGE_KEY = 'km-theme';

export function readStoredTheme(): 'dark' | 'light' | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  return null;
}

export function readIsDark(): boolean {
  const saved = readStoredTheme();
  if (saved) return saved === 'dark';
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function writeTheme(isDark: boolean): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('dark', isDark);
  window.dispatchEvent(new Event('theme-changed'));
}

export function hasManualThemeOverride(): boolean {
  return readStoredTheme() !== null;
}

/** Dark/light theme with km-theme localStorage and system preference fallback. */
export function useThemePreference() {
  const [isDark, setIsDarkState] = useState(readIsDark);

  const setIsDark = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDarkState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      writeTheme(next);
      return next;
    });
  }, []);

  useEffect(() => {
    writeTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => {
      if (!hasManualThemeOverride()) setIsDarkState(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') setIsDarkState(saved === 'dark');
    };
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  return {
    isDark,
    setIsDark,
    toggleTheme: () => setIsDark((d) => !d),
  };
}
