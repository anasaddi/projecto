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

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (ms: number) => {
      clearTimer();
      timerRef.current = setInterval(() => {
        void tickRef.current();
      }, ms);
    },
    [clearTimer]
  );

  const tickRef = useRef<() => Promise<void>>(async () => {});

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    stoppedRef.current = false;
    delayRef.current = baseIntervalMs;
  }, [baseIntervalMs]);

  tickRef.current = async () => {
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
      schedule(delayRef.current);
    } finally {
      inFlightRef.current = false;
    }
  };

  const pollNow = useCallback(async () => {
    await tickRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }
    stoppedRef.current = false;
    delayRef.current = baseIntervalMs;
    schedule(baseIntervalMs);
    return clearTimer;
  }, [enabled, baseIntervalMs, schedule, clearTimer]);

  return { stop: stop, reset, pollNow, isStopped: () => stoppedRef.current };
};
