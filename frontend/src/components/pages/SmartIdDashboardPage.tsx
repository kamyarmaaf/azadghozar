'use client';

import { useEffect, useState } from 'react';
import { Car, CheckCircle2, ClipboardCheck, FileSearch, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardError, DashboardHeader, DashboardStats } from '@/components/dashboard/DashboardLayout';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { fetchVehicleListings, type PublicListingSummary } from '@/lib/listing-api';
import { toPersianNumber } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useNavigation } from '@/stores/navigation';

export function SmartIdDashboardPage() {
  const currentUser = useAuth((state) => state.currentUser);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const { summary, loading: summaryLoading, error: summaryError, reload } = useDashboardSummary();
  const [queue, setQueue] = useState<PublicListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchVehicleListings({ inspected: false, pageSize: 25, summary: true, signal: controller.signal })
        .then((page) => {
          setQueue(page.results);
          setError('');
        })
        .catch((requestError) => {
          if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت صف خودروها انجام نشد.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (currentUser?.role !== 'smart_id_operator') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card><CardContent className="py-12 text-center"><ShieldCheck className="mx-auto mb-3 size-12 text-teal-600" /><h1 className="text-lg font-bold">دسترسی اپراتور لازم است</h1><p className="mt-2 text-sm text-muted-foreground">این صفحه فقط برای اپراتور شناسنامه هوشمند خودرو قابل مشاهده است.</p></CardContent></Card>
      </div>
    );
  }

  const metrics = summary?.metrics ?? {};
  const stats = [
    { label: 'خودروهای فعال', value: metrics.active_listing_count, icon: Car, color: 'bg-blue-50 text-blue-600' },
    { label: 'دارای تأیید بازرسی', value: metrics.inspected_listing_count, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'فاقد تأیید بازرسی', value: metrics.uninspected_listing_count, icon: FileSearch, color: 'bg-amber-50 text-amber-700' },
    { label: 'درخواست بازرسی باز', value: metrics.inspection_waiting_count, icon: ClipboardCheck, color: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="bg-muted/20 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader title="پنل شناسنامه هوشمند" subtitle={`${currentUser.name}؛ پایش وضعیت بازرسی خودروهای فعال`} avatar={currentUser.avatar} badge="اپراتور" />
        <DashboardError message={summaryError || error} onRetry={reload} />
        <DashboardStats items={stats} loading={summaryLoading} />
        <Card>
          <CardContent className="p-0">
            <div className="border-b p-5"><h2 className="font-bold">خودروهای فعال فاقد تأیید بازرسی</h2><p className="mt-1 text-xs text-muted-foreground">این فهرست از داده واقعی آگهی‌ها ساخته می‌شود و فعلاً فقط برای مشاهده است.</p></div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت صف...</div>
            ) : queue.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 size-10 text-emerald-500" />خودروی فعالی بدون تأیید بازرسی وجود ندارد.</div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead className="text-right">خودرو</TableHead><TableHead className="text-right">سال</TableHead><TableHead className="text-right">شهر</TableHead><TableHead className="text-right">نوع پلاک</TableHead><TableHead className="text-right">عملیات</TableHead></TableRow></TableHeader>
                <TableBody>{queue.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.brand_name} {item.model_name} {item.trim_name}</TableCell><TableCell>{toPersianNumber(item.production_year)}</TableCell><TableCell>{item.city}</TableCell><TableCell><Badge variant="outline">{item.plate_type_label}</Badge></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => navigateTo('vehicle-details', { vehicleId: item.id })}>بررسی اطلاعات</Button></TableCell></TableRow>)}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
