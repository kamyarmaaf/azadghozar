export type PageId =
  | 'home'
  | 'buy'
  | 'sell'
  | 'post-listing'
  | 'vehicle-details'
  | 'comparison'
  | 'instant-sale'
  | 'special-sale'
  | 'favorites'
  | 'brands'
  | 'brand-detail'
  | 'dealerships'
  | 'dealership-detail'
  | 'galleries'
  | 'gallery-detail'
  | 'services'
  | 'ownership-transfer'
  | 'transportation'
  | 'inspection'
  | 'consultation'
  | 'videos'
  | 'blog'
  | 'article-detail'
  | 'video-detail'
  | 'faq'
  | 'about'
  | 'contact'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'account-type'
  | 'buyer-dashboard'
  | 'seller-dashboard'
  | 'gallery-dashboard'
  | 'agency-dashboard'
  | 'expert-dashboard'
  | 'admin-dashboard'
  | 'tariffs'
  | 'org-panel'
  | 'smart-id'
  | 'terms'
  | 'privacy';

export interface RouteLocation {
  page: PageId;
  data: Record<string, unknown> | null;
}

export const allPageIds: PageId[] = [
  'home', 'buy', 'sell', 'post-listing', 'vehicle-details', 'comparison',
  'instant-sale', 'special-sale', 'favorites', 'brands', 'brand-detail',
  'dealerships', 'dealership-detail', 'galleries', 'gallery-detail', 'services',
  'ownership-transfer', 'transportation', 'inspection', 'consultation', 'videos',
  'blog', 'article-detail', 'video-detail', 'faq', 'about', 'contact', 'login',
  'register', 'forgot-password', 'account-type', 'buyer-dashboard',
  'seller-dashboard', 'gallery-dashboard', 'agency-dashboard', 'expert-dashboard',
  'admin-dashboard', 'tariffs', 'org-panel', 'smart-id', 'terms', 'privacy',
];

const staticPaths: Record<PageId, string> = {
  home: '/',
  buy: '/cars',
  sell: '/sell',
  'post-listing': '/sell',
  'vehicle-details': '/cars',
  comparison: '/compare',
  'instant-sale': '/instant-sale',
  'special-sale': '/special-sale',
  favorites: '/favorites',
  brands: '/brands',
  'brand-detail': '/brands',
  dealerships: '/agencies',
  'dealership-detail': '/agencies',
  galleries: '/galleries',
  'gallery-detail': '/galleries',
  services: '/services',
  'ownership-transfer': '/services/ownership-transfer',
  transportation: '/services/transportation',
  inspection: '/services/inspection',
  consultation: '/services/consultation',
  videos: '/videos',
  blog: '/magazine',
  'article-detail': '/magazine',
  'video-detail': '/videos',
  faq: '/faq',
  about: '/about',
  contact: '/contact',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  'account-type': '/account-type',
  'buyer-dashboard': '/dashboard/buyer',
  'seller-dashboard': '/dashboard/seller',
  'gallery-dashboard': '/dashboard/gallery',
  'agency-dashboard': '/dashboard/agency',
  'expert-dashboard': '/dashboard/expert',
  'admin-dashboard': '/dashboard/admin',
  tariffs: '/pricing',
  'org-panel': '/organization',
  'smart-id': '/smart-id',
  terms: '/terms',
  privacy: '/privacy',
};

const dynamicOnlyPages = new Set<PageId>([
  'post-listing',
  'vehicle-details',
  'brand-detail',
  'dealership-detail',
  'gallery-detail',
  'article-detail',
  'video-detail',
]);

const pathPages = new Map<string, PageId>([
  ...Object.entries(staticPaths)
    .filter(([page]) => !dynamicOnlyPages.has(page as PageId))
    .map(([page, path]) => [path, page as PageId] as const),
  ['/buy', 'buy'] as const,
  ['/blog', 'blog'] as const,
  ['/dealerships', 'dealerships'] as const,
]);

const registrationTypes = new Set(['buyer', 'seller', 'gallery', 'agency']);

function cleanPathname(pathname: string): string {
  const decoded = pathname || '/';
  if (decoded === '/') return '/';
  return `/${decoded.split('/').filter(Boolean).join('/')}`;
}

function decodedSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function addValue(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  params.append(key, String(value));
}

function buildBuyQuery(data: Record<string, unknown>, params: URLSearchParams): void {
  addValue(params, 'q', data.search);
  const brands = Array.isArray(data.brands) ? data.brands : [];
  const bodyTypes = Array.isArray(data.bodyTypes)
    ? data.bodyTypes
    : data.bodyType ? [data.bodyType] : [];
  brands.forEach((value) => addValue(params, 'brand', value));
  bodyTypes.forEach((value) => addValue(params, 'body', value));
  addValue(params, 'city', data.city);
  addValue(params, 'price', data.priceRange);
  addValue(params, 'year', data.yearRange);
  addValue(params, 'mileage', data.mileageRange);
  addValue(params, 'min_price', data.minPrice);
  addValue(params, 'max_price', data.maxPrice);
}

