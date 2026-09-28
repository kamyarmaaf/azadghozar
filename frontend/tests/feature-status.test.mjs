import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'src/lib/feature-status.ts'), 'utf8');
const rendered = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { upcomingPages, isUpcomingPage } = await import(`data:text/javascript,${encodeURIComponent(rendered)}`);

test('unfinished routes are explicitly labelled and render the safe placeholder', () => {
  const router = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
  for (const [page, feature] of Object.entries(upcomingPages)) {
    assert.equal(isUpcomingPage(page), true);
    assert.ok(feature.title && feature.detail);
    const quoted = page.includes('-') ? `'${page}'` : page;
    assert.ok(router.includes(`${quoted}: ComingSoonPage,`), `${page} must not render demo data`);
  }
  for (const page of ['buy', 'sell', 'services', 'buyer-dashboard', 'gallery-dashboard']) {
    assert.equal(isUpcomingPage(page), false, `${page} must remain usable`);
  }
});

test('campaign listings offer access past the first page without a 100-item request', () => {
  const page = readFileSync(join(root, 'src/components/vehicle/ListingCampaignPage.tsx'), 'utf8');
  const header = readFileSync(join(root, 'src/components/layout/Header.tsx'), 'utf8');
  const router = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
  assert.match(page, /const CAMPAIGN_PAGE_SIZE = 24/);
  assert.match(page, /page: currentPage,/);
  assert.match(page, /setCurrentPage\(1\);/);
  assert.match(page, /currentPage >= totalPages/);
  assert.match(page, /instantSale: isInstant \? true : undefined/);
  assert.match(page, /specialSale: isInstant \? undefined : true/);
  assert.match(header, /pageId: 'instant-sale'/);
  assert.match(header, /pageId: 'special-sale'/);
  assert.match(router, /'instant-sale': InstantSalePage/);
  assert.match(router, /'special-sale': SpecialSalePage/);
  assert.doesNotMatch(page, /pageSize: 100/);
});

test('empty campaign price fields do not become zero-value filters', async () => {
  const priceSource = readFileSync(join(root, 'src/lib/campaign-price.ts'), 'utf8');
  const priceModule = ts.transpileModule(priceSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const { campaignPriceValue } = await import(
    `data:text/javascript,${encodeURIComponent(priceModule)}`
  );

  assert.equal(campaignPriceValue(''), undefined);
  assert.equal(campaignPriceValue('   '), undefined);
  assert.equal(campaignPriceValue('۵٬۰۰۰'), 5_000_000_000);
  assert.equal(campaignPriceValue('0'), 0);
});

test('comparison retry reissues the candidate request', () => {
  const page = readFileSync(join(root, 'src/components/pages/ComparisonPage.tsx'), 'utf8');
  assert.match(page, /\[candidateReloadVersion, pickerOpen, search\]/);
  assert.match(page, /setCandidateReloadVersion\(\(version\) => version \+ 1\)/);
});
