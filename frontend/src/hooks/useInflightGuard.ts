import { useCallback, useRef } from 'react';

/** Prevent overlapping async calls (e.g. shared dashboard poll). */
export function useInflightGuard() {
  const inFlightRef = useRef(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlightRef.current) return undefined;
    inFlightRef.current = true;
    try {
      return await fn();
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const isBusy = useCallback(() => inFlightRef.current, []);

  return { run, isBusy };
}
