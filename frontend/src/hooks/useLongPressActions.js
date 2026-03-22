import { useState, useRef, useCallback, useEffect } from 'react';

const LONG_PRESS_MS = 400;
const MOVE_THRESHOLD = 10;

/**
 * Hook per long-press + drag-to-icon su touch.
 * - Long press sulla zona attiva la barra
 * - Trascina sul bottone e rilascia per eseguire
 * - Su hover (desktop) la barra si mostra normalmente
 */
export function useLongPressActions({ actions = [] } = {}) {
  const [active, setActive] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const timerRef = useRef(null);
  const barRef = useRef(null);
  const startRef = useRef(null);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  const getIndexAtPoint = useCallback((clientX, clientY) => {
    if (!barRef.current) return -1;
    const buttons = barRef.current.querySelectorAll('[data-action-idx]');
    for (let i = 0; i < buttons.length; i++) {
      const r = buttons[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return i;
      }
    }
    return -1;
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (actionsRef.current.length === 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setActive(true);
      setHighlightIndex(-1);
      if (typeof navigator?.vibrate === 'function') navigator.vibrate(40);
    }, LONG_PRESS_MS);
  }, [cancel]);

  const handlePointerMove = useCallback((e) => {
    if (!active && timerRef.current) {
      const s = startRef.current;
      if (s && (Math.abs(e.clientX - s.x) > MOVE_THRESHOLD || Math.abs(e.clientY - s.y) > MOVE_THRESHOLD)) {
        cancel();
      }
      return;
    }
    if (active) setHighlightIndex(getIndexAtPoint(e.clientX, e.clientY));
  }, [active, cancel, getIndexAtPoint]);

  const handledByPointerUpRef = useRef(false);
  const handlePointerUp = useCallback((e) => {
    if (!active) {
      cancel();
      return;
    }
    const idx = getIndexAtPoint(e.clientX, e.clientY);
    setActive(false);
    setHighlightIndex(-1);
    if (idx >= 0) {
      const act = actionsRef.current[idx];
      if (act?.onClick) {
        handledByPointerUpRef.current = true;
        act.onClick(e);
        if (typeof navigator?.vibrate === 'function') navigator.vibrate(12);
        setTimeout(() => { handledByPointerUpRef.current = false; }, 100);
      }
    }
  }, [active, getIndexAtPoint, cancel]);

  useEffect(() => {
    if (!active) return;
    const up = (e) => handlePointerUp(e);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [active, handlePointerUp, cancel]);

  useEffect(() => cancel, [cancel]);

  return {
    active,
    highlightIndex,
    barRef,
    handledByPointerUpRef,
    zoneProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
    },
    getActionProps: (i) => ({
      'data-action-idx': i,
      className: highlightIndex === i ? 'scale-105 ring-2 ring-indigo-400/60 rounded-xl' : '',
    }),
  };
}