export function buildPageUrl(page: PageId, data: Record<string, unknown> = {}): string {
  let pathname = staticPaths[page];
  const segment = (value: unknown) => encodeURIComponent(String(value));

  if (page === 'vehicle-details' && data.vehicleId) pathname = `/cars/${segment(data.vehicleId)}`;
  if (page === 'sell' && data.vehicleId) pathname = `/cars/${segment(data.vehicleId)}/edit`;
  if (page === 'brand-detail' && data.brandSlug) pathname = `/brands/${segment(data.brandSlug)}`;
  if (page === 'dealership-detail' && data.businessSlug) pathname = `/agencies/${segment(data.businessSlug)}`;
  if (page === 'gallery-detail' && data.businessSlug) pathname = `/galleries/${segment(data.businessSlug)}`;
  if (page === 'video-detail' && data.videoId) pathname = `/videos/${segment(data.videoId)}`;
  if (page === 'article-detail' && data.articleId) pathname = `/magazine/${segment(data.articleId)}`;

  const params = new URLSearchParams();
  if (page === 'buy') buildBuyQuery(data, params);
  if (page === 'register') {
    if (registrationTypes.has(String(data.registrationType))) addValue(params, 'type', data.registrationType);
    addValue(params, 'ref', data.referralCode);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buyData(params: URLSearchParams): Record<string, unknown> | null {
  const data: Record<string, unknown> = {};
  const assign = (key: string, value: string | null) => {
    if (value) data[key] = value;
  };
  assign('search', params.get('q'));
  assign('city', params.get('city'));
  assign('priceRange', params.get('price'));
  assign('yearRange', params.get('year'));
  assign('mileageRange', params.get('mileage'));
  const brands = params.getAll('brand').filter(Boolean);
  const bodyTypes = params.getAll('body').filter(Boolean);
  if (brands.length) data.brands = brands;
  if (bodyTypes.length) data.bodyTypes = bodyTypes;
  const minPrice = Number(params.get('min_price'));
  const maxPrice = Number(params.get('max_price'));
  if (params.has('min_price') && Number.isSafeInteger(minPrice) && minPrice >= 0) data.minPrice = minPrice;
  if (params.has('max_price') && Number.isSafeInteger(maxPrice) && maxPrice >= 0) data.maxPrice = maxPrice;
  return Object.keys(data).length ? data : null;
}

export function parsePageLocation(pathname: string, search = ''): RouteLocation {
  const path = cleanPathname(pathname);
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const dynamicRoutes: Array<[RegExp, PageId, string]> = [
    [/^\/cars\/([^/]+)\/edit$/, 'sell', 'vehicleId'],
    [/^\/cars\/([^/]+)$/, 'vehicle-details', 'vehicleId'],
    [/^\/brands\/([^/]+)$/, 'brand-detail', 'brandSlug'],
    [/^\/(?:agencies|dealerships)\/([^/]+)$/, 'dealership-detail', 'businessSlug'],
    [/^\/galleries\/([^/]+)$/, 'gallery-detail', 'businessSlug'],
    [/^\/videos\/([^/]+)$/, 'video-detail', 'videoId'],
    [/^\/(?:magazine|blog)\/([^/]+)$/, 'article-detail', 'articleId'],
  ];
  for (const [pattern, page, key] of dynamicRoutes) {
    const match = path.match(pattern);
    if (match) return { page, data: { [key]: decodedSegment(match[1]) } };
  }

  const page = pathPages.get(path) || 'home';
  if (page === 'buy') return { page, data: buyData(params) };
  if (page === 'register') {
    const type = params.get('type');
    const ref = params.get('ref');
    const data = {
      ...(type && registrationTypes.has(type) ? { registrationType: type } : {}),
      ...(ref ? { referralCode: ref } : {}),
    };
    return { page, data: Object.keys(data).length ? data : null };
  }
  return { page, data: null };
}

export function parseLegacyHash(hash: string): RouteLocation | null {
  const raw = hash.replace(/^#/, '');
  const [pageValue, query = ''] = raw.split('?');
  if (!allPageIds.includes(pageValue as PageId)) return null;
  const page = pageValue as PageId;
  const params = new URLSearchParams(query);
  const listingId = params.get('id');
  const businessSlug = params.get('slug');
  const brandSlug = params.get('brand');
  const videoSlug = params.get('video');
  const articleSlug = params.get('article');
  if (listingId && ['vehicle-details', 'sell'].includes(page)) return { page, data: { vehicleId: listingId } };
  if (businessSlug && ['gallery-detail', 'dealership-detail'].includes(page)) return { page, data: { businessSlug } };
  if (brandSlug && page === 'brand-detail') return { page, data: { brandSlug } };
  if (videoSlug && page === 'video-detail') return { page, data: { videoId: videoSlug } };
  if (articleSlug && page === 'article-detail') return { page, data: { articleId: articleSlug } };
  if (page === 'register') {
    const type = params.get('type');
    const ref = params.get('ref');
    const data = {
      ...(type && registrationTypes.has(type) ? { registrationType: type } : {}),
      ...(ref ? { referralCode: ref } : {}),
    };
    return { page, data: Object.keys(data).length ? data : null };
  }
  return { page, data: null };
}
