export const MAX_COMPARISON_ITEMS = 4;

export function toggleComparisonIds(selectedIds, listingId) {
  if (selectedIds.includes(listingId)) {
    return {
      selectedIds: selectedIds.filter((id) => id !== listingId),
      result: 'removed',
    };
  }
  if (selectedIds.length >= MAX_COMPARISON_ITEMS) {
    return { selectedIds, result: 'limit' };
  }
  return { selectedIds: [...selectedIds, listingId], result: 'added' };
}

export function retainAvailableComparisonIds(selectedIds, availableIds) {
  const available = new Set(availableIds);
  return selectedIds.filter((id) => available.has(id));
}

export function cursorFromUrl(url, baseUrl) {
  if (!url) return null;
  try {
    return new URL(url, baseUrl).searchParams.get('cursor');
  } catch {
    return null;
  }
}
