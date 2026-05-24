import { useEffect, useRef } from 'react';
import { api } from '../api/client';

export function useDebouncedSave(
  exerciseId,
  payload,
  { delay = 750, onProgressionChange, enabled = true } = {}
) {
  const skip = useRef(true);

  useEffect(() => {
    skip.current = true;
  }, [exerciseId]);

  useEffect(() => {
    if (!enabled || !exerciseId) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    const t = setTimeout(() => {
      api.training.updateProgression(exerciseId, payload);
      onProgressionChange?.(exerciseId, payload);
    }, delay);
    return () => clearTimeout(t);
  }, [payload, exerciseId, delay, enabled, onProgressionChange]);
}
