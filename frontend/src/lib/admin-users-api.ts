import { API_BASE_URL, apiRequest } from '@/lib/api';
import type { UserRole } from '@/lib/account-api';

export interface AdminUser {
  id: number;
  display_name: string;
  phone_number: string | null;
  role: UserRole | null;
  role_label: string;
  is_phone_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface AdminUsersPage {
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export async function fetchAdminUsers(input: {
  role?: UserRole;
  active?: boolean;
  phone?: string;
  nextUrl?: string;
  signal?: AbortSignal;
} = {}): Promise<AdminUsersPage> {
  let path: string;
  if (input.nextUrl) {
    const apiUrl = new URL(API_BASE_URL);
    const cursorUrl = new URL(input.nextUrl, apiUrl);
    if (
      cursorUrl.origin !== apiUrl.origin ||
      !cursorUrl.pathname.startsWith(`${apiUrl.pathname.replace(/\/$/, '')}/auth/admin/users/`)
    ) {
      throw new Error('نشانی صفحه بعدی نامعتبر است.');
    }
    path = `${cursorUrl.pathname.slice(apiUrl.pathname.replace(/\/$/, '').length)}${cursorUrl.search}`;
  } else {
    const params = new URLSearchParams({ page_size: '20' });
    if (input.role) params.set('role', input.role);
    if (input.active !== undefined) params.set('active', String(input.active));
    if (input.phone?.trim()) params.set('phone', input.phone.trim());
    path = `/auth/admin/users/?${params}`;
  }
  return apiRequest<AdminUsersPage>(path, {
    authenticated: true,
    signal: input.signal,
  });
}
