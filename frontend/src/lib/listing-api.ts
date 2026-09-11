import { API_BASE_URL, apiRequest, resolveMediaUrl } from '@/lib/api';
import type { CompressedListingImage } from '@/lib/image-compression';
import { cursorFromUrl } from '@/lib/comparison-selection.mjs';

const transmissionMap: Record<string, string> = {
  'اتوماتیک': 'automatic',
  'دستی': 'manual',
  'سی‌وی‌تی': 'cvt',
  'دوکلاچه': 'dct',
};

const fuelMap: Record<string, string> = {
  'بنزینی': 'gasoline',
  'دیزلی': 'diesel',
  'هیبریدی': 'hybrid',
  'برقی': 'electric',
  'هیبریدی پلاگین': 'phev',
};

const drivetrainMap: Record<string, string> = {
  'جلو': 'fwd',
  'عقب': 'rwd',
  'دو دیفرانسیل': '4wd',
  'چهار چرخ متحرک': 'awd',
};

const conditionMap: Record<string, string> = {
  'آکبند': 'new',
  'در حد نو': 'like_new',
  'کارکرده تمیز': 'clean_used',
  'سالم': 'good',
  'نیاز به تعمیر': 'needs_repair',
};

const bodyConditionMap: Record<string, string> = {
  'بدون رنگ': 'no_paint',
  'یک لکه رنگ': 'one_spot',
  'چند لکه رنگ': 'multiple_spots',
  'دور رنگ': 'around_paint',
  'تمام رنگ': 'full_paint',
  'تصادفی': 'accident',
};

const chassisConditionMap: Record<string, string> = {
  'سالم و پلمپ': 'sealed',
  'ضربه جزئی': 'minor_damage',
  'آسیب‌دیده': 'damaged',
};

const engineConditionMap: Record<string, string> = {
  'سالم': 'healthy',
  'نیاز به سرویس': 'needs_service',
  'تعویض شده': 'replaced',
  'نیاز به تعمیر': 'needs_repair',
};

const ownershipMap: Record<string, string> = {
  'سند به نام فروشنده': 'owner',
  'سند آماده انتقال': 'ready',
  'وکالتی': 'power_of_attorney',
  'در رهن یا لیزینگ': 'financed',
};

const plateTypeMap: Record<string, string> = {
  'free-zone': 'free_zone',
  'temporary-import': 'temporary_import',
  'national': 'national',
};

const toAsciiDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const numericValue = (value: string) => toAsciiDigits(value).replace(/\D/g, '');

export interface CreateListingInput {
  brand: string;
  model: string;
  trim: string;
  year: string;
  plateType: string;
  freeZone: string;
  province: string;
  city: string;
  color: string;
  bodyType: string;
  engine: string;
  transmission: string;
  fuelType: string;
  drivetrain: string;
  mileage: string;
  condition: string;
  bodyCondition: string;
  chassisCondition: string;
  engineCondition: string;
  insuranceMonths: string;
  ownershipStatus: string;
  description: string;
  priceType: string;
  price: string;
  tradePossible: string;
  contactNumber: string;
  contactPreference: string;
  images: CompressedListingImage[];
  video: File | null;
}

export interface UpdateListingInput extends CreateListingInput {
  retainedImageIds: number[];
  removeVideo: boolean;
}

export interface CreatedListing {
  id: number;
  status: 'pending';
  status_label: string;
}

export type ListingStatus = 'pending' | 'active' | 'rejected' | 'sold' | 'expired';

export interface ListingImage {
  id: number;
  file: string;
  sort_order: number;
  file_size: number;
  mime_type: string;
}

