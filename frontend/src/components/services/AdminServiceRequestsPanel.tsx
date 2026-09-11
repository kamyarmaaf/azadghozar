'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  fetchAdminServiceRequests,
  fetchExpertOptions,
  updateAdminServiceRequest,
  type ExpertOption,
  type ServiceRequestRecord,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from '@/lib/service-request-api';
import { toPersianNumber } from '@/lib/utils';

const statuses: Array<{ value: '' | ServiceRequestStatus; label: string }> = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'new', label: 'جدید' },
  { value: 'reviewing', label: 'در حال بررسی' },
  { value: 'assigned', label: 'ارجاع‌شده' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'completed', label: 'تکمیل‌شده' },
  { value: 'cancelled', label: 'لغوشده' },
];

const serviceTypes: Array<{ value: '' | ServiceRequestType; label: string }> = [
  { value: '', label: 'همه خدمات' },
  { value: 'inspection', label: 'بازرسی' },
  { value: 'transfer', label: 'انتقال مالکیت' },
  { value: 'transport', label: 'حمل‌ونقل' },
  { value: 'consultation', label: 'مشاوره' },
  { value: 'document_check', label: 'استعلام مدارک' },
  { value: 'status_check', label: 'استعلام وضعیت' },
  { value: 'buy_assist', label: 'همراهی خرید' },
  { value: 'sell_assist', label: 'همراهی فروش' },
];

const statusColors: Record<ServiceRequestStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  assigned: 'bg-violet-50 text-violet-700 border-violet-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function AdminServiceRequestsPanel() {
  const [items, setItems] = useState<ServiceRequestRecord[]>([]);
  const [experts, setExperts] = useState<ExpertOption[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'' | ServiceRequestStatus>('new');
  const [selectedType, setSelectedType] = useState<'' | ServiceRequestType>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (next: string | null = null) => {
    setLoading(true);
    try {
      const response = await fetchAdminServiceRequests({
        status: selectedStatus || undefined,
        serviceType: selectedType || undefined,
        query,
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
  }, [query, selectedStatus, selectedType]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchExpertOptions()
        .then((response) => setExperts(response.results))
        .catch(() => setExperts([]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateItem = async (
    item: ServiceRequestRecord,
    changes: Parameters<typeof updateAdminServiceRequest>[1],
  ) => {
    setActionId(item.id);
    try {
      const updated = await updateAdminServiceRequest(item.id, changes);
      setItems((current) => current.map((record) => record.id === item.id ? updated : record));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'به‌روزرسانی درخواست انجام نشد.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-lg">مدیریت درخواست‌های خدمات</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام یا موبایل" className="pr-9" />
            </div>
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value as '' | ServiceRequestType)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {serviceTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as '' | ServiceRequestStatus)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loading && items.length === 0 && <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت...</div>}
        {!loading && items.length === 0 && <div className="p-10 text-center"><CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" /><p className="font-medium">درخواستی با این فیلتر وجود ندارد</p></div>}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="text-right">خدمت و متقاضی</TableHead><TableHead className="text-right">خودرو</TableHead><TableHead className="text-right">وضعیت</TableHead><TableHead className="text-right">کارشناس</TableHead><TableHead className="text-right">عملیات</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><p className="font-medium text-sm">{item.service_type_label}</p><p className="text-xs text-muted-foreground mt-1">{item.contact_name} · <span dir="ltr">{item.contact_phone}</span></p><p className="text-[11px] text-muted-foreground mt-1">{new Intl.DateTimeFormat('fa-IR').format(new Date(item.created_at))}</p></TableCell>
                    <TableCell><p className="text-sm">{item.listing_title || item.vehicle_type}</p><p className="max-w-56 truncate text-xs text-muted-foreground mt-1" title={item.details}>{item.details || 'بدون توضیح'}</p></TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[item.status]}>{item.status_label}</Badge><p className="text-[11px] text-muted-foreground mt-1">اولویت {item.priority_label}</p></TableCell>
                    <TableCell>
                      <select
                        aria-label={`انتخاب کارشناس برای ${item.contact_name}`}
                        value={item.assigned_expert ?? ''}
                        disabled={actionId === item.id || ['completed', 'cancelled'].includes(item.status)}
                        onChange={(event) => event.target.value && void updateItem(item, { assignedExpert: Number(event.target.value) })}
                        className="h-8 max-w-44 rounded-md border border-input bg-transparent px-2 text-xs"
                      >
                        <option value="">انتخاب کارشناس</option>
                        {experts.map((expert) => <option key={expert.id} value={expert.id}>{expert.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {item.status === 'new' && <Button size="sm" variant="outline" disabled={actionId === item.id} onClick={() => void updateItem(item, { status: 'reviewing' })}>{actionId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}بررسی</Button>}
                        {!['completed', 'cancelled'].includes(item.status) && <Button size="sm" variant="ghost" className="text-red-600" disabled={actionId === item.id} onClick={() => void updateItem(item, { status: 'cancelled' })}><XCircle className="size-3.5" />لغو</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {nextUrl && <div className="border-t p-4 text-center"><Button variant="outline" disabled={loading} onClick={() => void load(nextUrl)}>{loading ? <Loader2 className="size-4 animate-spin" /> : `نمایش ${toPersianNumber(20)} مورد بعدی`}</Button></div>}
      </CardContent>
    </Card>
  );
}

