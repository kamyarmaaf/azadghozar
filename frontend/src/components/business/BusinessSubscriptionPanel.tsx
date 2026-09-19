'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, CircleX, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchBusinessDashboard,
  requestBusinessSubscription,
  type BusinessDashboard,
  type BusinessSubscription,
} from '@/lib/business-api';
import { useAuth } from '@/stores/auth';

export function BusinessSubscriptionPanel() {
  const access = useAuth((state) => state.currentUser?.businessAccess);
  const [dashboard, setDashboard] = useState<BusinessDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<BusinessSubscription['plan'] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await fetchBusinessDashboard());
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت اشتراک انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const requestPlan = async (plan: BusinessSubscription['plan']) => {
    setSaving(plan);
    try {
      await requestBusinessSubscription(plan);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ثبت درخواست انجام نشد.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin" /></div>;
  if (!access?.is_owner) return <Card className="p-8 text-center text-sm text-muted-foreground">مدیریت اشتراک فقط برای مالک کسب‌وکار فعال است.</Card>;

  const subscription = dashboard?.subscription;
  const verificationStatus = dashboard?.business.verification_status ?? 'pending';
  const businessKind = dashboard?.business.kind ?? access.kind;
  const availablePlans: ReadonlyArray<readonly [BusinessSubscription['plan'], string]> = businessKind === 'agency'
    ? ([
        ['agency_monthly', 'اشتراک یک‌ماهه نمایندگی'],
        ['agency_yearly', 'اشتراک یک‌ساله نمایندگی'],
      ] as const)
    : ([
        ['gallery_monthly', 'اشتراک یک‌ماهه نمایشگاه'],
        ['gallery_yearly', 'اشتراک یک‌ساله نمایشگاه'],
      ] as const);
  const verificationPresentation = {
    pending: {
      label: 'در انتظار بررسی',
      icon: Clock,
      iconClassName: 'text-amber-600',
    },
    verified: {
      label: 'تأییدشده',
      icon: CheckCircle2,
      iconClassName: 'text-emerald-600',
    },
    rejected: {
      label: 'رد شده؛ اطلاعات را اصلاح کنید',
      icon: CircleX,
      iconClassName: 'text-red-600',
    },
    suspended: {
      label: 'تعلیق شده',
      icon: Ban,
      iconClassName: 'text-slate-600',
    },
  }[verificationStatus];
  const VerificationIcon = verificationPresentation.icon;
  return (
    <div className="space-y-5">
      <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">اشتراک فقط امکانات تجاری حساب را فعال می‌کند و نوع نمایشگاه یا نمایندگی را تغییر نمی‌دهد. درگاه پرداخت هنوز فعال نیست.</p>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Card>
        <CardHeader><CardTitle className="text-lg">وضعیت احراز کسب‌وکار</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          <VerificationIcon className={`size-6 ${verificationPresentation.iconClassName}`} />
          <div><p className="font-medium">{verificationPresentation.label}</p>{dashboard?.business.verification_note && <p className="text-sm text-muted-foreground">{dashboard.business.verification_note}</p>}</div>
        </CardContent>
      </Card>
      {subscription ? (
        <Card><CardHeader><CardTitle className="text-lg">اشتراک خدمات کسب‌وکار</CardTitle></CardHeader><CardContent className="space-y-2"><Badge>{subscription.status_label}</Badge><p className="text-sm">{subscription.plan_label}</p>{subscription.ends_at && <p className="text-sm text-muted-foreground">اعتبار تا {new Date(subscription.ends_at).toLocaleDateString('fa-IR')}</p>}{subscription.admin_note && <p className="text-sm text-muted-foreground">یادداشت مدیر: {subscription.admin_note}</p>}</CardContent></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {availablePlans.map(([plan, title]) => (
            <Card key={plan}><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><p className="mb-5 text-sm leading-6 text-muted-foreground">پس از احراز کسب‌وکار، درخواست اشتراک بدون تغییر نوع حساب برای مدیریت ارسال می‌شود.</p><Button className="w-full" disabled={Boolean(saving) || dashboard?.business.verification_status !== 'verified'} onClick={() => void requestPlan(plan)}>{saving === plan && <Loader2 className="size-4 animate-spin" />} ثبت درخواست</Button></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
