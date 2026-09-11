'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClipboardCheck, Clock, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/stores/auth';
import {
  fetchExpertServiceRequests,
  updateExpertServiceRequest,
  type ServiceRequestRecord,
  type ServiceRequestStatus,
} from '@/lib/service-request-api';
import { cn, toPersianNumber } from '@/lib/utils';

const statusColors: Record<ServiceRequestStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  assigned: 'bg-violet-50 text-violet-700 border-violet-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function ExpertDashboardPage() {
  const currentUser = useAuth((state) => state.currentUser);
  const [items, setItems] = useState<ServiceRequestRecord[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (next: string | null = null) => {
    setLoading(true);
    try {
      const response = await fetchExpertServiceRequests({ nextUrl: next });
      setItems((current) => next ? [...current, ...response.results] : response.results);
      setNextUrl(response.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت مأموریت‌ها انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    assigned: items.filter((item) => item.status === 'assigned').length,
    inProgress: items.filter((item) => item.status === 'in_progress').length,
    completed: items.filter((item) => item.status === 'completed').length,
  }), [items]);

  const changeStatus = async (
    item: ServiceRequestRecord,
    status: 'in_progress' | 'completed',
  ) => {
    const note = status === 'completed'
      ? window.prompt('خلاصه گزارش کارشناسی را وارد کنید:')
      : 'کارشناس انجام خدمت را آغاز کرد.';
    if (status === 'completed' && !note?.trim()) return;
    setActionId(item.id);
    try {
      const updated = await updateExpertServiceRequest(item.id, status, note || '');
      setItems((current) => current.map((record) => record.id === item.id ? updated : record));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تغییر وضعیت انجام نشد.');
    } finally {
      setActionId(null);
    }
  };

  const cards = [
    { label: 'ارجاع‌شده', value: stats.assigned, icon: ClipboardCheck, color: 'text-violet-600 bg-violet-50' },
    { label: 'در حال انجام', value: stats.inProgress, icon: RefreshCw, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'تکمیل‌شده', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="size-11"><AvatarFallback className="bg-cyan-600 text-white font-bold">{currentUser?.avatar || 'ک'}</AvatarFallback></Avatar>
          <div><h1 className="text-xl font-bold">پنل کارشناس خودرو</h1><p className="text-sm text-muted-foreground">{currentUser?.name || 'کارشناس آزادگذر'}</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((card) => { const Icon = card.icon; return <Card key={card.label}><CardContent className="p-5 flex items-center gap-4"><div className={cn('size-11 rounded-xl flex items-center justify-center', card.color)}><Icon className="size-5" /></div><div><p className="text-2xl font-bold">{toPersianNumber(card.value)}</p><p className="text-sm text-muted-foreground">{card.label}</p></div></CardContent></Card>; })}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck className="size-5" />مأموریت‌های من</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {loading && items.length === 0 && <div className="flex justify-center items-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت...</div>}
            {!loading && items.length === 0 && <div className="p-10 text-center"><CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" /><p className="font-medium">مأموریت جدیدی ندارید</p></div>}
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.service_type_label}</p><Badge variant="outline" className={statusColors[item.status]}>{item.status_label}</Badge><Badge variant="secondary">اولویت {item.priority_label}</Badge></div>
                    <p className="text-sm mt-2">{item.contact_name} · <span dir="ltr">{item.contact_phone}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">{item.listing_title || item.vehicle_type}</p>
                    {item.details && <p className="text-xs text-muted-foreground mt-2 leading-6">{item.details}</p>}
                    {item.scheduled_for && <p className="text-xs text-cyan-700 mt-2 flex items-center gap-1"><Clock className="size-3.5" />{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.scheduled_for))}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {item.status === 'assigned' && <Button disabled={actionId === item.id} onClick={() => void changeStatus(item, 'in_progress')}>{actionId === item.id ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}شروع</Button>}
                    {item.status === 'in_progress' && <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={actionId === item.id} onClick={() => void changeStatus(item, 'completed')}>{actionId === item.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}ثبت گزارش و تکمیل</Button>}
                  </div>
                </div>
              </div>
            ))}
            {nextUrl && <div className="text-center pt-2"><Button variant="outline" disabled={loading} onClick={() => void load(nextUrl)}>{loading ? <Loader2 className="size-4 animate-spin" /> : 'نمایش موارد بیشتر'}</Button></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

