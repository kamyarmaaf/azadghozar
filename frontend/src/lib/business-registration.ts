export type RegistrationAccountType =
  | 'buyer'
  | 'seller'
  | 'gallery'
  | 'agency';

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

export function signupRoleFor(
  value: RegistrationAccountType,
): RegistrationAccountType {
  return value;
}
