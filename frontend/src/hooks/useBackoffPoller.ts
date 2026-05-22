import { useCallback, useEffect, useRef } from 'react';

export type BackoffPollOptions = {
  baseIntervalMs?: number;
  maxIntervalMs?: number;
  stopOnStatus?: number[];
  enabled?: boolean;
};

/**
 * Interval poll with in-flight guard and exponential backoff on errors.
 * Returns stop() to halt permanently (e.g. 403/404).
 */
export function useBackoffPoller(
  pollFn: () => Promise<void>,
  {
    baseIntervalMs = 4000,
    maxIntervalMs = 30000,
    stopOnStatus = [403, 404, 500, 503],
    enabled = true,
  }: BackoffPollOptions = {}
) {
  const delayRef = useRef(baseIntervalMs);
  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const pollFnRef = useRef(pollFn);
  pollFnRef.current = pollFn;

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stoppedRef.current = false;
    delayRef.current = baseIntervalMs;
  }, [baseIntervalMs]);

  const tick = useCallback(async () => {
    if (stoppedRef.current || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      await pollFnRef.current();
      delayRef.current = baseIntervalMs;
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status != null && stopOnStatus.includes(status)) {
        stop();
        return;
      }
      delayRef.current = Math.min(delayRef.current * 2, maxIntervalMs);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(tick, delayRef.current);
    } finally {
      inFlightRef.current = false;
    }
  }, [baseIntervalMs, maxIntervalMs, stop, stopOnStatus]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    stoppedRef.current = false;
    delayRef.current = baseIntervalMs;
    timerRef.current = setInterval(tick, baseIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, baseIntervalMs, tick]);

  return { stop, reset, isStopped: () => stoppedRef.current };
}
