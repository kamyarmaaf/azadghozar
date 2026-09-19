'use client';

import { type FormEvent, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Ban,
  Building2,
  CircleX,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchMyBusiness,
  updateMyBusiness,
  type BusinessProfile,
  type VerificationStatus,
} from '@/lib/business-api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';

interface BusinessFormState {
  name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  description: string;
  licenseNumber: string;
  nationalId: string;
  postalCode: string;
  licenseIssuer: string;
  licenseExpiresAt: string;
  companyRegistrationNumber: string;
  economicCode: string;
  authorizedRepresentativeName: string;
  importLicenseNumber: string;
  importLicenseIssuer: string;
  importLicenseExpiresAt: string;
  businessCardNumber: string;
  representedBrands: string;
}

const emptyForm: BusinessFormState = {
  name: '',
  phone: '',
  province: '',
  city: '',
  address: '',
  description: '',
  licenseNumber: '',
  nationalId: '',
  postalCode: '',
  licenseIssuer: '',
  licenseExpiresAt: '',
  companyRegistrationNumber: '',
  economicCode: '',
  authorizedRepresentativeName: '',
  importLicenseNumber: '',
  importLicenseIssuer: '',
  importLicenseExpiresAt: '',
  businessCardNumber: '',
  representedBrands: '',
};

const profileToForm = (profile: BusinessProfile): BusinessFormState => ({
  name: profile.name ?? '',
  phone: profile.phone ?? '',
  province: profile.province ?? '',
  city: profile.city ?? '',
  address: profile.address ?? '',
  description: profile.description ?? '',
  licenseNumber: profile.license_number ?? '',
  nationalId: profile.national_id ?? '',
  postalCode: profile.postal_code ?? '',
  licenseIssuer: profile.license_issuer ?? '',
  licenseExpiresAt: profile.license_expires_at ?? '',
  companyRegistrationNumber: profile.company_registration_number ?? '',
  economicCode: profile.economic_code ?? '',
  authorizedRepresentativeName: profile.authorized_representative_name ?? '',
  importLicenseNumber: profile.import_license_number ?? '',
  importLicenseIssuer: profile.import_license_issuer ?? '',
  importLicenseExpiresAt: profile.import_license_expires_at ?? '',
  businessCardNumber: profile.business_card_number ?? '',
  representedBrands: (profile.represented_brands ?? []).join('، '),
});

const statusPresentation: Record<VerificationStatus, {
  label: string;
  description: string;
  className: string;
  icon: typeof Clock3;
}> = {
  pending: {
    label: 'در انتظار بررسی کسب‌وکار',
    description: 'اطلاعات ثبت شده و پس از بررسی مدیریت نتیجه اعلام می‌شود.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: Clock3,
  },
  verified: {
    label: 'کسب‌وکار تأیید شده است',
    description: 'تغییر اطلاعات هویتی، پروفایل را دوباره وارد صف بررسی می‌کند.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: ShieldCheck,
  },
  rejected: {
    label: 'اطلاعات کسب‌وکار رد شده است',
    description: 'علت اعلام‌شده را برطرف و اطلاعات را دوباره ذخیره کنید.',
    className: 'border-red-200 bg-red-50 text-red-900',
    icon: CircleX,
  },
  suspended: {
    label: 'دسترسی کسب‌وکار تعلیق شده است',
    description: 'برای پیگیری تعلیق با مدیریت سامانه تماس بگیرید.',
    className: 'border-slate-300 bg-slate-100 text-slate-900',
    icon: Ban,
  },
};

