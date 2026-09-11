'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  fetchMyServiceRequests,
  type ServiceRequestRecord,
  type ServiceRequestType,
} from '@/lib/service-request-api';
import { toPersianNumber } from '@/lib/utils';

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  assigned: 'bg-violet-50 text-violet-700 border-violet-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function MyServiceRequestsPanel({
  serviceType,
}: {
  serviceType?: ServiceRequestType;
}) {
  const [items, setItems] = useState<ServiceRequestRecord[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (next: string | null = null) => {
    setLoading(true);
    try {
      const response = await fetchMyServiceRequests({
        serviceType,
        nextUrl: next,
      });
      setItems((current) => (next ? [...current, ...response.results] : response.results));
      setNextUrl(response.next);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت درخواست‌ها انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading && items.length === 0) {
    return <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت درخواست‌ها...</div>;
  }

  if (error && items.length === 0) {
    return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<Button size="sm" variant="outline" className="mr-3" onClick={() => void load()}>تلاش دوباره</Button></div>;
  }

  if (items.length === 0) {
    return <Card><CardContent className="p-8 text-center"><ClipboardCheck className="size-12 text-muted-foreground mx-auto mb-3" /><p className="font-medium">درخواستی ثبت نشده است</p><p className="text-sm text-muted-foreground mt-1">درخواست‌های ثبت‌شده شما همراه با وضعیت پیگیری اینجا نمایش داده می‌شوند.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{item.service_type_label}</p>
                <Badge variant="outline" className={statusColors[item.status]}>{item.status_label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{item.vehicle_type} · کد پیگیری: <span dir="ltr">{item.id.slice(0, 8)}</span></p>
              {item.assigned_expert_name && <p className="text-xs text-muted-foreground mt-1">کارشناس: {item.assigned_expert_name}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('fa-IR').format(new Date(item.created_at))}</p>
          </CardContent>
        </Card>
      ))}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {nextUrl && <div className="text-center"><Button variant="outline" disabled={loading} onClick={() => void load(nextUrl)}>{loading ? <Loader2 className="size-4 animate-spin" /> : `نمایش ${toPersianNumber(20)} مورد بعدی`}</Button></div>}
    </div>
  );
}

