'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchBusinessDashboard,
  requestAgencySubscription,
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
      await requestAgencySubscription(plan);
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
  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Card>
        <CardHeader><CardTitle className="text-lg">وضعیت احراز کسب‌وکار</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          {dashboard?.business.verification_status === 'verified' ? <CheckCircle2 className="size-6 text-emerald-600" /> : <Clock className="size-6 text-amber-600" />}
          <div><p className="font-medium">{dashboard?.business.verification_status === 'verified' ? 'تأییدشده' : 'در انتظار بررسی'}</p>{dashboard?.business.verification_note && <p className="text-sm text-muted-foreground">{dashboard.business.verification_note}</p>}</div>
        </CardContent>
      </Card>
      {subscription ? (
        <Card><CardHeader><CardTitle className="text-lg">اشتراک نمایندگی</CardTitle></CardHeader><CardContent className="space-y-2"><Badge>{subscription.status_label}</Badge><p className="text-sm">{subscription.plan_label}</p>{subscription.ends_at && <p className="text-sm text-muted-foreground">اعتبار تا {new Date(subscription.ends_at).toLocaleDateString('fa-IR')}</p>}{subscription.admin_note && <p className="text-sm text-muted-foreground">یادداشت مدیر: {subscription.admin_note}</p>}</CardContent></Card>
      ) : dashboard?.business.kind === 'agency' ? (
        <Card className="p-8 text-center"><CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600" /><p className="font-medium">حساب شما نمایندگی است.</p></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {([
            ['agency_monthly', 'اشتراک یک‌ماهه'],
            ['agency_yearly', 'اشتراک یک‌ساله'],
          ] as const).map(([plan, title]) => (
            <Card key={plan}><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><p className="mb-5 text-sm leading-6 text-muted-foreground">پس از ثبت، مدیر مدارک را بررسی می‌کند و حساب نمایشگاه به نمایندگی ارتقا می‌یابد.</p><Button className="w-full" disabled={Boolean(saving) || dashboard?.business.verification_status !== 'verified'} onClick={() => void requestPlan(plan)}>{saving === plan && <Loader2 className="size-4 animate-spin" />} ثبت درخواست</Button></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