export function BusinessVerificationForm() {
  const refreshSession = useAuth((state) => state.refreshSession);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<BusinessFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMyBusiness()
        .then((result) => {
          setProfile(result);
          setForm(profileToForm(result));
        })
        .catch((error) => {
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'دریافت اطلاعات کسب‌وکار انجام نشد.',
          });
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateField = <K extends keyof BusinessFormState>(
    field: K,
    value: BusinessFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (form.name.trim().length < 2) {
      setMessage({ type: 'error', text: 'نام نمایشگاه یا نمایندگی را وارد کنید.' });
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
      setMessage({ type: 'error', text: 'تلفن ثابت معتبر کسب‌وکار را وارد کنید.' });
      return;
    }
    if (!form.province.trim() || !form.city.trim() || form.address.trim().length < 5) {
      setMessage({ type: 'error', text: 'استان، شهر و آدرس کامل کسب‌وکار را وارد کنید.' });
      return;
    }
    if (form.postalCode.replace(/\D/g, '').length !== 10) {
      setMessage({ type: 'error', text: 'کد پستی ۱۰ رقمی کسب‌وکار را وارد کنید.' });
      return;
    }
    if (profile?.kind === 'gallery' && (!form.licenseNumber.trim() || !form.licenseIssuer.trim())) {
      setMessage({ type: 'error', text: 'شماره و مرجع صادرکننده پروانه کسب نمایشگاه را وارد کنید.' });
      return;
    }
    if (profile?.kind === 'agency') {
      if (!form.nationalId.trim() || !form.companyRegistrationNumber.trim()) {
        setMessage({ type: 'error', text: 'شناسه ملی و شماره ثبت شرکت را وارد کنید.' });
        return;
      }
      if (!form.authorizedRepresentativeName.trim()) {
        setMessage({ type: 'error', text: 'نام نماینده قانونی شرکت را وارد کنید.' });
        return;
      }
      if (!form.importLicenseNumber.trim() || !form.importLicenseIssuer.trim()) {
        setMessage({ type: 'error', text: 'اطلاعات مجوز واردات شرکت را کامل کنید.' });
        return;
      }
      if (!form.representedBrands.split(/[,،\n]/).some((brand) => brand.trim())) {
        setMessage({ type: 'error', text: 'حداقل یک برند وارداتی را وارد کنید.' });
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateMyBusiness({
        kind: profile?.kind ?? 'gallery',
        name: form.name.trim(),
        phone: form.phone.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        licenseNumber: form.licenseNumber.trim(),
        nationalId: form.nationalId.trim(),
        postalCode: form.postalCode.trim(),
        licenseIssuer: form.licenseIssuer.trim(),
        licenseExpiresAt: form.licenseExpiresAt || null,
        companyRegistrationNumber: form.companyRegistrationNumber.trim(),
        economicCode: form.economicCode.trim(),
        authorizedRepresentativeName: form.authorizedRepresentativeName.trim(),
        importLicenseNumber: form.importLicenseNumber.trim(),
        importLicenseIssuer: form.importLicenseIssuer.trim(),
        importLicenseExpiresAt: form.importLicenseExpiresAt || null,
        businessCardNumber: form.businessCardNumber.trim(),
        representedBrands: form.representedBrands
          .split(/[,،\n]/)
          .map((brand) => brand.trim())
          .filter(Boolean),
      });
      setProfile(result);
      setForm(profileToForm(result));
      await refreshSession();
      setMessage({
        type: 'success',
        text: result.verification_status === 'pending'
          ? 'اطلاعات ذخیره شد و در صف بررسی مدیریت قرار گرفت.'
          : 'اطلاعات کسب‌وکار با موفقیت ذخیره شد.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'ذخیره اطلاعات کسب‌وکار انجام نشد.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        در حال دریافت اطلاعات کسب‌وکار...
      </div>
    );
  }

  const status = profile ? statusPresentation[profile.verification_status] : null;
  const StatusIcon = status?.icon;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status && StatusIcon && (
        <div className={cn('rounded-xl border p-4', status.className)} role="status">
          <div className="flex items-start gap-3">
            <StatusIcon className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">{status.label}</p>
              <p className="mt-1 text-xs leading-5 opacity-80">{status.description}</p>
              {profile?.verification_note && (
                <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-xs leading-5">
                  توضیح مدیریت: {profile.verification_note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="verification-business-name">
            {profile?.kind === 'agency' ? 'نام حقوقی شرکت واردکننده *' : 'نام نمایشگاه *'}
          </Label>
          <div className="relative">
            <Building2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="verification-business-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="pr-10"
              maxLength={200}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="verification-business-phone">تلفن ثابت کسب‌وکار *</Label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="verification-business-phone"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value.replace(/[^0-9+\-() ]/g, ''))}
              className="pr-10 text-left"
              dir="ltr"
              inputMode="tel"
              maxLength={20}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="verification-province">استان *</Label>
            <Input
              id="verification-province"
              value={form.province}
              onChange={(event) => updateField('province', event.target.value)}
              maxLength={64}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="verification-city">شهر *</Label>
            <Input
              id="verification-city"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              maxLength={64}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="verification-address">آدرس کامل *</Label>
          <div className="relative">
            <MapPin className="absolute right-3 top-3 size-4 text-muted-foreground" />
            <Textarea
              id="verification-address"
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="min-h-24 pr-10"
              maxLength={2000}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="verification-postal-code">کد پستی *</Label>
          <Input
            id="verification-postal-code"
            value={form.postalCode}
            onChange={(event) => updateField('postalCode', event.target.value.replace(/\D/g, '').slice(0, 10))}
            className="text-left"
            dir="ltr"
            inputMode="numeric"
            required
          />
        </div>

        {profile?.kind !== 'agency' ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-license-number">شماره پروانه کسب نمایشگاه *</Label>
              <div className="relative">
                <FileText className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="verification-license-number" value={form.licenseNumber} onChange={(event) => updateField('licenseNumber', event.target.value)} className="pr-10" maxLength={80} required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-license-issuer">مرجع صادرکننده پروانه *</Label>
              <Input id="verification-license-issuer" value={form.licenseIssuer} onChange={(event) => updateField('licenseIssuer', event.target.value)} maxLength={200} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-license-expires">تاریخ اعتبار پروانه</Label>
              <Input id="verification-license-expires" type="date" value={form.licenseExpiresAt} onChange={(event) => updateField('licenseExpiresAt', event.target.value)} dir="ltr" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-national-id">شناسه ملی (در صورت حقوقی بودن)</Label>
              <Input id="verification-national-id" value={form.nationalId} onChange={(event) => updateField('nationalId', event.target.value.replace(/\D/g, ''))} className="text-left" dir="ltr" inputMode="numeric" maxLength={32} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-national-id">شناسه ملی شرکت *</Label>
              <div className="relative">
                <BadgeCheck className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="verification-national-id" value={form.nationalId} onChange={(event) => updateField('nationalId', event.target.value.replace(/\D/g, ''))} className="pr-10 text-left" dir="ltr" inputMode="numeric" maxLength={32} required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-registration-number">شماره ثبت شرکت *</Label>
              <Input id="verification-registration-number" value={form.companyRegistrationNumber} onChange={(event) => updateField('companyRegistrationNumber', event.target.value)} maxLength={80} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-economic-code">کد اقتصادی</Label>
              <Input id="verification-economic-code" value={form.economicCode} onChange={(event) => updateField('economicCode', event.target.value.replace(/\D/g, ''))} className="text-left" dir="ltr" inputMode="numeric" maxLength={32} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-representative">نماینده قانونی شرکت *</Label>
              <Input id="verification-representative" value={form.authorizedRepresentativeName} onChange={(event) => updateField('authorizedRepresentativeName', event.target.value)} maxLength={200} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-import-license">شماره مجوز واردات *</Label>
              <Input id="verification-import-license" value={form.importLicenseNumber} onChange={(event) => updateField('importLicenseNumber', event.target.value)} maxLength={80} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-import-issuer">مرجع صادرکننده مجوز واردات *</Label>
              <Input id="verification-import-issuer" value={form.importLicenseIssuer} onChange={(event) => updateField('importLicenseIssuer', event.target.value)} maxLength={200} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-import-expires">تاریخ اعتبار مجوز واردات</Label>
              <Input id="verification-import-expires" type="date" value={form.importLicenseExpiresAt} onChange={(event) => updateField('importLicenseExpiresAt', event.target.value)} dir="ltr" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="verification-business-card">شماره کارت بازرگانی</Label>
              <Input id="verification-business-card" value={form.businessCardNumber} onChange={(event) => updateField('businessCardNumber', event.target.value)} maxLength={80} />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="verification-brands">برندهای وارداتی *</Label>
              <Input id="verification-brands" value={form.representedBrands} onChange={(event) => updateField('representedBrands', event.target.value)} placeholder="تویوتا، کیا، هیوندای" required />
              <p className="text-[11px] text-muted-foreground">نام برندها را با ویرگول جدا کنید.</p>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="verification-description">{profile?.kind === 'agency' ? 'معرفی شرکت واردکننده' : 'معرفی نمایشگاه'}</Label>
          <Textarea
            id="verification-description"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={4}
            maxLength={3000}
          />
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={message.type === 'success'
            ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
            : 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving || profile?.verification_status === 'suspended'} className="gap-2">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        ذخیره و ارسال برای بررسی
      </Button>
    </form>
  );
}