export interface VehicleListing {
  id: number;
  owner: number;
  owner_name: string;
  owner_role: string;
  owner_role_label: string;
  owner_business_logo: string | null;
  business_slug: string | null;
  business_name: string | null;
  business_kind: 'gallery' | 'agency' | null;
  status: ListingStatus;
  status_label: string;
  brand_name: string;
  model_name: string;
  trim_name: string;
  production_year: number;
  plate_type: string;
  plate_type_label: string;
  free_zone: string;
  province: string;
  city: string;
  color: string;
  body_type: string;
  engine_description: string;
  transmission: string;
  transmission_label: string;
  fuel_type: string;
  fuel_type_label: string;
  drivetrain: string;
  drivetrain_label: string;
  mileage: number;
  condition: string;
  condition_label: string;
  body_condition: string;
  body_condition_label: string;
  chassis_condition: string;
  chassis_condition_label: string;
  engine_condition: string;
  engine_condition_label: string;
  insurance_months: number | null;
  ownership_status: string;
  ownership_status_label: string;
  description: string;
  price_type: string;
  price_type_label: string;
  price: number | null;
  trade_possible: boolean;
  is_instant_sale: boolean;
  is_special_sale: boolean;
  is_inspected: boolean;
  view_count: number;
  contact_number: string;
  contact_preference: string;
  contact_preference_label: string;
  video: string | null;
  image_files: ListingImage[];
  rejection_reason: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedListings {
  count: number;
  next: string | null;
  previous: string | null;
  results: VehicleListing[];
}

export interface ListingFavorite {
  id: number;
  listing: VehicleListing;
  created_at: string;
}

export interface PaginatedFavorites {
  count: number;
  next: string | null;
  previous: string | null;
  results: ListingFavorite[];
}

export interface PublicListingSummary {
  id: number;
  brand_name: string;
  model_name: string;
  trim_name: string;
  production_year: number;
  plate_type: string;
  plate_type_label: string;
  city: string;
  transmission: string;
  transmission_label: string;
  mileage: number;
  price_type: string;
  price: number | null;
  is_instant_sale: boolean;
  is_special_sale: boolean;
  is_inspected: boolean;
  cover_image: string | null;
}

export interface PaginatedListingSummaries {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicListingSummary[];
}

export interface ComparisonCandidate {
  id: number;
  brand_name: string;
  model_name: string;
  trim_name: string;
  production_year: number;
  city: string;
  mileage: number;
  price_type: string;
  price_type_label: string;
  price: number | null;
  cover_image: string | null;
}

export interface ComparisonListing {
  id: number;
  brand_name: string;
  model_name: string;
  trim_name: string;
  production_year: number;
  plate_type: string;
  plate_type_label: string;
  city: string;
  color: string;
  body_type: string;
  engine_description: string;
  transmission: string;
  transmission_label: string;
  fuel_type: string;
  fuel_type_label: string;
  drivetrain: string;
  drivetrain_label: string;
  mileage: number;
  condition: string;
  condition_label: string;
  body_condition: string;
  body_condition_label: string;
  chassis_condition: string;
  chassis_condition_label: string;
  engine_condition: string;
  engine_condition_label: string;
  insurance_months: number | null;
  price_type: string;
  price_type_label: string;
  price: number | null;
  is_inspected: boolean;
  cover_image: string | null;
}

export interface CursorPage<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListingQuery {
  page?: number;
  pageSize?: number;
  mine?: boolean;
  authenticated?: boolean;
  status?: ListingStatus;
  q?: string;
  plateType?: string;
  brand?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  bodyType?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  condition?: string;
  sellerType?: string;
  business?: string;
  instantSale?: boolean;
  specialSale?: boolean;
  inspected?: boolean;
  ordering?: 'newest' | 'cheapest' | 'priciest' | 'lowest-mileage';
  summary?: boolean;
}

function addQueryValue(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
) {
  if (value === undefined || value === '') return;
  params.set(key, String(value));
}

export function fetchVehicleListings(
  query: ListingQuery & { summary: true },
): Promise<PaginatedListingSummaries>;
export function fetchVehicleListings(
  query?: ListingQuery,
): Promise<PaginatedListings>;
export async function fetchVehicleListings(
  query: ListingQuery = {},
): Promise<PaginatedListings | PaginatedListingSummaries> {
  const params = new URLSearchParams();
  addQueryValue(params, 'page', query.page);
  addQueryValue(params, 'page_size', query.pageSize);
  addQueryValue(params, 'mine', query.mine);
  addQueryValue(params, 'status', query.status);
  addQueryValue(params, 'q', query.q);
  addQueryValue(params, 'plate_type', query.plateType);
  addQueryValue(params, 'brand', query.brand);
  addQueryValue(params, 'model', query.model);
  addQueryValue(params, 'year_min', query.yearMin);
  addQueryValue(params, 'year_max', query.yearMax);
  addQueryValue(params, 'price_min', query.priceMin);
  addQueryValue(params, 'price_max', query.priceMax);
  addQueryValue(params, 'mileage_min', query.mileageMin);
  addQueryValue(params, 'mileage_max', query.mileageMax);
  addQueryValue(params, 'body_type', query.bodyType);
  addQueryValue(params, 'color', query.color);
  addQueryValue(params, 'transmission', query.transmission);
  addQueryValue(params, 'fuel_type', query.fuelType);
  addQueryValue(params, 'condition', query.condition);
  addQueryValue(params, 'seller_type', query.sellerType);
  addQueryValue(params, 'business', query.business);
  if (query.instantSale) addQueryValue(params, 'is_instant_sale', 'True');
  if (query.specialSale) addQueryValue(params, 'is_special_sale', 'True');
  if (query.inspected) addQueryValue(params, 'is_inspected', 'True');
  addQueryValue(params, 'ordering', query.ordering);
  if (query.summary) addQueryValue(params, 'summary', 'true');

  const suffix = params.size ? `?${params.toString()}` : '';
  return apiRequest<PaginatedListings | PaginatedListingSummaries>(`/catalog/listings/${suffix}`, {
    authenticated: query.authenticated ?? query.mine ?? false,
  });
}

export async function fetchVehicleListing(id: number): Promise<VehicleListing> {
  return apiRequest<VehicleListing>(`/catalog/listings/${id}/`, {
    authenticated: true,
  });
}

export async function fetchComparisonCandidates(input: {
  query?: string;
  cursor?: string | null;
  pageSize?: number;
  signal?: AbortSignal;
} = {}): Promise<CursorPage<ComparisonCandidate>> {
  const params = new URLSearchParams();
  const query = input.query?.trim();
  if (query) params.set('q', query);
  if (input.cursor) params.set('cursor', input.cursor);
  params.set('page_size', String(Math.min(Math.max(input.pageSize ?? 16, 1), 24)));
  return apiRequest<CursorPage<ComparisonCandidate>>(
    `/catalog/listings/comparison-candidates/?${params.toString()}`,
    { signal: input.signal },
  );
}

export async function fetchComparisonListings(
  listingIds: number[],
  signal?: AbortSignal,
): Promise<ComparisonListing[]> {
  const ids = [...new Set(listingIds)].slice(0, 4);
  if (ids.length === 0) return [];
  const params = new URLSearchParams({ ids: ids.join(',') });
  return apiRequest<ComparisonListing[]>(
    `/catalog/listings/comparison/?${params.toString()}`,
    { signal },
  );
}

export function cursorFromPageUrl(url: string | null): string | null {
  return cursorFromUrl(url, API_BASE_URL);
}

export function comparisonImageUrl(
  listing: ComparisonCandidate | ComparisonListing,
): string {
  return listing.cover_image || '/images/car-1.jpg';
}

export async function fetchListingFavorites(): Promise<PaginatedFavorites> {
  return apiRequest<PaginatedFavorites>('/catalog/favorites/?page_size=100', {
    authenticated: true,
  });
}

export async function addListingFavorite(
  listingId: number,
): Promise<ListingFavorite> {
  return apiRequest<ListingFavorite>('/catalog/favorites/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ listing_id: listingId }),
  });
}

