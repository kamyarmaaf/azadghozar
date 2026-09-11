'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth, roleLabels, type UserRole } from '@/stores/auth';
import { useNavigation } from '@/stores/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  UserCog, ArrowLeftRight, Send, Clock, CheckCircle, XCircle,
  Shield, Store, Building2, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';

const availableRoles: { role: UserRole; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    role: 'seller',
    label: 'فروشنده',
    description: 'ثبت آگهی فروش خودرو و مدیریت لیست‌های فروش',
    icon: <Store className="size-6" />,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  {
    role: 'gallery',
    label: 'نمایشگاه‌دار',
    description: 'مدیریت نمایشگاه، ثبت چندین آگهی و درج لوگوی تجاری',
    icon: <Building2 className="size-6" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
];

export function RoleChangeTab() {
  const {
    currentUser,
    pendingRoleChange,
    submitRoleChange,
    loadRoleChanges,
    refreshSession,
  } = useAuth();
  const navigateTo = useNavigation((s) => s.navigateTo);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const currentRole = currentUser?.role || 'buyer';

  useEffect(() => {
    void loadRoleChanges().catch(() => undefined);
  }, [loadRoleChanges]);

  const handleSubmitRequest = async () => {
    if (!selectedRole || !currentUser) return;
    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'لطفا دلیل تغییر نقش را وارد کنید' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await submitRoleChange(selectedRole, reason.trim());

      setMessage({ type: 'success', text: 'درخواست تغییر نقش با موفقیت ثبت شد. پس از تایید مدیر، نقش شما تغییر خواهد کرد.' });
      setSelectedRole(null);
      setReason('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'خطا در ارتباط با سرور',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkRequestStatus = async () => {
    if (!pendingRoleChange) return;
    setCheckingStatus(true);

    try {
      const latest = await loadRoleChanges();
      if (latest?.status === 'approved') {
        await refreshSession();
        setMessage({ type: 'success', text: 'درخواست تغییر نقش شما تایید شده است!' });
      } else if (latest?.status === 'rejected') {
        setMessage({ type: 'error', text: latest.adminNote || 'درخواست تغییر نقش رد شده است.' });
      } else {
        setMessage({ type: 'info', text: 'درخواست همچنان در انتظار بررسی مدیر است.' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'خطا در بررسی وضعیت',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  // If there's a pending/approved/rejected request, show status
  if (pendingRoleChange) {
    const isPending = pendingRoleChange.status === 'pending';
    const isApproved = pendingRoleChange.status === 'approved';
    const isRejected = pendingRoleChange.status === 'rejected';

    return (
      <div className="space-y-4">
        <Card className={cn(
          'shadow-card border-2',
          isPending && 'border-amber-300',
          isApproved && 'border-emerald-300',
          isRejected && 'border-red-300'
        )}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isPending && <Clock className="size-5 text-amber-600" />}
              {isApproved && <CheckCircle className="size-5 text-emerald-600" />}
              {isRejected && <XCircle className="size-5 text-red-500" />}
              وضعیت درخواست تغییر نقش
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {roleLabels[pendingRoleChange.fromRole]}
              </Badge>
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              <Badge className={cn(
                'text-sm px-3 py-1',
                pendingRoleChange.toRole === 'seller' && 'bg-emerald-100 text-emerald-700',
                pendingRoleChange.toRole === 'gallery' && 'bg-purple-100 text-purple-700'
              )}>
                {roleLabels[pendingRoleChange.toRole]}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">وضعیت:</span>
              <Badge variant="outline" className={cn(
                'text-xs',
                isPending && 'bg-amber-100 text-amber-700 border-amber-200',
                isApproved && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                isRejected && 'bg-red-100 text-red-700 border-red-200'
              )}>
                {isPending && '⏳ در انتظار بررسی مدیر'}
                {isApproved && '✅ تایید شده'}
                {isRejected && '❌ رد شده'}
              </Badge>
            </div>

            {pendingRoleChange.reason && (
              <div>
                <span className="text-sm text-muted-foreground">دلیل درخواست:</span>
                <p className="text-sm mt-1">{pendingRoleChange.reason}</p>
              </div>
            )}

            {pendingRoleChange.adminNote && (
              <div className="p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium">توضیحات مدیر:</span>
                <p className="text-sm mt-1">{pendingRoleChange.adminNote}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              تاریخ ثبت: {pendingRoleChange.createdAt}
            </div>

            {isPending && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={checkRequestStatus}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  بررسی وضعیت
                </Button>
                <p className="text-xs text-muted-foreground">
                  درخواست شما توسط مدیر بررسی خواهد شد
                </p>
              </div>
            )}

            {isApproved && (
              <Button
                className="gap-2"
                onClick={async () => {
                  const user = await refreshSession();
                  navigateTo(user?.dashboardPage || 'home');
                }}
              >
                <CheckCircle className="size-4" />
                ورود به پنل {roleLabels[pendingRoleChange.toRole]}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No pending request - show request form
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50/50 shadow-card">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">تغییر نقش نیازمند تایید مدیر است</p>
            <p className="text-xs text-amber-700 mt-1 leading-6">
              پس از انتخاب نقش جدید و ثبت درخواست، مدیر سیستم درخواست شما را بررسی و تایید یا رد می‌کند. تا زمان تایید، نقش فعلی شما تغییر نمی‌کند.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Role */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="size-5" />
            نقش فعلی شما
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
              <UserCog className="size-6 text-gold-dark" />
            </div>
            <div>
              <p className="font-bold">{roleLabels[currentRole as UserRole]}</p>
              <p className="text-xs text-muted-foreground">نقش فعلی حساب کاربری شما</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Select New Role */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">انتخاب نقش جدید</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRoles
              .filter((r) => r.role !== currentRole)
              .map((role) => (
                <button
                  key={role.role}
                  onClick={() => setSelectedRole(role.role)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all',
                    selectedRole === role.role
                      ? role.color
                      : 'border-border hover:border-muted-foreground/30 bg-card'
                  )}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    selectedRole === role.role ? 'bg-white/80' : 'bg-muted'
                  )}>
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-5">{role.description}</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center',
                    selectedRole === role.role ? 'border-current' : 'border-muted-foreground/30'
                  )}>
                    {selectedRole === role.role && (
                      <div className="w-2.5 h-2.5 rounded-full bg-current" />
                    )}
                  </div>
                </button>
              ))}
          </div>

          {selectedRole && (
            <>
              <div className="flex flex-col gap-2">
                <Label>دلیل تغییر نقش <span className="text-danger">*</span></Label>
                <Textarea
                  placeholder="مثلا: من صاحب نمایشگاه هستم و می‌خواهم آگهی‌های بیشتری ثبت کنم..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {message && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  message.type === 'success' && 'bg-emerald-50 text-emerald-700',
                  message.type === 'error' && 'bg-red-50 text-red-600',
                  message.type === 'info' && 'bg-blue-50 text-blue-700',
                )}>
                  {message.text}
                </div>
              )}

              <Button
                className="gap-2"
                onClick={handleSubmitRequest}
                disabled={loading || !reason.trim()}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                ثبت درخواست تغییر نقش به {roleLabels[selectedRole]}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
