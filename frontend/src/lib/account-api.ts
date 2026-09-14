import {
  API_BASE_URL,
  apiRequest,
  clearAuthTokens,
  resolveMediaUrl,
  saveAuthTokens,
  type AuthTokens,
} from "@/lib/api";
import type { PageId } from "@/stores/navigation";

export type UserRole =
  | "buyer"
  | "seller"
  | "gallery"
  | "agency"
  | "expert"
  | "admin"
  | "org"
  | "free_zone_supervisor"
  | "smart_id_operator";

export interface BackendUser {
  id: number;
  username: string;
  phone_number: string | null;
  role: UserRole;
  role_label: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  is_phone_verified: boolean;
  referral_code: string;
  referral_credit: number;
  referral_earnings: number;
  terms_accepted_at: string | null;
  profile_completed_at: string | null;
  province: string;
  city: string;
  address: string;
  preferred_contact_method: PreferredContactMethod;
  business_name: string;
  business_phone: string;
  business_description: string;
  business_logo: string | null;
  business_cover: string | null;
  business_access: BusinessAccess | null;
  date_joined: string;
}

export interface BusinessAccess {
  id: number;
  slug: string;
  name: string;
  kind: 'gallery' | 'agency';
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  is_owner: boolean;
  can_manage_listings: boolean;
  can_manage_members: boolean;
}

export type PreferredContactMethod = "phone" | "chat" | "both";

export interface AuthUser {
  id: number;
  username: string;
  phoneNumber: string;
  role: UserRole;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  province: string;
  city: string;
  address: string;
  preferredContactMethod: PreferredContactMethod;
  businessName: string;
  businessPhone: string;
  businessDescription: string;
  businessLogo: string;
  businessCover: string;
  avatar: string;
  dashboardPage: PageId;
  referralCode: string;
  referralCredit: number;
  referralEarnings: number;
  profileCompleted: boolean;
  businessAccess: BusinessAccess | null;
}

export interface AuthResponse extends AuthTokens {
  user: BackendUser;
}

export interface ReferralRecord {
  id: string;
  refereeName: string;
  refereePhone: string;
  code: string;
  rewardType: string;
  rewardValue: number;
  rewardClaimed: boolean;
  claimedAt: string | null;
  createdAt: string;
}

export interface ReferralState {
  referralCount: number;
  totalEarnings: number;
  availableCredit: number;
  unclaimedRewards: number;
  referralRecords: ReferralRecord[];
}

