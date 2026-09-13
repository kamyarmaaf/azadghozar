'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { fetchAdminUsers, type AdminUser } from '@/lib/admin-users-api';
import type { UserRole } from '@/lib/account-api';
import { roleLabels } from '@/stores/auth';
import { toPersianNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminUsersPanel() {
  const [role, setRole] = useState<UserRole | ''>('');
  const [active, setActive] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<AdminUser[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const loadMoreController = useRef<AbortController | null>(null);

  function resetPage() {
    generation.current++;
    loadMoreController.current?.abort();
    setItems([]);
    setNext(null);
    setSelected(null);
    setLoading(true);
    setError('');
  }

  useEffect(() => {
    const requestGeneration = generation;
    const id = ++requestGeneration.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchAdminUsers({
        role: role || undefined,
        active: active ? active === 'true' : undefined,
        phone,
        signal: controller.signal,
      }).then((page) => {
        if (generation.current !== id) return;
        setItems(page.results);
        setNext(page.next);
      }).catch((failure: unknown) => {
        if (generation.current !== id || controller.signal.aborted) return;
        setError(failure instanceof Error ? failure.message : 'دریافت کاربران ناموفق بود.');
      }).finally(() => {
        if (generation.current === id) setLoading(false);
      });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      loadMoreController.current?.abort();
      if (requestGeneration.current === id) requestGeneration.current++;
    };
  }, [role, active, phone]);

  async function loadMore() {
    if (!next || loading) return;
    const id = generation.current;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoading(true);
    try {
      const page = await fetchAdminUsers({ nextUrl: next, signal: controller.signal });
      if (generation.current !== id) return;
      setItems((current) => [...current, ...page.results]);
      setNext(page.next);
      setError('');
    } catch (failure) {
      if (generation.current === id) {
        setError(failure instanceof Error ? failure.message : 'صفحه بعدی بارگیری نشد.');
      }
    } finally {
      if (loadMoreController.current === controller) loadMoreController.current = null;
      if (generation.current === id) setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">کاربران واقعی سامانه</CardTitle>
        <p className="text-xs text-muted-foreground">صفحه‌بندی بدون شمارش کل کاربران؛ جست‌وجو بر اساس شماره موبایل کامل</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="relative grow sm:grow-0">
            <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            <Input value={phone} onChange={(e) => { resetPage(); setPhone(e.target.value); }} placeholder="شماره موبایل کامل" inputMode="tel" className="pr-9" maxLength={20} />
          </div>
          <select aria-label="فیلتر نقش" value={role} onChange={(e) => { resetPage(); setRole(e.target.value as UserRole | ''); }} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">همه نقش‌ها</option>
            {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="فیلتر وضعیت" value={active} onChange={(e) => { resetPage(); setActive(e.target.value); }} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">همه وضعیت‌ها</option><option value="true">فعال</option><option value="false">غیرفعال</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && <p role="alert" className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading && items.length === 0 && <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />در حال دریافت...</p>}
        {!loading && items.length === 0 && !error && <p className="p-6 text-sm text-muted-foreground">کاربری مطابق فیلتر یافت نشد.</p>}
        {items.length > 0 && <div className="overflow-x-auto"><Table>
          <TableHeader><TableRow><TableHead className="text-right">نام</TableHead><TableHead className="text-right">موبایل</TableHead><TableHead className="text-right">نقش</TableHead><TableHead className="text-right">وضعیت</TableHead><TableHead className="text-right">عضویت</TableHead><TableHead className="text-right">جزئیات</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((user) => <TableRow key={user.id}>
            <TableCell className="font-medium">{user.display_name}</TableCell>
            <TableCell dir="ltr" className="text-right">{user.phone_number || '—'}</TableCell>
            <TableCell>{user.role ? (roleLabels[user.role] || user.role_label) : 'تعیین‌نشده'}</TableCell>
            <TableCell><Badge variant="outline" className={user.is_active ? 'text-emerald-700' : 'text-red-700'}>{user.is_active ? 'فعال' : 'غیرفعال'}</Badge></TableCell>
            <TableCell>{new Intl.DateTimeFormat('fa-IR').format(new Date(user.date_joined))}</TableCell>
            <TableCell><Button type="button" size="sm" variant="ghost" onClick={() => setSelected(user)}>مشاهده</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table></div>}
        {selected && <div className="border-t bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-3"><strong>مشخصات کاربر #{toPersianNumber(selected.id)}</strong><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>بستن</Button></div>
          <p className="mt-2">{selected.display_name} · {selected.role_label || 'بدون نقش'} · {selected.is_staff ? 'مدیر سیستم' : 'کاربر'}</p>
          <p>تأیید موبایل: {selected.is_phone_verified ? 'انجام شده' : 'انجام نشده'}</p>
          <p className="text-muted-foreground mt-2">تغییر نقش و وضعیت حساب در این صفحه فعال نیست؛ از فرآیند مدیریت تأییدشده استفاده کنید.</p>
        </div>}
        {next && <div className="border-t p-4 text-center"><Button variant="outline" disabled={loading} onClick={() => void loadMore()}>{loading ? <Loader2 className="size-4 animate-spin" /> : 'نمایش کاربران بعدی'}</Button></div>}
      </CardContent>
    </Card>
  );
}
