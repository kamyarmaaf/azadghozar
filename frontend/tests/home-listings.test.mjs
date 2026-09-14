import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homeListingFilters } from '../src/lib/home-listing-filters.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('home search and category filters arrive at the listing API as bounds', () => {
  assert.deepEqual(homeListingFilters({
    search: '  Camry ', brands: ['Toyota', 'BMW', 'Toyota'],
    bodyTypes: ['سدان', 'شاسی‌بلند'], city: ' کیش ',
    priceRange: '۵ تا ۱۰ میلیارد', yearRange: '۲۰۲۲ تا ۲۰۲۳',
    mileageRange: '۱۰,۰۰۰ تا ۵۰,۰۰۰ کیلومتر',
  }), {
    search: 'Camry', brands: ['Toyota', 'BMW'],
    bodyTypes: ['سدان', 'شاسی‌بلند'], city: 'کیش',
    priceMin: '5000', priceMax: '10000', yearMin: '2022', yearMax: '2023',
    mileageMin: '10', mileageMax: '50',
  });
  assert.deepEqual(homeListingFilters({ minPrice: 7_000_000_000, maxPrice: 15_000_000_000 }).priceMin, '7000');
  assert.deepEqual(homeListingFilters({ priceRange: 'تا ۵ میلیارد', mileageRange: 'صفر کیلومتر', yearRange: 'قبل از ۲۰۱۵' }), {
    search: '', brands: [], bodyTypes: [], city: '', priceMin: '', priceMax: '5000',
    yearMin: '', yearMax: '2014', mileageMin: '0', mileageMax: '0',
  });
  assert.equal(homeListingFilters({ bodyType: 'سدان' }).bodyTypes[0], 'سدان');
});

test('home all-listings actions reach the real bounded listing page', () => {
  const home = readFileSync(join(root, 'src/components/home/HomePage.tsx'), 'utf8');
  const buy = readFileSync(join(root, 'src/components/pages/BuyPage.tsx'), 'utf8');
  const router = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/listing-api.ts'), 'utf8');
  assert.match(home, /مشاهده همه آگهی‌ها/);
  assert.match(home, /onClick=\{\(\) => navigateTo\('buy'\)\}/);
  assert.match(router, /buy: BuyPage,/);
  assert.match(buy, /homeListingFilters\(pageData\)/);
  assert.match(buy, /pageSize: VEHICLES_PER_PAGE/);
  assert.match(buy, /setTotalListings\(response\.count\)/);
  assert.match(api, /params\.append\('brands', brand\)/);
  assert.match(api, /params\.append\('body_types', bodyType\)/);
  assert.doesNotMatch(buy, /pageSize: 100/);
});
