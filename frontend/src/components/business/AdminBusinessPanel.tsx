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

function missingVerificationDocuments(
  business: BusinessProfile,
): string[] {
  const common = [
    [business.phone, 'تلفن ثابت'],
    [business.province, 'استان'],
    [business.city, 'شهر'],
    [business.address, 'آدرس کامل'],
    [business.postal_code, 'کد پستی'],
  ] as const;
  const specific = business.kind === 'gallery'
    ? [
        [business.license_number, 'شماره پروانه کسب نمایشگاه'],
        [business.license_issuer, 'مرجع صادرکننده پروانه کسب'],
      ] as const
    : [
        [business.national_id, 'شناسه ملی شرکت'],
        [business.company_registration_number, 'شماره ثبت شرکت'],
        [business.authorized_representative_name, 'نماینده قانونی شرکت'],
        [business.import_license_number, 'شماره مجوز واردات'],
        [business.import_license_issuer, 'مرجع صادرکننده مجوز واردات'],
        [business.represented_brands?.length ? 'ok' : '', 'برندهای وارداتی'],
      ] as const;
  return [...common, ...specific]
    .filter(([value]) => !String(value ?? '').trim())
    .map(([, label]) => label);
}

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
        fetchAdminSubscriptions('pending', kind),
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
      const page = await fetchAdminSubscriptions('pending', kind, subscriptionNext);
      setSubscriptions((current) => {
        const seen = new Set(current.map((subscription) => subscription.id));
        return [...current, ...page.results.filter((subscription) => !seen.has(subscription.id))];
      });
      setSubscriptionNext(page.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت ادامه درخواست‌های اشتراک انجام نشد.');
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
    if (action === 'approve' && !window.confirm('با تأیید، اشتراک خدمات این کسب‌وکار فعال می‌شود و نوع حساب آن تغییر نمی‌کند. آیا ادامه می‌دهید؟')) return;
    let note = '';
    if (action === 'reject') {
      const answer = window.prompt('دلیل رد درخواست اشتراک را وارد کنید:');
      if (answer === null) return;
      note = answer.trim();
      if (!note) {
        setError('برای رد درخواست اشتراک، ثبت دلیل الزامی است.');
        return;
      }
    }
    setActionId(`subscription-${id}`);
    try {
      await reviewSubscription(id, action, note);
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
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-5 text-amber-600" />
            بررسی و تأیید مدارک {kind === 'agency' ? 'شرکت‌های واردکننده' : 'نمایشگاه‌ها'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.filter((business) => business.verification_status === 'pending').length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">پرونده‌ای در انتظار تأیید مدارک نیست.</p>
          ) : (
            <div className="divide-y">
              {businesses
                .filter((business) => business.verification_status === 'pending')
                .map((business) => {
                  const missingDocuments = missingVerificationDocuments(business);
                  return (
                    <div key={`verification-${business.id}`} className="space-y-3 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{business.name}</p>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">در انتظار تأیید مدارک</Badge>
                            <Badge variant="outline">{kind === 'agency' ? 'شرکت واردکننده' : 'نمایشگاه خودرو'}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[business.province, business.city, business.phone].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <Button
                          disabled={actionId !== null || missingDocuments.length > 0}
                          onClick={() => void decideBusiness(business.id, 'verify')}
                        >
                          {actionId === `business-${business.id}` ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          تأیید مدارک و فعال‌سازی
                        </Button>
                      </div>

                      {kind === 'gallery' ? (
                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                          <span className="rounded-md bg-muted px-2 py-2">پروانه کسب: {business.license_number || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">مرجع صادرکننده: {business.license_issuer || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">کد پستی: {business.postal_code || 'ثبت نشده'}</span>
                        </div>
                      ) : (
                        <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                          <span className="rounded-md bg-muted px-2 py-2">شناسه ملی: {business.national_id || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">شماره ثبت: {business.company_registration_number || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">مجوز واردات: {business.import_license_number || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">مرجع مجوز: {business.import_license_issuer || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">نماینده قانونی: {business.authorized_representative_name || 'ثبت نشده'}</span>
                          <span className="rounded-md bg-muted px-2 py-2">برندها: {business.represented_brands?.join('، ') || 'ثبت نشده'}</span>
                        </div>
                      )}

                      {missingDocuments.length > 0 && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-6 text-red-700">
                          امکان تأیید وجود ندارد؛ این موارد تکمیل نشده‌اند: {missingDocuments.join('، ')}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
          <CardHeader><CardTitle className="text-lg">درخواست‌های اشتراک {kind === 'agency' ? 'نمایندگی‌ها' : 'نمایشگاه‌ها'}</CardTitle></CardHeader>
          <CardContent>
            <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">اشتراک فقط امکانات تجاری حساب را فعال می‌کند و نوع نمایشگاه یا نمایندگی را تغییر نمی‌دهد. اتصال پرداخت آنلاین هنوز وجود ندارد.</p>
            {subscriptions.length === 0 && !error ? (
              <p className="py-6 text-center text-sm text-muted-foreground">درخواست جدیدی وجود ندارد.</p>
            ) : (
              <div className="divide-y">
                {subscriptions.map((item) => {
                  const businessVerified = item.business_verification_status === 'verified';
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.business_name}</p>
                          <Badge variant="outline">
                            احراز کسب‌وکار: {statusLabels[item.business_verification_status]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.plan_label}</p>
                        {!businessVerified && (
                          <p className="mt-1 text-xs text-amber-700">ابتدا مدارک همین نوع کسب‌وکار را تأیید کنید.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={actionId !== null || !businessVerified}
                          onClick={() => void decideSubscription(item.id, 'approve')}
                        >
                          <CheckCircle2 className="size-4" /> تأیید
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          disabled={actionId !== null}
                          onClick={() => void decideSubscription(item.id, 'reject')}
                        >
                          <XCircle className="size-4" /> رد
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {subscriptionNext && <div className="pt-4 text-center"><Button variant="outline" disabled={loadingMore !== null} onClick={() => void loadMoreSubscriptions()}>{loadingMore === 'subscription' ? <Loader2 className="size-4 animate-spin" /> : 'نمایش درخواست‌های بعدی'}</Button></div>}
          </CardContent>
        </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="size-5" /> {kind === 'gallery' ? 'نمایشگاه‌ها' : 'نمایندگی‌ها'}</CardTitle></CardHeader>
        <CardContent>
          {businesses.length === 0 && !error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">موردی ثبت نشده است.</p>
          ) : (
            <div className="divide-y">
              {businesses.map((business) => (
                <div key={business.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{business.name}</p>
                      <Badge variant="outline">{statusLabels[business.verification_status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[business.province, business.city, business.phone].filter(Boolean).join(' · ') || 'اطلاعات تماس ثبت نشده'}
                    </p>
                    {business.address && <p className="mt-1 text-xs text-muted-foreground">آدرس: {business.address}</p>}
                    {kind === 'gallery' ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-muted px-2 py-1">پروانه کسب: {business.license_number || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">مرجع صادرکننده: {business.license_issuer || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">کد پستی: {business.postal_code || 'ثبت نشده'}</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-muted px-2 py-1">شناسه ملی: {business.national_id || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">شماره ثبت: {business.company_registration_number || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">مجوز واردات: {business.import_license_number || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">نماینده قانونی: {business.authorized_representative_name || 'ثبت نشده'}</span>
                        <span className="rounded-md bg-muted px-2 py-1">برندها: {business.represented_brands?.join('، ') || 'ثبت نشده'}</span>
                      </div>
                    )}
                    {business.verification_note && (
                      <p className="mt-2 text-xs text-red-600">توضیح مدیریت: {business.verification_note}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={actionId !== null || business.verification_status === 'verified'}
                      onClick={() => void decideBusiness(business.id, 'verify')}
                    >
                      <CheckCircle2 className="size-4" /> تأیید
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      disabled={actionId !== null}
                      onClick={() => void decideBusiness(
                        business.id,
                        business.verification_status === 'verified' ? 'suspend' : 'reject',
                      )}
                    >
                      <XCircle className="size-4" /> {business.verification_status === 'verified' ? 'تعلیق' : 'رد'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {businessNext && <div className="pt-4 text-center"><Button variant="outline" disabled={loadingMore !== null} onClick={() => void loadMoreBusinesses()}>{loadingMore === 'business' ? <Loader2 className="size-4 animate-spin" /> : `نمایش ${kind === 'agency' ? 'نمایندگی‌های' : 'نمایشگاه‌های'} بعدی`}</Button></div>}
        </CardContent>
      </Card>
    </div>
  );
}
