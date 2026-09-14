'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchAdminBusinesses,
  fetchAdminSubscriptions,
  reviewBusiness,
  reviewSubscription,
  type BusinessKind,
  type BusinessProfile,
  type BusinessSubscription,
} from '@/lib/business-api';

const statusLabels: Record<BusinessProfile['verification_status'], string> = {
  pending: 'در انتظار بررسی',
  verified: 'تأییدشده',
  rejected: 'ردشده',
  suspended: 'معلق',
};

export function AdminBusinessPanel({ kind }: { kind: BusinessKind }) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<BusinessSubscription[]>([]);
  const [businessNext, setBusinessNext] = useState<string | null>(null);
  const [subscriptionNext, setSubscriptionNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<'business' | 'subscription' | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [businessPage, subscriptionPage] = await Promise.all([
        fetchAdminBusinesses({ kind }),
        kind === 'agency'
          ? fetchAdminSubscriptions('pending')
          : Promise.resolve({ next: null, previous: null, results: [] }),
      ]);
      setBusinesses(businessPage.results);
      setSubscriptions(subscriptionPage.results);
      setBusinessNext(businessPage.next);
      setSubscriptionNext(subscriptionPage.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت صف مدیریت انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [kind]);

  const loadMoreBusinesses = async () => {
    if (!businessNext || loadingMore) return;
    setLoadingMore('business');
    try {
      const page = await fetchAdminBusinesses({ kind, nextUrl: businessNext });
      setBusinesses((current) => {
        const seen = new Set(current.map((business) => business.id));
        return [...current, ...page.results.filter((business) => !seen.has(business.id))];
      });
      setBusinessNext(page.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت ادامه نمایشگاه‌ها انجام نشد.');
    } finally {
      setLoadingMore(null);
    }
  };

  const loadMoreSubscriptions = async () => {
    if (!subscriptionNext || loadingMore) return;
    setLoadingMore('subscription');
    try {
      const page = await fetchAdminSubscriptions('pending', subscriptionNext);
      setSubscriptions((current) => {
        const seen = new Set(current.map((subscription) => subscription.id));
        return [...current, ...page.results.filter((subscription) => !seen.has(subscription.id))];
      });
      setSubscriptionNext(page.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت ادامه درخواست‌های ارتقا انجام نشد.');
    } finally {
      setLoadingMore(null);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const decideBusiness = async (id: number, action: 'verify' | 'reject' | 'suspend') => {
    let note = '';
    if (action !== 'verify') {
      const answer = window.prompt('دلیل رد یا تعلیق را وارد کنید:');
      if (answer === null) return;
      note = answer.trim();
      if (!note) {
        setError('برای رد یا تعلیق، ثبت دلیل الزامی است.');
        return;
      }
    }
    setActionId(`business-${id}`);
    try {
      const updated = await reviewBusiness(id, action, note);
      setBusinesses((current) => current.map((item) => item.id === id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'عملیات انجام نشد.');
    } finally {
      setActionId(null);
    }
  };

  const decideSubscription = async (id: number, action: 'approve' | 'reject') => {
    if (action === 'approve' && !window.confirm('با تأیید، نقش نمایندگی و اشتراک فعال می‌شود. پرداخت آنلاین هنوز متصل نیست؛ آیا ادامه می‌دهید؟')) return;
    setActionId(`subscription-${id}`);
    try {
      await reviewSubscription(id, action);
      setSubscriptions((current) => current.filter((item) => item.id !== id));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'عملیات انجام نشد.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void load()}>بارگیری دوباره</Button></div>}
      {kind === 'agency' && (
        <Card>
          <CardHeader><CardTitle className="text-lg">درخواست‌های ارتقا به نمایندگی</CardTitle></CardHeader>
          <CardContent>
            <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">تأیید این درخواست، نقش و اشتراک نمایندگی را بلافاصله فعال می‌کند؛ اتصال پرداخت آنلاین هنوز وجود ندارد.</p>
            {subscriptions.length === 0 && !error ? <p className="py-6 text-center text-sm text-muted-foreground">درخواست جدیدی وجود ندارد.</p> : <div className="divide-y">{subscriptions.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{item.business_name}</p><p className="text-sm text-muted-foreground">{item.plan_label}</p></div><div className="flex gap-2"><Button size="sm" disabled={actionId !== null} onClick={() => void decideSubscription(item.id, 'approve')}><CheckCircle2 className="size-4" /> تأیید</Button><Button size="sm" variant="outline" className="text-red-600" disabled={actionId !== null} onClick={() => void decideSubscription(item.id, 'reject')}><XCircle className="size-4" /> رد</Button></div></div>)}</div>}
            {subscriptionNext && <div className="pt-4 text-center"><Button variant="outline" disabled={loadingMore !== null} onClick={() => void loadMoreSubscriptions()}>{loadingMore === 'subscription' ? <Loader2 className="size-4 animate-spin" /> : 'نمایش درخواست‌های بعدی'}</Button></div>}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="size-5" /> {kind === 'gallery' ? 'نمایشگاه‌ها' : 'نمایندگی‌ها'}</CardTitle></CardHeader>
        <CardContent>
          {businesses.length === 0 && !error ? <p className="py-8 text-center text-sm text-muted-foreground">موردی ثبت نشده است.</p> : <div className="divide-y">{businesses.map((business) => <div key={business.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><div className="flex items-center gap-2"><p className="font-medium">{business.name}</p><Badge variant="outline">{statusLabels[business.verification_status]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{business.city || business.province || 'بدون موقعیت'} · {business.phone || 'بدون تلفن'}</p>{business.verification_note && <p className="mt-1 text-xs text-red-600">{business.verification_note}</p>}</div><div className="flex gap-2"><Button size="sm" disabled={actionId !== null || business.verification_status === 'verified'} onClick={() => void decideBusiness(business.id, 'verify')}><CheckCircle2 className="size-4" /> تأیید</Button><Button size="sm" variant="outline" className="text-red-600" disabled={actionId !== null} onClick={() => void decideBusiness(business.id, business.verification_status === 'verified' ? 'suspend' : 'reject')}><XCircle className="size-4" /> {business.verification_status === 'verified' ? 'تعلیق' : 'رد'}</Button></div></div>)}</div>}
          {businessNext && <div className="pt-4 text-center"><Button variant="outline" disabled={loadingMore !== null} onClick={() => void loadMoreBusinesses()}>{loadingMore === 'business' ? <Loader2 className="size-4 animate-spin" /> : 'نمایش نمایشگاه‌ها و نمایندگی‌های بعدی'}</Button></div>}
        </CardContent>
      </Card>
    </div>
  );
}
