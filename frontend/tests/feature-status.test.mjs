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
  for (const page of ['buy', 'sell', 'services', 'buyer-dashboard', 'gallery-dashboard', 'agency-dashboard']) {
    assert.equal(isUpcomingPage(page), false, `${page} must remain usable`);
  }
  assert.equal(isUpcomingPage('brands'), false);
  assert.equal(isUpcomingPage('brand-detail'), false);
  assert.equal(isUpcomingPage('videos'), false);
  assert.equal(isUpcomingPage('video-detail'), false);
  assert.equal(isUpcomingPage('faq'), false);
  assert.match(router, /brands: BrandsPage/);
  assert.match(router, /'brand-detail': BrandDetailPage/);
  assert.match(router, /videos: VideosPage/);
  assert.match(router, /'video-detail': VideoDetailPage/);
  assert.match(router, /faq: FAQPage/);
});

test('brands page loads real catalog data and opens a brand detail', () => {
  const page = readFileSync(join(root, 'src/components/pages/BrandsPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/catalog-api.ts'), 'utf8');
  assert.match(page, /fetchAllCatalogBrands\(query, controller\.signal\)/);
  assert.match(page, /navigateTo\('brand-detail', \{ brandSlug: brand\.slug \}\)/);
  assert.match(page, /brand\.listing_count/);
  assert.match(api, /\/catalog\/brands\//);
  const home = readFileSync(join(root, 'src/components/home/HomePage.tsx'), 'utf8');
  assert.match(home, /fetchAllCatalogBrands\('', controller\.signal\)/);
  assert.match(home, /brandSlug: brand\.slug/);
  assert.doesNotMatch(home, /فهرست برندها هنوز به بانک اطلاعات خودرو متصل نشده است/);
});

test('brand detail loads catalog models and real active listings', () => {
  const page = readFileSync(join(root, 'src/components/pages/BrandDetailPage.tsx'), 'utf8');
  const navigation = readFileSync(join(root, 'src/stores/navigation.ts'), 'utf8');
  assert.match(page, /fetchCatalogBrand\(brandSlug/);
  assert.match(page, /fetchCatalogModels\(brandResult\.slug/);
  assert.match(page, /fetchVehicleListings\(\{ brand: title/);
  assert.match(page, /navigateTo\('buy', \{ brands: \[title\] \}\)/);
  assert.match(page, /brand\.banner_url/);
  assert.match(page, /brand\.logo_url/);
  assert.match(navigation, /brand-detail' && brandSlug/);
});

test('educational videos use the published content API and real player', () => {
  const listPage = readFileSync(join(root, 'src/components/pages/VideosPage.tsx'), 'utf8');
  const detailPage = readFileSync(join(root, 'src/components/pages/VideoDetailPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/video-api.ts'), 'utf8');
  const home = readFileSync(join(root, 'src/components/home/HomePage.tsx'), 'utf8');
  assert.match(listPage, /fetchEducationalVideos/);
  assert.match(listPage, /pageSize: VIDEOS_PER_PAGE/);
  assert.match(detailPage, /fetchEducationalVideo\(videoSlug/);
  assert.match(detailPage, /<video src=\{video\.video_url\}/);
  assert.match(home, /fetchEducationalVideos\(\{ page: 1, pageSize: 6/);
  assert.match(api, /\/content\/videos\//);
});

test('faq page and home section use the published content API', () => {
  const page = readFileSync(join(root, 'src/components/pages/FAQPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/faq-api.ts'), 'utf8');
  const home = readFileSync(join(root, 'src/components/home/HomePage.tsx'), 'utf8');
  assert.match(page, /fetchFrequentlyAskedQuestions/);
  assert.match(page, /pageSize: FAQS_PER_PAGE/);
  assert.match(page, /fetchFAQCategories/);
  assert.match(home, /fetchFrequentlyAskedQuestions\(\{ page: 1, pageSize: 6/);
  assert.match(api, /\/content\/faqs\//);
});

test('campaign listings offer access past the first page without a 100-item request', () => {
  const page = readFileSync(join(root, 'src/components/vehicle/ListingCampaignPage.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/listing-api.ts'), 'utf8');
  const header = readFileSync(join(root, 'src/components/layout/Header.tsx'), 'utf8');
  const router = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
  assert.match(page, /const CAMPAIGN_PAGE_SIZE = 24/);
  assert.match(page, /page: currentPage,/);
  assert.match(page, /setCurrentPage\(1\);/);
  assert.match(page, /currentPage >= totalPages/);
  assert.match(page, /campaign: kind/);
  assert.match(api, /addQueryValue\(params, 'campaign', query\.campaign\)/);
  assert.match(page, /if \(!normalized\) return undefined/);
  assert.match(header, /pageId: 'instant-sale'/);
  assert.match(header, /pageId: 'special-sale'/);
  assert.match(router, /'instant-sale': InstantSalePage/);
  assert.match(router, /'special-sale': SpecialSalePage/);
  assert.doesNotMatch(page, /pageSize: 100/);
});

test('comparison retry reissues the candidate request', () => {
  const page = readFileSync(join(root, 'src/components/pages/ComparisonPage.tsx'), 'utf8');
  assert.match(page, /\[candidateReloadVersion, pickerOpen, search\]/);
  assert.match(page, /setCandidateReloadVersion\(\(version\) => version \+ 1\)/);
});
