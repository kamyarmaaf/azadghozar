export type RegistrationAccountType =
  | 'buyer'
  | 'seller'
  | 'gallery'
  | 'agency';

export type AgencyPlan = 'agency_monthly' | 'agency_yearly';

const registrationTypes = new Set<RegistrationAccountType>([
  'buyer',
  'seller',
  'gallery',
  'agency',
]);

export function isRegistrationAccountType(
  value: unknown,
): value is RegistrationAccountType {
  return typeof value === 'string'
    && registrationTypes.has(value as RegistrationAccountType);
}

export function isBusinessRegistration(
  value: RegistrationAccountType | null,
): value is 'gallery' | 'agency' {
  return value === 'gallery' || value === 'agency';
}

/**
 * نمایندگی یک نقش ثبت‌نام عمومی نیست. متقاضی ابتدا مالک نمایشگاه می‌شود
 * و پس از تأیید مدارک و اشتراک، مدیر سامانه نقش او را ارتقا می‌دهد.
 */
export function signupRoleFor(
  value: RegistrationAccountType,
): 'buyer' | 'seller' | 'gallery' {
  return value === 'agency' ? 'gallery' : value;
}