interface BackendReferralRecord {
  id: number;
  referee_name: string;
  referee_phone: string | null;
  code: string;
  reward_type: string;
  reward_value: number;
  reward_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

interface ReferralStatsResponse {
  referral_code: string;
  referral_count: number;
  total_earnings: number;
  available_credit: number;
  unclaimed_rewards: number;
  records: BackendReferralRecord[];
}

export interface RoleChangeRequest {
  id: string;
  userName: string;
  userPhone: string;
  fromRole: UserRole;
  toRole: UserRole;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  reviewedAt: string | null;
  createdAt: string;
}

interface BackendRoleChangeRequest {
  id: number;
  user_name: string;
  user_phone: string | null;
  from_role: UserRole;
  to_role: UserRole;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  reviewed_at: string | null;
  created_at: string;
}

const dashboardByRole: Record<UserRole, PageId> = {
  buyer: "buyer-dashboard",
  seller: "seller-dashboard",
  gallery: "gallery-dashboard",
  agency: "gallery-dashboard",
  expert: "expert-dashboard",
  admin: "admin-dashboard",
  org: "org-panel",
  free_zone_supervisor: "org-panel",
  smart_id_operator: "smart-id",
};

export function mapUser(user: BackendUser): AuthUser {
  const name = user.display_name || user.phone_number || user.username;
  return {
    id: user.id,
    username: user.username,
    phoneNumber: user.phone_number || "",
    role: user.role,
    name,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    province: user.province,
    city: user.city,
    address: user.address,
    preferredContactMethod: user.preferred_contact_method,
    businessName: user.business_name,
    businessPhone: user.business_phone,
    businessDescription: user.business_description,
    businessLogo: resolveMediaUrl(user.business_logo),
    businessCover: resolveMediaUrl(user.business_cover),
    avatar: name.trim().charAt(0) || "ک",
    dashboardPage: user.business_access
      ? 'gallery-dashboard'
      : dashboardByRole[user.role],
    referralCode: user.referral_code,
    referralCredit: user.referral_credit,
    referralEarnings: user.referral_earnings,
    profileCompleted: Boolean(user.profile_completed_at),
    businessAccess: user.business_access,
  };
}

function mapRoleChange(item: BackendRoleChangeRequest): RoleChangeRequest {
  return {
    id: String(item.id),
    userName: item.user_name,
    userPhone: item.user_phone || "",
    fromRole: item.from_role,
    toRole: item.to_role,
    reason: item.reason,
    status: item.status,
    adminNote: item.admin_note,
    reviewedAt: item.reviewed_at,
    createdAt: item.created_at,
  };
}

function persistAuth(response: AuthResponse): AuthUser {
  saveAuthTokens({ access: response.access, refresh: response.refresh });
  return mapUser(response.user);
}

export async function requestSignupOtp(input: {
  phoneNumber: string;
  role: UserRole;
  referralCode?: string;
}): Promise<{ expiresIn: number; resendIn: number }> {
  const response = await apiRequest<{
    expires_in: number;
    resend_in: number;
  }>("/auth/signup/request-otp/", {
    method: "POST",
    body: JSON.stringify({
      phone_number: input.phoneNumber,
      role: input.role,
      referral_code: input.referralCode || "",
    }),
  });
  return {
    expiresIn: response.expires_in,
    resendIn: response.resend_in,
  };
}

export async function verifySignupOtp(
  phoneNumber: string,
  otp: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>(
    "/auth/signup/verify-otp/",
    {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, otp }),
    },
  );
  return persistAuth(response);
}

export async function completeSignup(input: {
  fullName: string;
  password: string;
  passwordConfirmation: string;
  acceptTerms: boolean;
}): Promise<AuthUser> {
  const response = await apiRequest<{ user: BackendUser }>(
    "/auth/signup/complete/",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        full_name: input.fullName,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
        accept_terms: input.acceptTerms,
      }),
    },
  );
  return mapUser(response.user);
}

export async function passwordLogin(
  identifier: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>("/auth/login/password/", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
  return persistAuth(response);
}

export async function requestLoginOtp(phoneNumber: string): Promise<void> {
  await apiRequest("/auth/login/request-otp/", {
    method: "POST",
    body: JSON.stringify({ phone_number: phoneNumber }),
  });
}

export async function verifyLoginOtp(
  phoneNumber: string,
  otp: string,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>(
    "/auth/login/verify-otp/",
    {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, otp }),
    },
  );
  return persistAuth(response);
}

export async function requestPasswordResetOtp(
  phoneNumber: string,
): Promise<{ resendIn: number }> {
  const response = await apiRequest<{ resend_in: number }>(
    "/auth/password-reset/request-otp/",
    {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber }),
    },
  );
  return { resendIn: response.resend_in };
}

export async function confirmPasswordReset(input: {
  phoneNumber: string;
  otp: string;
  newPassword: string;
  passwordConfirmation: string;
}): Promise<void> {
  await apiRequest("/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({
      phone_number: input.phoneNumber,
      otp: input.otp,
      new_password: input.newPassword,
      password_confirmation: input.passwordConfirmation,
    }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<BackendUser>("/auth/me/", {
    authenticated: true,
  });
  return mapUser(response);
}

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  province?: string;
  city?: string;
  address?: string;
  preferredContactMethod?: PreferredContactMethod;
  businessName?: string;
  businessPhone?: string;
  businessDescription?: string;
}

export async function updateCurrentUserProfile(
  input: ProfileUpdateInput,
): Promise<AuthUser> {
  const response = await apiRequest<BackendUser>("/auth/me/", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      province: input.province,
      city: input.city,
      address: input.address,
      preferred_contact_method: input.preferredContactMethod,
      business_name: input.businessName,
      business_phone: input.businessPhone,
      business_description: input.businessDescription,
    }),
  });
  return mapUser(response);
}

