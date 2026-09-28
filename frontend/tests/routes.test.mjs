import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/lib/routes.ts'), 'utf8');
const rendered = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { buildPageUrl, parseLegacyHash, parsePageLocation } = await import(
  `data:text/javascript,${encodeURIComponent(rendered)}`
);

test('builds stable public URLs for detail pages', () => {
  assert.equal(buildPageUrl('vehicle-details', { vehicleId: 42 }), '/cars/42');
  assert.equal(buildPageUrl('brand-detail', { brandSlug: 'nissan' }), '/brands/nissan');
  assert.equal(buildPageUrl('dealership-detail', { businessSlug: 'azad-import' }), '/agencies/azad-import');
  assert.equal(buildPageUrl('gallery-detail', { businessSlug: 'dehghanpour' }), '/galleries/dehghanpour');
  assert.equal(buildPageUrl('article-detail', { articleId: 'nissan-terra-review' }), '/magazine/nissan-terra-review');
  assert.equal(buildPageUrl('video-detail', { videoId: 'import-guide' }), '/videos/import-guide');
});

test('parses real URLs into page data on direct visits', () => {
  assert.deepEqual(parsePageLocation('/cars/42'), { page: 'vehicle-details', data: { vehicleId: '42' } });
  assert.deepEqual(parsePageLocation('/magazine/nissan-terra-review/'), { page: 'article-detail', data: { articleId: 'nissan-terra-review' } });
  assert.deepEqual(parsePageLocation('/agencies/company-one'), { page: 'dealership-detail', data: { businessSlug: 'company-one' } });
});

test('keeps listing filters and registration referrals shareable', () => {
  const carsUrl = buildPageUrl('buy', {
    search: 'نیسان ترا',
    brands: ['Nissan'],
    bodyTypes: ['SUV'],
    minPrice: 5000000000,
  });
  assert.match(carsUrl, /^\/cars\?/);
  assert.deepEqual(parsePageLocation(...carsUrl.split('?')), {
    page: 'buy',
    data: {
      search: 'نیسان ترا',
      brands: ['Nissan'],
      bodyTypes: ['SUV'],
      minPrice: 5000000000,
    },
  });
  assert.equal(buildPageUrl('register', { referralCode: 'ABC123' }), '/register?ref=ABC123');
});

test('old hash links can be redirected without losing their target', () => {
  assert.deepEqual(parseLegacyHash('#article-detail?article=nissan-terra-review'), {
    page: 'article-detail',
    data: { articleId: 'nissan-terra-review' },
  });
  assert.deepEqual(parseLegacyHash('#register?type=gallery&ref=ABC123'), {
    page: 'register',
    data: { registrationType: 'gallery', referralCode: 'ABC123' },
  });
});