export async function removeListingFavorite(listingId: number): Promise<void> {
  await apiRequest<void>(`/catalog/favorites/${listingId}/`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export async function deleteVehicleListing(id: number): Promise<void> {
  await apiRequest<void>(`/catalog/listings/${id}/`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export async function approveVehicleListing(id: number): Promise<VehicleListing> {
  return apiRequest<VehicleListing>(`/catalog/listings/${id}/approve/`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({}),
  });
}

export async function rejectVehicleListing(
  id: number,
  reason: string,
): Promise<VehicleListing> {
  return apiRequest<VehicleListing>(`/catalog/listings/${id}/reject/`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ reason }),
  });
}

export function listingImageUrl(
  listing: VehicleListing | PublicListingSummary,
  index = 0,
): string {
  if ('cover_image' in listing) {
    return listing.cover_image || '/images/car-1.jpg';
  }
  return resolveMediaUrl(listing.image_files[index]?.file) || '/images/car-1.jpg';
}

export function listingImageFileUrl(image: ListingImage): string {
  return resolveMediaUrl(image.file) || '/images/car-1.jpg';
}

function buildListingFormData(input: CreateListingInput): FormData {
  const body = new FormData();
  const fields: Record<string, string> = {
    brand_name: input.brand,
    model_name: input.model,
    trim_name: input.trim,
    production_year: numericValue(input.year),
    plate_type: plateTypeMap[input.plateType],
    free_zone: input.freeZone,
    province: input.province,
    city: input.city,
    color: input.color,
    body_type: input.bodyType,
    engine_description: input.engine,
    transmission: transmissionMap[input.transmission],
    fuel_type: fuelMap[input.fuelType],
    drivetrain: drivetrainMap[input.drivetrain],
    mileage: numericValue(input.mileage),
    condition: conditionMap[input.condition],
    body_condition: bodyConditionMap[input.bodyCondition],
    chassis_condition: chassisConditionMap[input.chassisCondition],
    engine_condition: engineConditionMap[input.engineCondition],
    insurance_months: input.insuranceMonths,
    ownership_status: ownershipMap[input.ownershipStatus],
    description: input.description,
    price_type: input.priceType,
    price: numericValue(input.price),
    trade_possible: input.tradePossible === 'yes' ? 'true' : 'false',
    contact_number: input.contactNumber,
    contact_preference: input.contactPreference,
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== '') body.append(key, value);
  });
  input.images.forEach((image) => {
    body.append('images', image.file, image.file.name);
  });
  if (input.video) body.append('video', input.video, input.video.name);
  return body;
}

export async function createVehicleListing(
  input: CreateListingInput,
): Promise<CreatedListing> {
  return apiRequest<CreatedListing>('/catalog/listings/', {
    method: 'POST',
    authenticated: true,
    body: buildListingFormData(input),
  });
}

export async function updateVehicleListing(
  id: number,
  input: UpdateListingInput,
): Promise<VehicleListing> {
  const body = buildListingFormData(input);
  input.retainedImageIds.forEach((imageId) => {
    body.append('retained_image_ids', String(imageId));
  });
  if (input.removeVideo) body.append('remove_video', 'true');

  return apiRequest<VehicleListing>(`/catalog/listings/${id}/`, {
    method: 'PATCH',
    authenticated: true,
    body,
  });
}
