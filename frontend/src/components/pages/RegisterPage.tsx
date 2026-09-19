'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { verifyReferralCode as verifyReferralCodeApi } from '@/lib/account-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toPersianNumber } from '@/lib/utils';
import {
  isBusinessRegistration,
  isRegistrationAccountType,
  signupRoleFor,
  type RegistrationAccountType,
} from '@/lib/business-registration';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  ShoppingBag,
  Store,
  Building2,
  ChevronLeft,
  Check,
  ShieldCheck,
  RefreshCw,
  Gift,
  Tag,
  X,
  Loader2,
  Crown,
  MapPin,
  FileText,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Role definitions                                                  */
/* ------------------------------------------------------------------ */
const roles: {
  id: RegistrationAccountType;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  activeBorder: string;
  activeBg: string;
}[] = [
  {
    id: 'buyer',
    icon: ShoppingBag,
    title: 'خریدار',
    subtitle: 'جستجو و خرید خودرو',
    color: 'text-gold-dark',
    activeBorder: 'border-gold',
    activeBg: 'bg-gold/10',
  },
  {
    id: 'seller',
    icon: Store,
    title: 'فروشنده',
    subtitle: 'ثبت آگهی و فروش خودرو',
    color: 'text-emerald-600',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-500/10',
  },
  {
    id: 'gallery',
    icon: Building2,
    title: 'نمایشگاه‌دار',
    subtitle: 'مدیریت نمایشگاه خودرو',
    color: 'text-amber-600',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-500/10',
  },
  {
    id: 'agency',
    icon: Crown,
    title: 'نمایندگی',
    subtitle: 'ویژه شرکت واردکننده خودرو',
    color: 'text-indigo-600',
    activeBorder: 'border-indigo-500',
    activeBg: 'bg-indigo-500/10',
  },
];

/* ------------------------------------------------------------------ */
/*  OTP Timer Hook                                                     */
/* ------------------------------------------------------------------ */
function useOtpTimer(initialSeconds = 120) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, seconds]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setRunning(true);
  }, [initialSeconds]);

  const label =
    seconds > 0
      ? `${toPersianNumber(String(Math.floor(seconds / 60)).padStart(2, '0'))}:${toPersianNumber(String(seconds % 60).padStart(2, '0'))}`
      : '';

  return { seconds, running, label, start, canResend: seconds <= 0 && !running };
}

