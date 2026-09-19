import { apiRequest } from '@/lib/api';

export interface CatalogBrand {
  id: number;
  name: string;
  name_fa: string;
  slug: string;
  logo_url: string;
  banner_url: string;
  country: string;
  listing_count: number;
}

export interface CatalogVehicleModel {
  id: number;
  brand: number;
  brand_slug: string;
  brand_name: string;
  name: string;
  name_fa: string;
  slug: string;
  body_type: string;
}

interface CatalogBrandPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: CatalogBrand[];
}

export async function fetchCatalogBrands(query = '', signal?: AbortSignal): Promise<CatalogBrandPage> {
  const params = new URLSearchParams({ page_size: '100' });
  if (query.trim()) params.set('q', query.trim());
  return apiRequest<CatalogBrandPage>(`/catalog/brands/?${params.toString()}`, { signal });
}

export async function fetchAllCatalogBrands(query = '', signal?: AbortSignal): Promise<CatalogBrand[]> {
  const results: CatalogBrand[] = [];
  for (let pageNumber = 1; pageNumber <= 10; pageNumber += 1) {
    const params = new URLSearchParams({ page_size: '100', page: String(pageNumber) });
    if (query.trim()) params.set('q', query.trim());
    const page = await apiRequest<CatalogBrandPage>(`/catalog/brands/?${params.toString()}`, { signal });
    results.push(...page.results);
    if (!page.next || results.length >= page.count) break;
  }
  return results;
}

export async function fetchCatalogBrand(slug: string, signal?: AbortSignal): Promise<CatalogBrand> {
  return apiRequest<CatalogBrand>(`/catalog/brands/${encodeURIComponent(slug)}/`, { signal });
}

export async function fetchCatalogModels(brandSlug: string, signal?: AbortSignal): Promise<CatalogVehicleModel[]> {
  const params = new URLSearchParams({ brand: brandSlug, page_size: '100' });
  const page = await apiRequest<{
    count: number;
    next: string | null;
    previous: string | null;
    results: CatalogVehicleModel[];
  }>(`/catalog/models/?${params.toString()}`, { signal });
  return page.results;
}
