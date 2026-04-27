import type { Top3Slot } from '../../types/dashboard';

export type Top3Set = (fn: (s: unknown) => void) => void;
const TOP3_SIZE = 3;

export function createTop3Slice(set: Top3Set) {
  return {
    setTop3SlotAtIndex: (index: number, slot: Top3Slot | null) =>
      set((s: unknown) => {
        if (index < 0 || index >= TOP3_SIZE) return;
        (s as { top3Manual: (Top3Slot | null)[] }).top3Manual[index] = slot;
      }),

    reorderTop3: (fromIndex: number, toIndex: number) =>
      set((s: unknown) => {
        if (fromIndex < 0 || fromIndex >= TOP3_SIZE) return;
        if (toIndex < 0 || toIndex >= TOP3_SIZE) return;
        if (fromIndex === toIndex) return;
        const state = s as { top3Manual: (Top3Slot | null)[] };
        const item = state.top3Manual[fromIndex];
        state.top3Manual[fromIndex] = state.top3Manual[toIndex];
        state.top3Manual[toIndex] = item;
      }),

    removeFromTop3: (index: number) =>
      set((s: unknown) => {
        if (index < 0 || index >= TOP3_SIZE) return;
        (s as { top3Manual: (Top3Slot | null)[] }).top3Manual[index] = null;
      }),
  };
}
