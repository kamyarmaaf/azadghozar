'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_COMPARISON_ITEMS,
  retainAvailableComparisonIds,
  toggleComparisonIds,
  type ComparisonToggleResult,
} from '@/lib/comparison-selection.mjs';

export { MAX_COMPARISON_ITEMS };

interface ComparisonState {
  selectedIds: number[];
  toggle: (listingId: number) => ComparisonToggleResult;
  remove: (listingId: number) => void;
  syncAvailable: (availableIds: number[]) => void;
  clear: () => void;
}

export const useComparison = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      toggle: (listingId) => {
        const change = toggleComparisonIds(get().selectedIds, listingId);
        if (change.result !== 'limit') set({ selectedIds: change.selectedIds });
        return change.result;
      },
      remove: (listingId) => {
        set({ selectedIds: get().selectedIds.filter((id) => id !== listingId) });
      },
      syncAvailable: (availableIds) => {
        set({
          selectedIds: retainAvailableComparisonIds(
            get().selectedIds,
            availableIds,
          ),
        });
      },
      clear: () => set({ selectedIds: [] }),
    }),
    {
      name: 'azadgozar-comparison',
      partialize: (state) => ({ selectedIds: state.selectedIds }),
    },
  ),
);
