import { apiRequest } from '@/lib/api';
import type { UserRole } from '@/lib/account-api';

export type DashboardMetricKey =
  | 'favorite_count'
  | 'service_request_count'
  | 'open_service_request_count'
  | 'listing_count'
  | 'active_listing_count'
  | 'pending_listing_count'
  | 'rejected_listing_count'
  | 'sold_listing_count'
  | 'total_views'
  | 'average_price'
  | 'member_count'
  | 'assigned_request_count'
  | 'in_progress_request_count'
  | 'completed_request_count'
  | 'total_request_count'
  | 'user_count'
  | 'pending_role_change_count'
  | 'pending_gallery_count'
  | 'pending_agency_count'
  | 'free_zone_listing_count'
  | 'temporary_import_listing_count'
  | 'verified_gallery_count'
  | 'verified_agency_count'
  | 'pending_business_count'
  | 'inspected_listing_count'
  | 'uninspected_listing_count'
  | 'inspection_waiting_count';

export interface DashboardBusinessSummary {
  id: number;
  name: string;
  slug: string;
  kind: 'gallery' | 'agency';
  kind_label: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verification_status_label: string;
}

export interface DashboardSummary {
  role: UserRole;
  role_label: string;
  scope: 'personal' | 'business' | 'assigned' | 'platform' | 'platform_read_only' | 'inspection_operations';
  metrics: Partial<Record<DashboardMetricKey, number>>;
  business: DashboardBusinessSummary | null;
}

export function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/auth/dashboard/summary/', {
    authenticated: true,
    signal,
  });
}
