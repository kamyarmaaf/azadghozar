'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  addBusinessMember,
  fetchBusinessMembers,
  removeBusinessMember,
  type BusinessMember,
} from '@/lib/business-api';
import { useAuth } from '@/stores/auth';

const roleLabels: Record<BusinessMember['role'], string> = {
  manager: 'مدیر',
  listing_manager: 'مدیر آگهی‌ها',
  sales: 'کارشناس فروش',
};

export function BusinessTeamPanel() {
  const access = useAuth((state) => state.currentUser?.businessAccess);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<BusinessMember['role']>('sales');
  const [canManageListings, setCanManageListings] = useState(true);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!access?.can_manage_members) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const page = await fetchBusinessMembers();
      setMembers(page.results);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'دریافت اعضا انجام نشد.');
    } finally {
      setLoading(false);
    }
  }, [access?.can_manage_members]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!access?.can_manage_members) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">شما مجوز مدیریت اعضای این کسب‌وکار را ندارید.</Card>;
  }

  const addMember = async () => {
    if (!phone.trim()) return;
    setSaving(true);
    try {
      const member = await addBusinessMember({
        phoneNumber: phone,
        role,
        canManageListings,
        canManageMembers,
      });
      setMembers((current) => [member, ...current.filter((item) => item.id !== member.id)]);
      setPhone('');
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'افزودن عضو انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: BusinessMember) => {
    if (!window.confirm(`دسترسی «${member.user_name}» حذف شود؟`)) return;
    await removeBusinessMember(member.id);
    setMembers((current) => current.filter((item) => item.id !== member.id));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">افزودن کارمند</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>شماره موبایل کاربر</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" placeholder="0912..." /></div>
          <div className="space-y-2"><Label>سمت</Label><Select value={role} onValueChange={(value) => setRole(value as BusinessMember['role'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sales">کارشناس فروش</SelectItem><SelectItem value="listing_manager">مدیر آگهی‌ها</SelectItem><SelectItem value="manager">مدیر</SelectItem></SelectContent></Select></div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={canManageListings} onCheckedChange={(value) => setCanManageListings(value === true)} /> مدیریت آگهی‌ها</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={canManageMembers} onCheckedChange={(value) => setCanManageMembers(value === true)} /> مدیریت اعضا</label>
          <Button className="w-full" disabled={saving || !phone.trim()} onClick={() => void addMember()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} افزودن</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-5" /> اعضای تیم</CardTitle></CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
          {loading ? <div className="flex justify-center p-8"><Loader2 className="size-5 animate-spin" /></div> : members.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">هنوز کارمندی اضافه نشده است.</p> : <div className="divide-y">{members.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{member.user_name}</p><p className="text-xs text-muted-foreground" dir="ltr">{member.phone_number}</p><p className="mt-1 text-xs text-muted-foreground">{roleLabels[member.role]} · {member.can_manage_listings ? 'دسترسی آگهی' : 'بدون دسترسی آگهی'}</p></div><Button variant="ghost" size="icon" className="text-red-600" onClick={() => void remove(member)} aria-label="حذف دسترسی"><Trash2 className="size-4" /></Button></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