/* ------------------------------------------------------------------ */
/*  OTP Input Component                                                */
/* ------------------------------------------------------------------ */
function OtpInput({ length = 6, onComplete }: { length?: number; onComplete: (code: string) => void }) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[\d]*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    const code = next.join('');
    if (code.length === length && !next.includes('')) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex justify-center gap-2.5" dir="ltr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all',
            d
              ? 'border-gold bg-gold/5 text-brand'
              : 'border-border bg-background text-foreground',
            'focus:border-gold focus:ring-2 focus:ring-gold/20'
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function RegisterPage() {
  const navigateTo = useNavigation((s) => s.navigateTo);
  const pageData = useNavigation((s) => s.pageData);
  const {
    requestRegistrationOtp,
    confirmRegistrationOtp,
    finishRegistration,
    isLoading,
  } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<RegistrationAccountType | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseIssuer, setLicenseIssuer] = useState('');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState('');
  const [economicCode, setEconomicCode] = useState('');
  const [authorizedRepresentativeName, setAuthorizedRepresentativeName] = useState('');
  const [importLicenseNumber, setImportLicenseNumber] = useState('');
  const [importLicenseIssuer, setImportLicenseIssuer] = useState('');
  const [importLicenseExpiresAt, setImportLicenseExpiresAt] = useState('');
  const [businessCardNumber, setBusinessCardNumber] = useState('');
  const [representedBrands, setRepresentedBrands] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralVerified, setReferralVerified] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralName, setReferralName] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  const otpTimer = useOtpTimer(120);
  const businessRegistration = isBusinessRegistration(selectedRole);
  const agencyRegistration = selectedRole === 'agency';

  /* --- auto-detect registration type and referral code from URL --- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const requestedType = pageData?.registrationType ?? params.get('type');
      if (isRegistrationAccountType(requestedType)) {
        setSelectedRole(requestedType);
      }
      const ref = String(pageData?.referralCode ?? params.get('ref') ?? '');
      if (ref) {
        void verifyReferralCodeApi(ref)
          .then((data) => {
            if (cancelled) return;
            setReferralCode(ref);
            if (data.valid) {
              setReferralVerified(true);
              setReferralName(data.referrerName || 'کاربر آزادگذر');
            } else {
              setReferralError('کد دعوت معتبر نیست');
            }
          })
          .catch(() => {
            if (cancelled) return;
            setReferralCode(ref);
            setReferralError('خطا در بررسی کد دعوت');
          });
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pageData]);

  /* --- verify referral code manually --- */
  const verifyReferralCode = async () => {
    if (!referralCode || referralCode.length < 3) {
      setReferralError('کد دعوت را وارد کنید');
      setReferralVerified(false);
      return;
    }
    setReferralError('');
    try {
      const result = await verifyReferralCodeApi(referralCode);
      if (result.valid) {
        setReferralVerified(true);
        setReferralName(result.referrerName || 'کاربر آزادگذر');
        setReferralError('');
      } else {
        setReferralVerified(false);
        setReferralError('کد دعوت معتبر نیست');
      }
    } catch (error) {
      setReferralVerified(false);
      setReferralError(error instanceof Error ? error.message : 'خطا در بررسی کد دعوت');
    }
  };

  const clearReferral = () => {
    setReferralCode('');
    setReferralVerified(false);
    setReferralError('');
    setReferralName('');
  };

  /* --- send OTP --- */
  const sendOtp = async () => {
    if (!phone || phone.length < 10) return;
    if (!selectedRole) return;
    setRegistrationError('');
    try {
      await requestRegistrationOtp(
        phone,
        signupRoleFor(selectedRole),
        referralVerified ? referralCode : undefined,
      );
      otpTimer.start();
      setOtpVerified(false);
      setOtpError(false);
      setStep(3);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'خطا در ارسال کد تأیید');
    }
  };

  /* --- verify OTP --- */
  const verifyOtp = async (code: string) => {
    if (code.length === 6) {
      try {
        await confirmRegistrationOtp(phone, code);
        setOtpVerified(true);
        setOtpError(false);
        setRegistrationError('');
      } catch (error) {
        setOtpVerified(false);
        setOtpError(true);
        setRegistrationError(error instanceof Error ? error.message : 'کد واردشده صحیح نیست');
      }
    }
  };

  /* --- submit --- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    if (name.trim().length < 2) {
      setRegistrationError('نام و نام خانوادگی را وارد کنید');
      return;
    }
    if (password.length < 8) {
      setRegistrationError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }
    if (password !== confirmPassword) {
      setRegistrationError('رمز عبور و تکرار آن یکسان نیست');
      return;
    }
    if (!acceptTerms) {
      setRegistrationError('پذیرش قوانین و مقررات الزامی است');
      return;
    }
    if (businessRegistration) {
      if (businessName.trim().length < 2) {
        setRegistrationError(
          agencyRegistration
            ? 'نام حقوقی شرکت واردکننده را وارد کنید'
            : 'نام نمایشگاه را وارد کنید',
        );
        return;
      }
      if (businessPhone.replace(/\D/g, '').length < 7) {
        setRegistrationError('تلفن ثابت معتبر کسب‌وکار را وارد کنید');
        return;
      }
      if (!province.trim() || !city.trim()) {
        setRegistrationError('استان و شهر محل فعالیت را کامل کنید');
        return;
      }
      if (address.trim().length < 5) {
        setRegistrationError('آدرس کامل کسب‌وکار را وارد کنید');
        return;
      }
      if (postalCode.replace(/\D/g, '').length !== 10) {
        setRegistrationError('کد پستی ۱۰ رقمی کسب‌وکار را وارد کنید');
        return;
      }
      if (!agencyRegistration && (!licenseNumber.trim() || !licenseIssuer.trim())) {
        setRegistrationError('شماره و مرجع صادرکننده پروانه کسب نمایشگاه را وارد کنید');
        return;
      }
      if (agencyRegistration) {
        if (!nationalId.trim() || !companyRegistrationNumber.trim()) {
          setRegistrationError('شناسه ملی و شماره ثبت شرکت را وارد کنید');
          return;
        }
        if (!authorizedRepresentativeName.trim()) {
          setRegistrationError('نام نماینده قانونی شرکت را وارد کنید');
          return;
        }
        if (!importLicenseNumber.trim() || !importLicenseIssuer.trim()) {
          setRegistrationError('اطلاعات مجوز واردات شرکت را کامل کنید');
          return;
        }
        if (!representedBrands.split(/[,،\n]/).some((brand) => brand.trim())) {
          setRegistrationError('حداقل یک برند وارداتی را وارد کنید');
          return;
        }
      }
    }
    try {
      const user = await finishRegistration({
        fullName: name.trim(),
        password,
        passwordConfirmation: confirmPassword,
        acceptTerms,
        ...(businessRegistration && {
          businessKind: agencyRegistration ? 'agency' : 'gallery',
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim(),
          province: province.trim(),
          city: city.trim(),
          address: address.trim(),
          postalCode: postalCode.trim(),
          businessDescription: businessDescription.trim(),
          ...(agencyRegistration
            ? {
                nationalId: nationalId.trim(),
                companyRegistrationNumber: companyRegistrationNumber.trim(),
                economicCode: economicCode.trim(),
                authorizedRepresentativeName: authorizedRepresentativeName.trim(),
                importLicenseNumber: importLicenseNumber.trim(),
                importLicenseIssuer: importLicenseIssuer.trim(),
                importLicenseExpiresAt: importLicenseExpiresAt || null,
                businessCardNumber: businessCardNumber.trim(),
                representedBrands: representedBrands
                  .split(/[,،\n]/)
                  .map((brand) => brand.trim())
                  .filter(Boolean),
              }
            : {
                licenseNumber: licenseNumber.trim(),
                licenseIssuer: licenseIssuer.trim(),
                licenseExpiresAt: licenseExpiresAt || null,
                nationalId: nationalId.trim(),
              }),
        }),
      });
      if (businessRegistration && typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'azadgozar-business-registration-notice',
          agencyRegistration ? 'agency' : 'gallery',
        );
      }
      navigateTo(user.dashboardPage);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'خطا در تکمیل ثبت‌نام');
    }
  };

  const roleData = roles.find((r) => r.id === selectedRole);

  /* --- step 1 → 2 --- */
  const goToStep2 = () => {
    if (!selectedRole) return;
    setStep(2);
  };

  /* --- step 2 → 1 --- */
  const goToStep1 = () => setStep(1);
  /* --- step 3 → 2 --- */
  const goToPhone = () => setStep(2);

  /* --- step 3 → 4 (form) --- */
  const currentStep = step === 4 ? 3 : step;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card
        className={cn(
          'w-full shadow-premium transition-[max-width]',
          businessRegistration && step === 3 && otpVerified ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold text-gradient mb-2">آزاد گذر</div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <>
                {s > 1 && (
                  <div
                    key={`line-${s}`}
                    className={cn(
                      'w-8 h-0.5 rounded transition-colors',
                      currentStep >= s ? 'bg-gold' : 'bg-border'
                    )}
                  />
                )}
                <span
                  key={s}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                    currentStep > s
                      ? 'bg-success text-white'
                      : currentStep === s
                        ? 'bg-gold text-brand'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentStep > s ? <Check className="size-3.5" /> : toPersianNumber(String(s))}
                </span>
              </>
            ))}
          </div>

          <CardTitle className="text-xl">
            {step === 1 && 'نوع حساب کاربری'}
            {step === 2 && 'شماره موبایل'}
            {step === 3 && !otpVerified && 'تایید شماره موبایل'}
            {step === 3 && otpVerified && 'تکمیل ثبت‌نام'}
            {step === 4 && 'تکمیل ثبت‌نام'}
          </CardTitle>
          <CardDescription className="mt-1">
            {step === 1 && 'انتخاب کنید که با چه عنوانی می‌خواهید فعالیت کنید'}
            {step === 2 && `ثبت‌نام به عنوان ${roleData?.title} — شماره موبایل خود را وارد کنید`}
            {step === 3 && !otpVerified && `کد تایید ارسال شده به ${phone} را وارد کنید`}
            {step === 3 && otpVerified && `اطلاعات خود را تکمیل کنید`}
            {step === 4 && `اطلاعات خود را تکمیل کنید`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {registrationError && !(step === 3 && otpVerified) && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {registrationError}
            </div>
          )}

          {/* =============== STEP 1: Role =============== */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-right transition-all duration-200',
                      isActive
                        ? cn(role.activeBorder, role.activeBg, 'shadow-sm')
                        : 'border-border hover:border-gold/40 hover:bg-muted/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isActive ? role.activeBg : 'bg-muted'
                      )}
                    >
                      <Icon className={cn('size-6', role.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-bold text-sm text-foreground">{role.title}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{role.subtitle}</span>
                    </div>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        isActive ? 'border-gold bg-gold' : 'border-muted-foreground/30'
                      )}
                    >
                      {isActive && <Check className="size-3.5 text-brand" />}
                    </div>
                  </button>
                );
              })}
              {agencyRegistration && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs leading-6 text-indigo-800">
                  این حساب مخصوص شرکت‌های حقوقی واردکننده خودرو است و از ابتدا به‌عنوان نمایندگی ثبت می‌شود.
                  فعال‌سازی پس از بررسی اطلاعات ثبتی و مجوز واردات توسط مدیریت انجام خواهد شد.
                </div>
              )}
              <Button onClick={goToStep2} disabled={!selectedRole} className="w-full h-11 text-base mt-3">
                ادامه
                <ChevronLeft className="size-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">
                قبلا ثبت‌نام کرده‌اید؟{' '}
                <button type="button" className="text-gold-dark font-medium hover:underline" onClick={() => navigateTo('login')}>
                  ورود
                </button>
              </p>
            </div>
          )}

          {/* =============== STEP 2: Phone =============== */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={goToStep1}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border hover:border-gold/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {roleData && (
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', roleData.activeBg)}>
                      <roleData.icon className={cn('size-5', roleData.color)} />
                    </div>
                  )}
                  <div className="text-right">
                    <span className="block text-sm font-bold text-foreground">{roleData?.title}</span>
                    <span className="block text-[11px] text-muted-foreground">برای تغییر کلیک کنید</span>
                  </div>
                </div>
                <ChevronLeft className="size-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-phone">شماره موبایل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="pr-10 text-left"
                    dir="ltr"
                    type="tel"
                    maxLength={11}
                  />
                </div>
              </div>

              {/* Referral Code Section */}
              <div className="relative rounded-xl border-2 border-gold/20 bg-gold/5 p-4">
                <button
                  type="button"
                  onClick={clearReferral}
                  className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="size-4 text-gold-dark" />
                  <Label className="text-sm font-medium text-foreground">کد دعوت (اختیاری)</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-5">
                  اگر با کد دعوت دوستتان ثبت‌نام می‌کنید، اینجا وارد کنید تا هر دو تخفیف بگیرید!
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="مثال: ALI-MH7X"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        if (referralVerified) {
                          setReferralVerified(false);
                          setReferralName('');
                        }
                        setReferralError('');
                      }}
                      className="pr-10 pl-3 font-mono text-sm"
                      dir="ltr"
                      maxLength={10}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={verifyReferralCode}
                    disabled={referralCode.length < 3}
                    className="shrink-0 px-4"
                  >
                    بررسی
                  </Button>
                </div>
                {referralVerified && (
                  <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-700">
                      کد معتبر است — از طرف <span className="font-bold">{referralName}</span>
                    </span>
                    <Gift className="size-4 text-gold shrink-0" />
                    <span className="text-xs font-medium text-gold-dark">+۵۰۰,۰۰۰ تومان تخفیف</span>
                  </div>
                )}
                {referralError && !referralVerified && (
                  <p className="text-xs text-red-500 mt-2">{referralError}</p>
                )}
              </div>

              <Button
                onClick={sendOtp}
                disabled={phone.length < 10 || isLoading}
                className="w-full h-11 text-base"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                ارسال کد تایید
                <ChevronLeft className="size-4" />
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-2">
                قبلا ثبت‌نام کرده‌اید؟{' '}
                <button type="button" className="text-gold-dark font-medium hover:underline" onClick={() => navigateTo('login')}>
                  ورود
                </button>
              </p>
            </div>
          )}

          {/* =============== STEP 3: OTP =============== */}
          {step === 3 && !otpVerified && (
            <div className="flex flex-col gap-5">
              {/* Phone info */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" />
                <span dir="ltr">{phone}</span>
                <button
                  type="button"
                  onClick={goToPhone}
                  className="text-gold-dark font-medium hover:underline text-xs mr-1"
                >
                  تغییر شماره
                </button>
              </div>

              {/* OTP input */}
              <OtpInput onComplete={verifyOtp} />

              {/* Error */}
              {otpError && (
                <p className="text-center text-sm text-red-500">کد وارد شده صحیح نیست. لطفا دوباره تلاش کنید.</p>
              )}

              {/* Verified */}
              {otpVerified && (
                <div className="flex items-center justify-center gap-2 text-sm text-success font-medium">
                  <ShieldCheck className="size-4" />
                  شماره موبایل تایید شد
                </div>
              )}

              {/* Timer / Resend */}
              <div className="flex flex-col items-center gap-3">
                {otpTimer.label ? (
                  <p className="text-sm text-muted-foreground">
                    ارسال مجدد کد تا {otpTimer.label} دیگر
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { sendOtp(); }}
                    className="flex items-center gap-1.5 text-sm text-gold-dark font-medium hover:underline"
                  >
                    <RefreshCw className="size-3.5" />
                    ارسال مجدد کد تایید
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  در حال بررسی کد تأیید...
                </div>
              )}
            </div>
          )}

          {/* =============== STEP 3 (verified) / STEP 4: Form =============== */}
          {(step === 3 && otpVerified) && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Verified badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                <ShieldCheck className="size-5 text-success shrink-0" />
                <div>
                  <span className="block text-sm font-medium text-success">شماره موبایل تایید شد</span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">{phone}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">نام و نام خانوادگی</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input id="name" placeholder="علی محمدی" value={name} onChange={(e) => setName(e.target.value)} className="pr-10" />
                </div>
              </div>

              {businessRegistration && (
                <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      agencyRegistration ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700',
                    )}>
                      {agencyRegistration ? <Crown className="size-5" /> : <Building2 className="size-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {agencyRegistration ? 'اطلاعات شرکت واردکننده خودرو' : 'اطلاعات نمایشگاه خودرو'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        این اطلاعات برای احراز کسب‌وکار بررسی می‌شود و تا زمان تأیید عمومی نخواهد شد.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="business-name">
                        {agencyRegistration ? 'نام حقوقی شرکت' : 'نام نمایشگاه'}
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="business-name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder={agencyRegistration ? 'شرکت واردکننده خودروی پارس' : 'نمایشگاه خودروی پارس'}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="business-phone">تلفن ثابت کسب‌وکار</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="business-phone"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value.replace(/[^0-9+\-() ]/g, ''))}
                          placeholder="۰۲۱۸۸۷۷۶۶۵۵"
                          className="pr-10 text-left"
                          dir="ltr"
                          inputMode="tel"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="business-province">استان</Label>
                        <Input
                          id="business-province"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="تهران"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="business-city">شهر</Label>
                        <Input
                          id="business-city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="تهران"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="business-address">آدرس کامل</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 size-4 text-muted-foreground" />
                        <Textarea
                          id="business-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="خیابان، کوچه، پلاک و کد پستی"
                          className="min-h-20 pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="postal-code">کد پستی *</Label>
                      <Input
                        id="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="کد پستی ۱۰ رقمی"
                        className="text-left"
                        dir="ltr"
                        inputMode="numeric"
                        required
                      />
                    </div>

                    {!agencyRegistration ? (
                      <>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="license-number">شماره پروانه کسب نمایشگاه *</Label>
                          <div className="relative">
                            <FileText className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="license-number"
                              value={licenseNumber}
                              onChange={(e) => setLicenseNumber(e.target.value)}
                              placeholder="شماره پروانه کسب"
                              className="pr-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="license-issuer">مرجع صادرکننده پروانه *</Label>
                          <Input
                            id="license-issuer"
                            value={licenseIssuer}
                            onChange={(e) => setLicenseIssuer(e.target.value)}
                            placeholder="اتحادیه نمایشگاه‌داران خودرو"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="license-expires-at">تاریخ اعتبار پروانه</Label>
                          <Input
                            id="license-expires-at"
                            type="date"
                            value={licenseExpiresAt}
                            onChange={(e) => setLicenseExpiresAt(e.target.value)}
                            dir="ltr"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="national-id">شناسه ملی (در صورت حقوقی بودن)</Label>
                          <Input
                            id="national-id"
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                            className="text-left"
                            dir="ltr"
                            inputMode="numeric"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="national-id">شناسه ملی شرکت *</Label>
                          <Input
                            id="national-id"
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                            className="text-left"
                            dir="ltr"
                            inputMode="numeric"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="company-registration-number">شماره ثبت شرکت *</Label>
                          <Input
                            id="company-registration-number"
                            value={companyRegistrationNumber}
                            onChange={(e) => setCompanyRegistrationNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="economic-code">کد اقتصادی</Label>
                          <Input
                            id="economic-code"
                            value={economicCode}
                            onChange={(e) => setEconomicCode(e.target.value.replace(/\D/g, ''))}
                            className="text-left"
                            dir="ltr"
                            inputMode="numeric"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="authorized-representative">نام نماینده قانونی شرکت *</Label>
                          <Input
                            id="authorized-representative"
                            value={authorizedRepresentativeName}
                            onChange={(e) => setAuthorizedRepresentativeName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="import-license-number">شماره مجوز واردات *</Label>
                          <Input
                            id="import-license-number"
                            value={importLicenseNumber}
                            onChange={(e) => setImportLicenseNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="import-license-issuer">مرجع صادرکننده مجوز واردات *</Label>
                          <Input
                            id="import-license-issuer"
                            value={importLicenseIssuer}
                            onChange={(e) => setImportLicenseIssuer(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="import-license-expires-at">تاریخ اعتبار مجوز واردات</Label>
                          <Input
                            id="import-license-expires-at"
                            type="date"
                            value={importLicenseExpiresAt}
                            onChange={(e) => setImportLicenseExpiresAt(e.target.value)}
                            dir="ltr"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="business-card-number">شماره کارت بازرگانی</Label>
                          <Input
                            id="business-card-number"
                            value={businessCardNumber}
                            onChange={(e) => setBusinessCardNumber(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:col-span-2">
                          <Label htmlFor="represented-brands">برندهای وارداتی *</Label>
                          <Input
                            id="represented-brands"
                            value={representedBrands}
                            onChange={(e) => setRepresentedBrands(e.target.value)}
                            placeholder="تویوتا، کیا، هیوندای"
                            required
                          />
                          <p className="text-[11px] text-muted-foreground">نام برندها را با ویرگول جدا کنید.</p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label htmlFor="business-description">معرفی کوتاه (اختیاری)</Label>
                      <Textarea
                        id="business-description"
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        placeholder="سابقه فعالیت، خدمات و برندهای تحت پوشش"
                        className="min-h-20"
                      />
                    </div>
                  </div>

                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="reg-password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="حداقل ۸ کاراکتر"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="رمز عبور را مجددا وارد کنید"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm font-normal leading-6">
                  <span className="text-gold-dark hover:underline cursor-pointer">قوانین و مقررات</span>
                  {' '}سایت آزاد گذر را مطالعه کرده و آن را می‌پذیرم.
                </Label>
              </div>

              {/* Referral reminder in form */}
              {referralCode && referralVerified && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gold/10 border border-gold/30">
                  <Gift className="size-5 text-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground">تخفیف دعوت فعال شد!</span>
                    <span className="block text-xs text-muted-foreground">کد {referralCode} — {referralName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearReferral}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {registrationError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {registrationError}
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base mt-2" disabled={!acceptTerms || isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {agencyRegistration
                  ? 'ثبت نمایندگی و ارسال برای بررسی'
                  : businessRegistration
                    ? 'ثبت نمایشگاه و ارسال برای بررسی'
                    : `ثبت‌نام به عنوان ${roleData?.title}`}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-2">
                قبلا ثبت‌نام کرده‌اید؟{' '}
                <button type="button" className="text-gold-dark font-medium hover:underline" onClick={() => navigateTo('login')}>
                  ورود
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
