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

test('agency registration follows the protected gallery upgrade path', () => {
  assert.equal(isRegistrationAccountType('agency'), true);
  assert.equal(isBusinessRegistration('agency'), true);
  assert.equal(signupRoleFor('agency'), 'gallery');
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
  assert.match(registerPage, /agencyPlan/);
  assert.match(registerPage, /شماره مجوز/);
  assert.match(registerPage, /شناسه ملی/);
  assert.match(registerPage, /ثبت نمایشگاه و ارسال درخواست نمایندگی/);
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
  assert.match(accountApi, /agency_plan: input\.agencyPlan/);
  assert.match(businessApi, /export async function updateMyBusiness/);
  assert.match(businessApi, /'\/businesses\/me\/profile\/'/);
  assert.match(correctionForm, /verification_note/);
  assert.match(correctionForm, /ذخیره و ارسال برای بررسی/);
  assert.match(adminPanel, /business_verification_status === 'verified'/);
  assert.match(adminPanel, /reviewSubscription\(id, action, note\)/);
  assert.match(adminPanel, /شماره مجوز/);
});
