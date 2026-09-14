import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('admin moderation queue fetches bounded pages and exposes navigation', () => {
  const page = readFileSync(join(root, 'src/components/pages/AdminDashboardPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/listing-api.ts'), 'utf8');
  assert.match(page, /fetchAdminPendingListings\(\{ nextUrl \}\)/);
  assert.match(page, /setListingNext\(response\.next\)/);
  assert.match(page, /setListingPrevious\(response\.previous\)/);
  assert.match(api, /cursor\.origin !== base\.origin/);
  assert.match(page, /صفحهٔ بعد/);
  assert.doesNotMatch(page, /setListingsCount|listingsPage/);
  assert.doesNotMatch(page, /pageSize: 100/);
});

test('role queue requests the next page through a validated URL', () => {
  const page = readFileSync(join(root, 'src/components/pages/AdminDashboardPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/account-api.ts'), 'utf8');
  assert.match(page, /fetchPendingRoleChanges\(\{ nextUrl: roleNext \}\)/);
  assert.match(api, /nextUrl\.origin !== apiUrl\.origin/);
  assert.match(api, /next: response\.next/);
});

test('business and upgrade queues can load beyond their first cursor page', () => {
  const page = readFileSync(join(root, 'src/components/business/AdminBusinessPanel.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/business-api.ts'), 'utf8');
  assert.match(page, /fetchAdminBusinesses\(\{ kind, nextUrl: businessNext \}\)/);
  assert.match(page, /fetchAdminSubscriptions\('pending', subscriptionNext\)/);
  assert.match(api, /cursor\.origin !== base\.origin/);
});
