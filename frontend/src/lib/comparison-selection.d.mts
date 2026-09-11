export const MAX_COMPARISON_ITEMS: 4;

export type ComparisonToggleResult = 'added' | 'removed' | 'limit';

export function toggleComparisonIds(
  selectedIds: number[],
  listingId: number,
): {
  selectedIds: number[];
  result: ComparisonToggleResult;
};

export function retainAvailableComparisonIds(
  selectedIds: number[],
  availableIds: number[],
): number[];

export function cursorFromUrl(
  url: string | null,
  baseUrl: string,
): string | null;
