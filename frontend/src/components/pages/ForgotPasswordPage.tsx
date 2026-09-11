'use client';

import { useState } from 'react';
import { confirmPasswordReset, requestPasswordResetOtp } from '@/lib/account-api';
import { useNavigation } from '@/stores/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, Lock, Phone, KeyRound, CheckCircle2, Mail,
} from 'lucide-react';

type Step = 'request' | 'verify' | 'success';

export function ForgotPasswordPage() {
  const navigateTo = useNavigation((s) => s.navigateTo);
  const [step, setStep] = useState<Step>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const startCountdown = (seconds = 120) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toPersianNum = (n: number | string) =>
    n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${toPersianNum(min)}:${toPersianNum(sec.toString().padStart(2, '0'))}`;
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 10) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await requestPasswordResetOtp(phone);
      setStep('verify');
      startCountdown(result.resendIn);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ارسال کد بازیابی ناموفق بود');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('لطفاً کد تایید ۶ رقمی را وارد کنید');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }

    setSubmitLoading(true);
    try {
      await confirmPasswordReset({
        phoneNumber: phone,
        otp: code,
        newPassword,
        passwordConfirmation: confirmPassword,
      });
      setStep('success');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'تغییر رمز عبور ناموفق بود');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    setError('');
    try {
      const result = await requestPasswordResetOtp(phone);
      startCountdown(result.resendIn);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ارسال مجدد کد ناموفق بود');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="shadow-premium">
          {/* Step: Request */}
          {step === 'request' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="text-2xl font-bold text-gradient mb-2">آزادگذر</div>
                <CardTitle className="text-xl">فراموشی رمز عبور</CardTitle>
                <CardDescription className="mt-1">
                  شماره موبایل خود را وارد کنید تا کد بازیابی ارسال شود
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="forgot-phone">شماره موبایل</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="forgot-phone"
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pr-10"
                        dir="ltr"
                        type="tel"
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={submitLoading} className="w-full h-11 text-base mt-2">
                    {submitLoading ? 'در حال ارسال...' : 'ارسال کد بازیابی'}
                  </Button>
                </form>

                <div className="flex items-center gap-2 mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Mail className="size-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    کد بازیابی به شماره موبایل شما ارسال خواهد شد.
                    اگر به موبایل خود دسترسی ندارید، با پشتیبانی تماس بگیرید.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors mt-4 mx-auto"
                >
                  <ArrowRight className="size-4" />
                  بازگشت به ورود
                </button>
              </CardContent>
            </>
          )}

          {/* Step: Verify Code & New Password */}
          {step === 'verify' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                  <KeyRound className="size-7 text-primary" />
                </div>
                <CardTitle className="text-xl">تایید هویت و بازنشانی رمز</CardTitle>
                <CardDescription className="mt-1">
                  کد ارسال‌شده به موبایل خود را وارد کرده و رمز عبور جدید انتخاب کنید
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
                  {/* Verification Code */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="verify-code">کد تایید</Label>
                    <Input
                      id="verify-code"
                      placeholder="۱۲۳۴۵۶"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                      dir="ltr"
                      maxLength={6}
                      autoFocus
                    />
                    {countdown > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        ارسال مجدد تا <span className="font-mono text-brand font-medium">{formatCountdown(countdown)}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-xs text-gold-dark hover:underline disabled:opacity-50"
                      >
                        {resendLoading ? 'در حال ارسال...' : 'ارسال مجدد کد تایید'}
                      </button>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="new-password">رمز عبور جدید</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="رمز عبور جدید خود را وارد کنید"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10 pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="رمز عبور جدید را مجدداً وارد کنید"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10 pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={submitLoading} className="w-full h-11 text-base mt-2">
                    {submitLoading ? 'در حال تغییر رمز...' : 'تغییر رمز عبور'}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => { setStep('request'); setError(''); setCode(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors mt-4 mx-auto"
                >
                  <ArrowRight className="size-4" />
                  بازگشت به مرحله قبل
                </button>
              </CardContent>
            </>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 p-3 rounded-full bg-green-100 w-fit">
                  <CheckCircle2 className="size-7 text-green-500" />
                </div>
                <CardTitle className="text-xl text-green-700">رمز عبور با موفقیت تغییر کرد</CardTitle>
                <CardDescription className="mt-1">
                  اکنون می‌توانید با رمز عبور جدید وارد حساب کاربری خود شوید
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-3">
                <Button
                  onClick={() => navigateTo('login')}
                  className="w-full h-11 text-base"
                >
                  ورود به حساب کاربری
                </Button>

                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="text-sm text-muted-foreground hover:text-brand transition-colors"
                >
                  بازگشت به صفحه اصلی
                </button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
