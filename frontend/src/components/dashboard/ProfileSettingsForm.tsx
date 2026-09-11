'use client';

import { FormEvent, useState } from 'react';
import { Building2, Loader2, Mail, MapPin, Phone, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/stores/auth';
import type { AuthUser, PreferredContactMethod } from '@/lib/account-api';

type ProfileMode = 'personal' | 'business';

interface ProfileSettingsFormProps {
  mode?: ProfileMode;
}

interface ProfileFormState {
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
}

const userToForm = (user: AuthUser): ProfileFormState => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email ?? '',
  province: user.province ?? '',
  city: user.city ?? '',
  address: user.address ?? '',
  preferredContactMethod: user.preferredContactMethod ?? 'both',
  businessName: user.businessName ?? '',
  businessPhone: user.businessPhone ?? '',
  businessDescription: user.businessDescription ?? '',
});

export function ProfileSettingsForm({ mode = 'personal' }: ProfileSettingsFormProps) {
  const currentUser = useAuth((state) => state.currentUser);

  if (!currentUser) {
    return (
      <p className="text-sm text-muted-foreground">
        برای مشاهده و ویرایش تنظیمات پروفایل ابتدا وارد حساب کاربری شوید.
      </p>
    );
  }

  const profileRevision = [
    currentUser.firstName,
    currentUser.lastName,
    currentUser.email,
    currentUser.province,
    currentUser.city,
    currentUser.address,
    currentUser.preferredContactMethod,
    currentUser.businessName,
    currentUser.businessPhone,
    currentUser.businessDescription,
  ].join('|');

  return (
    <ProfileSettingsEditor
      key={profileRevision}
      mode={mode}
      currentUser={currentUser}
    />
  );
}

function ProfileSettingsEditor({
  mode,
  currentUser,
}: ProfileSettingsFormProps & { currentUser: AuthUser }) {
  const updateProfile = useAuth((state) => state.updateProfile);
  const isLoading = useAuth((state) => state.isLoading);
  const [form, setForm] = useState<ProfileFormState>(() => userToForm(currentUser));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateField = <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!form.firstName.trim() && !form.lastName.trim()) {
      setMessage({ type: 'error', text: 'حداقل نام یا نام خانوادگی را وارد کنید.' });
      return;
    }
    if (mode === 'business' && !form.businessName.trim()) {
      setMessage({ type: 'error', text: 'نام نمایشگاه یا نمایندگی الزامی است.' });
      return;
    }

    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        preferredContactMethod: form.preferredContactMethod,
        ...(mode === 'business' && {
          businessName: form.businessName.trim(),
          businessPhone: form.businessPhone.trim(),
          businessDescription: form.businessDescription.trim(),
        }),
      });
      setMessage({ type: 'success', text: 'اطلاعات پروفایل با موفقیت ذخیره شد.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'ذخیره اطلاعات انجام نشد.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'business' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-name">نام نمایشگاه یا نمایندگی *</Label>
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="business-name"
                value={form.businessName}
                onChange={(event) => updateField('businessName', event.target.value)}
                placeholder="مثلاً: گالری رویال موتورز"
                className="pr-10"
                maxLength={200}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-phone">تلفن ثابت کسب‌وکار</Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="business-phone"
                value={form.businessPhone}
                onChange={(event) => updateField('businessPhone', event.target.value)}
                placeholder="02191009100"
                className="pr-10 text-left"
                dir="ltr"
                inputMode="tel"
                maxLength={20}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-first-name">نام</Label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="profile-first-name"
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="pr-10"
              autoComplete="given-name"
              maxLength={150}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-last-name">نام خانوادگی</Label>
          <Input
            id="profile-last-name"
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            autoComplete="family-name"
            maxLength={150}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-phone">شماره موبایل تأییدشده</Label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="profile-phone"
              value={currentUser.phoneNumber}
              className="pr-10 text-left bg-muted/40"
              dir="ltr"
              readOnly
            />
          </div>
          <p className="text-xs text-muted-foreground">تغییر موبایل نیاز به تأیید کد پیامکی دارد.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">ایمیل</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="name@example.com"
              className="pr-10 text-left"
              dir="ltr"
              autoComplete="email"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-province">استان</Label>
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="profile-province"
              value={form.province}
              onChange={(event) => updateField('province', event.target.value)}
              placeholder="مثلاً: هرمزگان"
              className="pr-10"
              maxLength={64}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-city">شهر</Label>
          <Input
            id="profile-city"
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            placeholder="مثلاً: بندرعباس"
            maxLength={64}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="profile-address">آدرس</Label>
          <Textarea
            id="profile-address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="آدرس کامل را وارد کنید"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>روش تماس ترجیحی</Label>
          <Select
            value={form.preferredContactMethod}
            onValueChange={(value: PreferredContactMethod) => updateField('preferredContactMethod', value)}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">تماس تلفنی و پیام در آزادگذر</SelectItem>
              <SelectItem value="phone">فقط تماس تلفنی</SelectItem>
              <SelectItem value="chat">فقط پیام در آزادگذر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === 'business' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="business-description">معرفی نمایشگاه یا نمایندگی</Label>
          <Textarea
            id="business-description"
            value={form.businessDescription}
            onChange={(event) => updateField('businessDescription', event.target.value)}
            placeholder="سابقه فعالیت، برندهای تخصصی و خدمات مجموعه را بنویسید."
            rows={4}
          />
        </div>
      )}

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

      <Button type="submit" disabled={isLoading} className="gap-2">
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        ذخیره تغییرات
      </Button>
    </form>
  );
}
