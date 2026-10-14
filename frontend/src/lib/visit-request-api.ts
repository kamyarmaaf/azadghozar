import { API_BASE_URL, apiRequest, getAccessToken } from '@/lib/api';
import type { CursorPage } from '@/lib/business-api';

export type VisitRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface ListingVisitRequest {
  id: string;
  listing_id: number;
  listing_title: string;
  listing_city: string;
  contact_name: string;
  contact_phone: string;
  scheduled_for: string;
  requester_note: string;
  owner_note: string;
  status: VisitRequestStatus;
  status_label: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

function apiPathFromPageUrl(url: string): string {
  const parsed = new URL(url, API_BASE_URL);
  const apiPrefix = new URL(API_BASE_URL).pathname.replace(/\/$/, '');
  const pathname = parsed.pathname.startsWith(apiPrefix)
    ? parsed.pathname.slice(apiPrefix.length)
    : parsed.pathname;
  return `${pathname}${parsed.search}`;
}

export function fetchVisitAvailability(listingId: number, date: string) {
  const params = new URLSearchParams({ listing: String(listingId), date });
  return apiRequest<{ date: string; unavailable_hours: number[] }>(
    `/service-requests/visits/availability/?${params.toString()}`,
  );
}

export function createListingVisitRequest(input: {
  listingId: number;
  contactName: string;
  contactPhone: string;
  scheduledFor: string;
  note?: string;
}) {
  return apiRequest<ListingVisitRequest>('/service-requests/visits/', {
    method: 'POST',
    authenticated: Boolean(getAccessToken()),
    body: JSON.stringify({
      listing: input.listingId,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      scheduled_for: input.scheduledFor,
      requester_note: input.note || '',
    }),
  });
}

export function fetchMyListingVisitRequests(nextUrl?: string | null) {
  return apiRequest<CursorPage<ListingVisitRequest>>(
    nextUrl ? apiPathFromPageUrl(nextUrl) : '/service-requests/visits/mine/?page_size=20',
    { authenticated: true },
  );
}

export function cancelMyListingVisitRequest(id: string) {
  return apiRequest<ListingVisitRequest>(
    `/service-requests/visits/mine/${encodeURIComponent(id)}/cancel/`,
    { method: 'POST', authenticated: true },
  );
}

export function fetchManagedListingVisitRequests(nextUrl?: string | null) {
  return apiRequest<CursorPage<ListingVisitRequest>>(
    nextUrl ? apiPathFromPageUrl(nextUrl) : '/service-requests/visits/managed/?page_size=20',
    { authenticated: true },
  );
}

export function updateManagedListingVisitRequest(
  id: string,
  status: Exclude<VisitRequestStatus, 'pending'>,
  ownerNote = '',
) {
  return apiRequest<ListingVisitRequest>(
    `/service-requests/visits/managed/${encodeURIComponent(id)}/`,
    {
      method: 'PATCH',
      authenticated: true,
      body: JSON.stringify({ status, owner_note: ownerNote }),
    },
  );
}
