import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('vehicle detail renders the connected visit request form', async () => {
  const source = await read('src/components/pages/VehicleDetailsPage.tsx');
  assert.match(source, /<VisitRequestSection/);
  assert.match(source, /listingId=\{vehicle\.id\}/);
});

test('visit request form checks availability and submits to the backend', async () => {
  const source = await read('src/components/vehicle/VisitRequestSection.tsx');
  assert.match(source, /fetchVisitAvailability\(listingId, gregorianDate\)/);
  assert.match(source, /createListingVisitRequest\(/);
  assert.match(source, /unavailableHours\.includes\(slot\.hour\)/);
});

test('buyer and listing managers can access their visit request panels', async () => {
  const [buyer, seller, gallery] = await Promise.all([
    read('src/components/pages/BuyerDashboardPage.tsx'),
    read('src/components/pages/SellerDashboardPage.tsx'),
    read('src/components/pages/GalleryDashboardPage.tsx'),
  ]);
  assert.match(buyer, /<VisitRequestsPanel mode="mine"/);
  assert.match(seller, /<VisitRequestsPanel mode="managed"/);
  assert.match(gallery, /<VisitRequestsPanel mode="managed"/);
});

test('visit API client uses the dedicated visit endpoints', async () => {
  const source = await read('src/lib/visit-request-api.ts');
  assert.match(source, /service-requests\/visits\/availability/);
  assert.match(source, /service-requests\/visits\/mine/);
  assert.match(source, /service-requests\/visits\/managed/);
});
