import { useEffect, useRef } from 'react';
import { api } from '../api/client';

export function useDebouncedSave(
  exerciseId,
  payload,
  { delay = 750, onProgressionChange, enabled = true } = {}
) {
  const skip = useRef(true);
  const payloadJson = JSON.stringify(payload ?? null);

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
      const data = JSON.parse(payloadJson);
      api.training.updateProgression(exerciseId, data);
      onProgressionChange?.(exerciseId, data);
    }, delay);
    return () => clearTimeout(t);
  }, [payloadJson, exerciseId, delay, enabled, onProgressionChange]);
}
