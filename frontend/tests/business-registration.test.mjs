import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const helperSource = readFileSync(join(root, 'src/lib/business-registration.ts'), 'utf8');
const helperModule = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const {
  isBusinessRegistration,
  isRegistrationAccountType,
  signupRoleFor,
} = await import(`data:text/javascript,${encodeURIComponent(helperModule)}`);

test('gallery and agency registration keep independent business identities', () => {
  assert.equal(isRegistrationAccountType('agency'), true);
  assert.equal(isBusinessRegistration('agency'), true);
  assert.equal(signupRoleFor('agency'), 'agency');
  assert.equal(signupRoleFor('gallery'), 'gallery');
  assert.equal(signupRoleFor('buyer'), 'buyer');
  assert.equal(isRegistrationAccountType('admin'), false);
});

test('account selection and signup form expose both business registration choices', () => {
  const accountTypePage = readFileSync(
    join(root, 'src/components/pages/AccountTypePage.tsx'),
    'utf8',
  );
  const registerPage = readFileSync(
    join(root, 'src/components/pages/RegisterPage.tsx'),
    'utf8',
  );
  const navigation = readFileSync(join(root, 'src/stores/navigation.ts'), 'utf8');

  assert.match(accountTypePage, /id: 'gallery'/);
  assert.match(accountTypePage, /id: 'agency'/);
  assert.match(accountTypePage, /registrationType: type\.id/);
  assert.match(registerPage, /signupRoleFor\(selectedRole\)/);
  assert.match(registerPage, /businessName: businessName\.trim\(\)/);
  assert.doesNotMatch(registerPage, /agencyPlan/);
  assert.match(registerPage, /شماره پروانه کسب نمایشگاه/);
  assert.match(registerPage, /شناسه ملی/);
  assert.match(registerPage, /شماره مجوز واردات/);
  assert.match(registerPage, /برندهای وارداتی/);
  assert.match(registerPage, /ثبت نمایندگی و ارسال برای بررسی/);
  assert.match(navigation, /register\?type=/);
  assert.match(navigation, /isRegistrationAccountType\(registrationType\)/);
});

test('business registration payload and correction form include review documents', () => {
  const accountApi = readFileSync(join(root, 'src/lib/account-api.ts'), 'utf8');
  const businessApi = readFileSync(join(root, 'src/lib/business-api.ts'), 'utf8');
  const correctionForm = readFileSync(
    join(root, 'src/components/business/BusinessVerificationForm.tsx'),
    'utf8',
  );
  const adminPanel = readFileSync(
    join(root, 'src/components/business/AdminBusinessPanel.tsx'),
    'utf8',
  );

  assert.match(accountApi, /license_number: input\.licenseNumber/);
  assert.match(accountApi, /national_id: input\.nationalId/);
  assert.match(accountApi, /import_license_number: input\.importLicenseNumber/);
  assert.match(accountApi, /represented_brands: input\.representedBrands/);
  assert.match(accountApi, /businessKind\?: 'gallery' \| 'agency'/);
  assert.match(accountApi, /input\.businessKind === 'agency'/);
  assert.doesNotMatch(accountApi, /agency_plan/);
  assert.match(businessApi, /export async function updateMyBusiness/);
  assert.match(businessApi, /kind: BusinessKind/);
  assert.match(businessApi, /input\.kind === 'agency'/);
  assert.match(businessApi, /'\/businesses\/me\/profile\/'/);
  assert.match(correctionForm, /verification_note/);
  assert.match(correctionForm, /ذخیره و ارسال برای بررسی/);
  assert.match(adminPanel, /business_verification_status === 'verified'/);
  assert.match(adminPanel, /reviewSubscription\(id, action, note\)/);
  assert.match(adminPanel, /پروانه کسب/);
  assert.match(adminPanel, /مجوز واردات/);
});
