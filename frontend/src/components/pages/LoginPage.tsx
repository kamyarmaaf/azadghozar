'use client';

import { useState } from 'react';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Lock, Eye, EyeOff, User, Loader2, CheckCircle2 } from 'lucide-react';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'خطا در ارتباط با سرور';
}

export function LoginPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const {
    loginWithPassword,
    requestSmsLogin,
    confirmSmsLogin,
    isLoading,
  } = useAuth();
  const [loginTab, setLoginTab] = useState<'sms' | 'password'>('password');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!identifier.trim() || !password) {
      setError('لطفاً شماره موبایل یا نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    try {
      const user = await loginWithPassword(identifier.trim(), password);
      navigateTo(user.dashboardPage);
    } catch (loginError) {
      setError(errorMessage(loginError));
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    if (phone.replace(/\D/g, '').length < 10) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }

    try {
      await requestSmsLogin(phone);
      setOtpSent(true);
      setMessage('کد شش‌رقمی برای شما ارسال شد.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const handleSmsLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!otpSent) {
      await handleSendOtp();
      return;
    }
    if (!/^\d{6}$/.test(smsCode)) {
      setError('کد تأیید باید دقیقاً شش رقم باشد');
      return;
    }

    try {
      const user = await confirmSmsLogin(phone, smsCode);
      navigateTo(user.dashboardPage);
    } catch (loginError) {
      setError(errorMessage(loginError));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-premium">
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold text-gradient mb-2">آزادگذر</div>
          <CardTitle className="text-xl">ورود به آزادگذر</CardTitle>
          <CardDescription className="mt-1">
            برای دسترسی به خدمات وارد حساب کاربری شوید
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2 mb-5 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setLoginTab('password'); setError(''); setMessage(''); }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                loginTab === 'password'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-muted-foreground hover:text-brand',
              )}
            >
              <User className="size-4 ml-1.5 inline" />
              رمز عبور
            </button>
            <button
              type="button"
              onClick={() => { setLoginTab('sms'); setError(''); setMessage(''); }}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                loginTab === 'sms'
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-muted-foreground hover:text-brand',
              )}
            >
              <Phone className="size-4 ml-1.5 inline" />
              کد پیامکی
            </button>
          </div>

          {loginTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="identifier">شماره موبایل یا نام کاربری</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="pr-10"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10 pl-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'پنهان‌کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="text-sm text-gold-dark hover:underline self-end"
                onClick={() => navigateTo('forgot-password')}
              >
                فراموشی رمز عبور
              </button>

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                ورود به حساب کاربری
              </Button>
            </form>
          )}

          {loginTab === 'sms' && (
            <form onSubmit={handleSmsLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="pr-10 text-left"
                    dir="ltr"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleSendOtp}
                disabled={isLoading || phone.replace(/\D/g, '').length < 10}
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {otpSent ? 'ارسال مجدد کد' : 'ارسال کد تأیید'}
              </Button>

              {otpSent && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="smsCode">کد تأیید شش‌رقمی</Label>
                  <Input
                    id="smsCode"
                    inputMode="numeric"
                    placeholder="۱۲۳۴۵۶"
                    value={smsCode}
                    onChange={(event) => setSmsCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-12 text-center text-xl tracking-[0.5em] font-mono"
                    dir="ltr"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {otpSent ? 'ورود با کد پیامکی' : 'ادامه'}
              </Button>
            </form>
          )}

          {message && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="size-4 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-5">
            حساب کاربری ندارید؟{' '}
            <button
              type="button"
              className="text-gold-dark font-medium hover:underline"
              onClick={() => navigateTo('register')}
            >
              ثبت‌نام
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
