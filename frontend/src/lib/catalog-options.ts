import { apiRequest } from '@/lib/api';

export interface CatalogBrand {
  id: number;
  name: string;
  name_fa: string;
  slug: string;
  logo_url: string;
  listing_count: number;
}

export interface CatalogBodyType {
  id: number;
  name: string;
}

interface Page<T> {
  next: string | null;
  results: T[];
}

// Follow the catalog's pagination instead of silently dropping brands past page 1.
async function allPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const response = await apiRequest<Page<T>>(`${path}?page_size=100&page=${page}`);
    items.push(...response.results);
    if (!response.next) return items;
    page += 1;
  }
}

export async function fetchCatalogOptions() {
  const [brands, bodyTypes] = await Promise.all([
    allPages<CatalogBrand>('/catalog/brands/'),
    allPages<CatalogBodyType>('/catalog/body-types/'),
  ]);
  return { brands, bodyTypes };
}

export type CatalogOptions = Awaited<ReturnType<typeof fetchCatalogOptions>>;

export function brandLabel(brand: CatalogBrand): string {
  return brand.name_fa || brand.name;
}
