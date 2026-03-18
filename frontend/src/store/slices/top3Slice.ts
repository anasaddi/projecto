import type { Top3Slot } from '../../types/dashboard';

export type Top3Set = (fn: (s: unknown) => void) => void;

export function createTop3Slice(set: Top3Set) {
  return {
    setTop3SlotAtIndex: (index: number, slot: Top3Slot | null) =>
      set((s: unknown) => {
        (s as { top3Manual: (Top3Slot | null)[] }).top3Manual[index] = slot;
      }),

    reorderTop3: (fromIndex: number, toIndex: number) =>
      set((s: unknown) => {
        const state = s as { top3Manual: (Top3Slot | null)[] };
        const item = state.top3Manual[fromIndex];
        state.top3Manual[fromIndex] = state.top3Manual[toIndex];
        state.top3Manual[toIndex] = item;
      }),

    removeFromTop3: (index: number) =>
      set((s: unknown) => {
        (s as { top3Manual: (Top3Slot | null)[] }).top3Manual[index] = null;
      }),
  };
}
