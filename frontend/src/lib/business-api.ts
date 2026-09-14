import { API_BASE_URL, apiRequest, resolveMediaUrl } from '@/lib/api';
import type { PublicListingSummary } from '@/lib/listing-api';

export type BusinessKind = 'gallery' | 'agency';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface CursorPage<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BusinessProfile {
  id: number;
  kind: BusinessKind;
  name: string;
  slug: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  description: string;
  established_year: number | null;
  working_hours: string;
  website: string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  logo: string | null;
  cover: string | null;
  listing_count: number;
  total_views: number;
  brands: string[];
  license_number?: string;
  national_id?: string;
  verification_note?: string;
}

export interface BusinessMember {
  id: number;
  user: number;
  user_name: string;
  phone_number: string;
  role: 'manager' | 'listing_manager' | 'sales';
  status: 'active' | 'disabled';
  can_manage_listings: boolean;
  can_manage_members: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSubscription {
  id: number;
  business: number;
  business_name: string;
  plan: 'agency_monthly' | 'agency_yearly';
  plan_label: string;
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';
  status_label: string;
  starts_at: string | null;
  ends_at: string | null;
  admin_note: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface BusinessDashboard {
  business: BusinessProfile;
  stats: {
    listing_count: number;
    active_listing_count: number;
    pending_listing_count: number;
    sold_listing_count: number;
    total_views: number;
    member_count: number;
  };
  subscription: BusinessSubscription | null;
}

function normalizeBusiness(profile: BusinessProfile): BusinessProfile {
  return {
    ...profile,
    logo: profile.logo ? resolveMediaUrl(profile.logo) : null,
    cover: profile.cover ? resolveMediaUrl(profile.cover) : null,
  };
}

function apiPathFromPageUrl(url: string): string {
  const parsed = new URL(url, API_BASE_URL);
  const apiPrefix = new URL(API_BASE_URL).pathname.replace(/\/$/, '');
  const pathname = parsed.pathname.startsWith(apiPrefix)
    ? parsed.pathname.slice(apiPrefix.length)
    : parsed.pathname;
  return `${pathname}${parsed.search}`;
}

export async function fetchBusinesses(input: {
  kind?: BusinessKind;
  query?: string;
  city?: string;
  pageSize?: number;
  nextUrl?: string | null;
  signal?: AbortSignal;
} = {}): Promise<CursorPage<BusinessProfile>> {
  const path = input.nextUrl
    ? apiPathFromPageUrl(input.nextUrl)
    : (() => {
        const params = new URLSearchParams();
        if (input.kind) params.set('kind', input.kind);
        if (input.query?.trim()) params.set('q', input.query.trim());
        if (input.city?.trim()) params.set('city', input.city.trim());
        params.set('page_size', String(Math.min(input.pageSize ?? 12, 24)));
        return `/businesses/?${params.toString()}`;
      })();
  const response = await apiRequest<CursorPage<BusinessProfile>>(path, {
    signal: input.signal,
  });
  return { ...response, results: response.results.map(normalizeBusiness) };
}

export async function fetchBusiness(slug: string): Promise<BusinessProfile> {
  const response = await apiRequest<BusinessProfile>(
    `/businesses/${encodeURIComponent(slug)}/`,
  );
  return normalizeBusiness(response);
}

export async function fetchBusinessListings(
  slug: string,
  nextUrl?: string | null,
): Promise<CursorPage<PublicListingSummary>> {
  const path = nextUrl
    ? apiPathFromPageUrl(nextUrl)
    : `/businesses/${encodeURIComponent(slug)}/listings/?page_size=20`;
  return apiRequest<CursorPage<PublicListingSummary>>(path);
}

export async function fetchBusinessDashboard(): Promise<BusinessDashboard> {
  const response = await apiRequest<BusinessDashboard>(
    '/businesses/me/dashboard/',
    { authenticated: true },
  );
  return { ...response, business: normalizeBusiness(response.business) };
}

export function fetchBusinessMembers(
  nextUrl?: string | null,
): Promise<CursorPage<BusinessMember>> {
  return apiRequest<CursorPage<BusinessMember>>(
    nextUrl ? apiPathFromPageUrl(nextUrl) : '/businesses/me/members/',
    { authenticated: true },
  );
}

export function addBusinessMember(input: {
  phoneNumber: string;
  role: BusinessMember['role'];
  canManageListings: boolean;
  canManageMembers: boolean;
}): Promise<BusinessMember> {
  return apiRequest<BusinessMember>('/businesses/me/members/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({
      phone_number: input.phoneNumber,
      role: input.role,
      can_manage_listings: input.canManageListings,
      can_manage_members: input.canManageMembers,
    }),
  });
}

export function removeBusinessMember(id: number): Promise<void> {
  return apiRequest<void>(`/businesses/me/members/${id}/`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export function requestAgencySubscription(
  plan: BusinessSubscription['plan'],
): Promise<BusinessSubscription> {
  return apiRequest<BusinessSubscription>('/businesses/me/subscriptions/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ plan }),
  });
}

export function fetchAdminBusinesses(input: {
  kind?: BusinessKind;
  status?: VerificationStatus;
  nextUrl?: string;
} = {}): Promise<CursorPage<BusinessProfile>> {
  const params = new URLSearchParams();
  if (input.kind) params.set('kind', input.kind);
  if (input.status) params.set('status', input.status);
  const path = input.nextUrl
    ? adminBusinessPagePath(input.nextUrl, '/businesses/admin/profiles/')
    : `/businesses/admin/profiles/?${params.toString()}`;
  return apiRequest<CursorPage<BusinessProfile>>(
    path,
    { authenticated: true },
  );
}

function adminBusinessPagePath(nextUrl: string, path: string): string {
  const base = new URL(API_BASE_URL);
  const cursor = new URL(nextUrl, base);
  if (cursor.origin !== base.origin || cursor.pathname !== `${base.pathname.replace(/\/$/, '')}${path}`) {
    throw new Error('نشانی صفحه بعدی مدیریت معتبر نیست.');
  }
  return `${path}${cursor.search}`;
}

export function reviewBusiness(
  id: number,
  action: 'verify' | 'reject' | 'suspend',
  note = '',
): Promise<BusinessProfile> {
  return apiRequest<BusinessProfile>(`/businesses/admin/profiles/${id}/review/`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ action, note }),
  });
}

export function fetchAdminSubscriptions(
  status = 'pending',
  nextUrl?: string,
): Promise<CursorPage<BusinessSubscription>> {
  const path = nextUrl
    ? adminBusinessPagePath(nextUrl, '/businesses/admin/subscriptions/')
    : `/businesses/admin/subscriptions/?status=${encodeURIComponent(status)}`;
  return apiRequest<CursorPage<BusinessSubscription>>(
    path,
    { authenticated: true },
  );
}

export function reviewSubscription(
  id: number,
  action: 'approve' | 'reject' | 'cancel',
  note = '',
): Promise<BusinessSubscription> {
  return apiRequest<BusinessSubscription>(
    `/businesses/admin/subscriptions/${id}/review/`,
    {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify({ action, note }),
    },
  );
}
