import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cursorFromUrl,
  MAX_COMPARISON_ITEMS,
  retainAvailableComparisonIds,
  toggleComparisonIds,
} from '../src/lib/comparison-selection.mjs';

test('adds and removes a listing without mutating the input', () => {
  const original = [11, 22];
  const added = toggleComparisonIds(original, 33);
  const removed = toggleComparisonIds(added.selectedIds, 22);

  assert.deepEqual(original, [11, 22]);
  assert.deepEqual(added, { selectedIds: [11, 22, 33], result: 'added' });
  assert.deepEqual(removed, { selectedIds: [11, 33], result: 'removed' });
});

test('enforces the four-listing comparison limit', () => {
  const selectedIds = Array.from(
    { length: MAX_COMPARISON_ITEMS },
    (_, index) => index + 1,
  );

  assert.deepEqual(toggleComparisonIds(selectedIds, 99), {
    selectedIds,
    result: 'limit',
  });
});

test('removes listings that are no longer active', () => {
  assert.deepEqual(
    retainAvailableComparisonIds([10, 20, 30, 40], [40, 10, 30]),
    [10, 30, 40],
  );
});

test('extracts an opaque cursor from the next-page URL', () => {
  assert.equal(
    cursorFromUrl(
      'https://api.example.test/listings/?cursor=cD0yMDI2&page_size=16',
      'https://api.example.test/api/v1',
    ),
    'cD0yMDI2',
  );
  assert.equal(cursorFromUrl(null, 'https://api.example.test'), null);
  assert.equal(cursorFromUrl('not a url', 'not a base'), null);
});
