import { API_BASE_URL, apiRequest, getAccessToken } from '@/lib/api';
import type { CursorPage } from '@/lib/business-api';

export type ServiceRequestType =
  | 'transfer'
  | 'transport'
  | 'inspection'
  | 'consultation'
  | 'document_check'
  | 'status_check'
  | 'buy_assist'
  | 'sell_assist';

export type ServiceRequestStatus =
  | 'new'
  | 'reviewing'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ServiceRequestPriority = 'normal' | 'high' | 'urgent';

export interface ServiceRequestRecord {
  id: string;
  service_type: ServiceRequestType;
  service_type_label: string;
  contact_name: string;
  contact_phone: string;
  vehicle_type: string;
  details: string;
  listing: number | null;
  listing_title: string;
  requester_name: string;
  assigned_expert: number | null;
  assigned_expert_name: string;
  status: ServiceRequestStatus;
  status_label: string;
  priority: ServiceRequestPriority;
  priority_label: string;
  scheduled_for: string | null;
  admin_note: string;
  expert_note: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpertOption {
  id: number;
  name: string;
  phone_number: string | null;
}

const serviceTypeMap: Record<string, ServiceRequestType> = {
  transfer: 'transfer',
  transport: 'transport',
  inspection: 'inspection',
  consultation: 'consultation',
  'document-check': 'document_check',
  'status-check': 'status_check',
  'buy-assist': 'buy_assist',
  'sell-assist': 'sell_assist',
};

export function serviceTypeFromPageId(value: string): ServiceRequestType {
  return serviceTypeMap[value] ?? 'consultation';
}

function apiPathFromPageUrl(url: string): string {
  const parsed = new URL(url, API_BASE_URL);
  const apiPrefix = new URL(API_BASE_URL).pathname.replace(/\/$/, '');
  const pathname = parsed.pathname.startsWith(apiPrefix)
    ? parsed.pathname.slice(apiPrefix.length)
    : parsed.pathname;
  return `${pathname}${parsed.search}`;
}

export function createServiceRequest(input: {
  serviceType: ServiceRequestType;
  contactName: string;
  contactPhone: string;
  vehicleType: string;
  details?: string;
  listing?: number;
}): Promise<ServiceRequestRecord> {
  return apiRequest<ServiceRequestRecord>('/service-requests/', {
    method: 'POST',
    authenticated: Boolean(getAccessToken()),
    body: JSON.stringify({
      service_type: input.serviceType,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      vehicle_type: input.vehicleType,
      details: input.details || '',
      ...(input.listing ? { listing: input.listing } : {}),
    }),
  });
}

export function fetchMyServiceRequests(input: {
  serviceType?: ServiceRequestType;
  nextUrl?: string | null;
} = {}): Promise<CursorPage<ServiceRequestRecord>> {
  if (input.nextUrl) {
    return apiRequest(apiPathFromPageUrl(input.nextUrl), {
      authenticated: true,
    });
  }
  const params = new URLSearchParams({ page_size: '20' });
  if (input.serviceType) params.set('service_type', input.serviceType);
  return apiRequest(`/service-requests/mine/?${params.toString()}`, {
    authenticated: true,
  });
}

export function fetchAdminServiceRequests(input: {
  status?: ServiceRequestStatus;
  serviceType?: ServiceRequestType;
  query?: string;
  nextUrl?: string | null;
} = {}): Promise<CursorPage<ServiceRequestRecord>> {
  if (input.nextUrl) {
    return apiRequest(apiPathFromPageUrl(input.nextUrl), {
      authenticated: true,
    });
  }
  const params = new URLSearchParams({ page_size: '20' });
  if (input.status) params.set('status', input.status);
  if (input.serviceType) params.set('service_type', input.serviceType);
  if (input.query?.trim()) params.set('q', input.query.trim());
  return apiRequest(`/service-requests/admin/?${params.toString()}`, {
    authenticated: true,
  });
}

export function updateAdminServiceRequest(
  id: string,
  input: {
    status?: ServiceRequestStatus;
    priority?: ServiceRequestPriority;
    assignedExpert?: number | null;
    adminNote?: string;
  },
): Promise<ServiceRequestRecord> {
  return apiRequest(`/service-requests/admin/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    authenticated: true,
    body: JSON.stringify({
      ...(input.status ? { status: input.status } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.assignedExpert !== undefined
        ? { assigned_expert: input.assignedExpert }
        : {}),
      ...(input.adminNote !== undefined ? { admin_note: input.adminNote } : {}),
    }),
  });
}

export function fetchExpertOptions(): Promise<CursorPage<ExpertOption>> {
  return apiRequest('/service-requests/admin/experts/?page_size=50', {
    authenticated: true,
  });
}

export function fetchExpertServiceRequests(input: {
  status?: ServiceRequestStatus;
  nextUrl?: string | null;
} = {}): Promise<CursorPage<ServiceRequestRecord>> {
  if (input.nextUrl) {
    return apiRequest(apiPathFromPageUrl(input.nextUrl), {
      authenticated: true,
    });
  }
  const params = new URLSearchParams({ page_size: '20' });
  if (input.status) params.set('status', input.status);
  return apiRequest(`/service-requests/expert/?${params.toString()}`, {
    authenticated: true,
  });
}

export function updateExpertServiceRequest(
  id: string,
  status: 'in_progress' | 'completed',
  expertNote: string,
): Promise<ServiceRequestRecord> {
  return apiRequest(`/service-requests/expert/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    authenticated: true,
    body: JSON.stringify({ status, expert_note: expertNote }),
  });
}