export async function updateBusinessMedia(input: {
  businessLogo?: File;
  businessCover?: File;
}): Promise<AuthUser> {
  const body = new FormData();
  if (input.businessLogo) {
    body.append("business_logo", input.businessLogo, input.businessLogo.name);
  }
  if (input.businessCover) {
    body.append("business_cover", input.businessCover, input.businessCover.name);
  }
  const response = await apiRequest<BackendUser>("/auth/me/", {
    method: "PATCH",
    authenticated: true,
    body,
  });
  return mapUser(response);
}

export async function verifyReferralCode(
  code: string,
): Promise<{ valid: boolean; referrerName?: string }> {
  const response = await apiRequest<{
    valid: boolean;
    referrer_name?: string;
  }>(`/auth/referrals/verify/?code=${encodeURIComponent(code)}`);
  return {
    valid: response.valid,
    referrerName: response.referrer_name,
  };
}

export async function fetchReferralStats(): Promise<ReferralState> {
  const response = await apiRequest<ReferralStatsResponse>(
    "/auth/referrals/stats/",
    { authenticated: true },
  );
  return {
    referralCount: response.referral_count,
    totalEarnings: response.total_earnings,
    availableCredit: response.available_credit,
    unclaimedRewards: response.unclaimed_rewards,
    referralRecords: response.records.map((item) => ({
      id: String(item.id),
      refereeName: item.referee_name,
      refereePhone: item.referee_phone || "",
      code: item.code,
      rewardType: item.reward_type,
      rewardValue: item.reward_value,
      rewardClaimed: item.reward_claimed,
      claimedAt: item.claimed_at,
      createdAt: item.created_at,
    })),
  };
}

export async function claimReferralReward(id: string): Promise<void> {
  await apiRequest(`/auth/referrals/${id}/claim/`, {
    method: "POST",
    authenticated: true,
  });
}

export async function fetchMyRoleChanges(): Promise<RoleChangeRequest[]> {
  const response = await apiRequest<{
    requests: BackendRoleChangeRequest[];
  }>("/auth/role-changes/", { authenticated: true });
  return response.requests.map(mapRoleChange);
}

export async function createRoleChange(input: {
  toRole: UserRole;
  reason: string;
}): Promise<RoleChangeRequest> {
  const response = await apiRequest<BackendRoleChangeRequest>(
    "/auth/role-changes/",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({
        to_role: input.toRole,
        reason: input.reason,
      }),
    },
  );
  return mapRoleChange(response);
}

export async function fetchPendingRoleChanges(input: {
  nextUrl?: string;
  signal?: AbortSignal;
} = {}): Promise<{ requests: RoleChangeRequest[]; next: string | null }> {
  let path = "/auth/role-changes/pending/";
  if (input.nextUrl) {
    const apiUrl = new URL(API_BASE_URL);
    const nextUrl = new URL(input.nextUrl, apiUrl);
    const basePath = apiUrl.pathname.replace(/\/$/, "");
    if (nextUrl.origin !== apiUrl.origin || nextUrl.pathname !== `${basePath}${path}`) {
      throw new Error("نشانی صفحه بعدی درخواست‌ها نامعتبر است.");
    }
    path += nextUrl.search;
  }
  const response = await apiRequest<{
    requests: BackendRoleChangeRequest[];
    next: string | null;
  }>(path, { authenticated: true, signal: input.signal });
  return { requests: response.requests.map(mapRoleChange), next: response.next };
}

export async function reviewRoleChange(
  id: string,
  decision: "approve" | "reject",
  adminNote = "",
): Promise<RoleChangeRequest> {
  const response = await apiRequest<BackendRoleChangeRequest>(
    `/auth/role-changes/${id}/${decision}/`,
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ admin_note: adminNote }),
    },
  );
  return mapRoleChange(response);
}

export function clearSession(): void {
  clearAuthTokens();
}
