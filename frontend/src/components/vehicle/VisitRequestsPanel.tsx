'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Clock, Loader2, MapPin, Phone, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  cancelMyListingVisitRequest,
  fetchManagedListingVisitRequests,
  fetchMyListingVisitRequests,
  updateManagedListingVisitRequest,
  type ListingVisitRequest,
  type VisitRequestStatus,
} from '@/lib/visit-request-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const statusColors: Record<VisitRequestStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-600',
  completed: 'border-blue-200 bg-blue-50 text-blue-700',
};

export function VisitRequestsPanel({ mode }: { mode: 'mine' | 'managed' }) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const [items, setItems] = useState<ListingVisitRequest[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (next: string | null = null) => {
    setLoading(true);
    try {
      const response = mode === 'mine'
        ? await fetchMyListingVisitRequests(next)
        : await fetchManagedListingVisitRequests(next);
      setItems((current) => (next ? [...current, ...response.results] : response.results));
      setNextUrl(response.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت درخواست‌های بازدید انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateItem = async (
    item: ListingVisitRequest,
    status: Exclude<VisitRequestStatus, 'pending'>,
  ) => {
    let ownerNote = '';
    if (mode === 'managed' && status === 'rejected') {
      ownerNote = window.prompt('علت رد درخواست را بنویسید:')?.trim() || '';
      if (!ownerNote) return;
    }
    if (status === 'cancelled' && !window.confirm('این درخواست بازدید لغو شود؟')) return;
    setMutatingId(item.id);
    setError('');
    try {
      const updated = mode === 'mine'
        ? await cancelMyListingVisitRequest(item.id)
        : await updateManagedListingVisitRequest(item.id, status, ownerNote);
      setItems((current) => current.map((currentItem) => (
        currentItem.id === updated.id ? updated : currentItem
      )));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تغییر وضعیت انجام نشد.');
    } finally {
      setMutatingId('');
    }
  };

  if (loading && items.length === 0) {
    return <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت درخواست‌های بازدید...</div>;
  }

  if (error && items.length === 0) {
    return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<Button size="sm" variant="outline" className="mr-3" onClick={() => void load()}>تلاش دوباره</Button></div>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <CalendarDays className="mx-auto mb-3 size-12 text-muted-foreground/35" />
          <p className="font-medium">درخواست بازدیدی وجود ندارد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'mine' ? 'درخواست‌هایی که برای خودروها ثبت کنید اینجا نمایش داده می‌شوند.' : 'درخواست خریداران برای آگهی‌های شما اینجا نمایش داده می‌شود.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const scheduled = new Date(item.scheduled_for);
        return (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="font-bold hover:text-gold-dark"
                    onClick={() => navigateTo('vehicle-details', { vehicleId: item.listing_id })}
                  >
                    {item.listing_title}
                  </button>
                  <Badge variant="outline" className={statusColors[item.status]}>{item.status_label}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(scheduled)}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5" />{new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(scheduled)}</span>
                  <span className="flex items-center gap-1"><MapPin className="size-3.5" />{item.listing_city}</span>
                  {mode === 'managed' && <span className="flex items-center gap-1" dir="ltr"><Phone className="size-3.5" />{item.contact_phone}</span>}
                </div>
                {mode === 'managed' && <p className="text-xs text-muted-foreground">متقاضی: {item.contact_name}</p>}
                {item.owner_note && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6">پاسخ مالک: {item.owner_note}</p>}
                <p className="text-[11px] text-muted-foreground">کد پیگیری: <span dir="ltr">{item.id.slice(0, 8)}</span></p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {mode === 'mine' && ['pending', 'confirmed'].includes(item.status) && (
                  <Button variant="outline" size="sm" disabled={mutatingId === item.id} onClick={() => void updateItem(item, 'cancelled')}>
                    {mutatingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} لغو درخواست
                  </Button>
                )}
                {mode === 'managed' && item.status === 'pending' && (
                  <>
                    <Button size="sm" disabled={mutatingId === item.id} onClick={() => void updateItem(item, 'confirmed')}><Check className="size-4" /> تأیید</Button>
                    <Button variant="destructive" size="sm" disabled={mutatingId === item.id} onClick={() => void updateItem(item, 'rejected')}><X className="size-4" /> رد</Button>
                  </>
                )}
                {mode === 'managed' && item.status === 'confirmed' && (
                  <>
                    <Button size="sm" disabled={mutatingId === item.id} onClick={() => void updateItem(item, 'completed')}><Check className="size-4" /> انجام شد</Button>
                    <Button variant="outline" size="sm" disabled={mutatingId === item.id} onClick={() => void updateItem(item, 'cancelled')}><X className="size-4" /> لغو</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {nextUrl && (
        <div className="text-center">
          <Button variant="outline" disabled={loading} onClick={() => void load(nextUrl)}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : `نمایش ${toPersianNumber(20)} مورد بعدی`}
          </Button>
        </div>
      )}
    </div>
  );
}
