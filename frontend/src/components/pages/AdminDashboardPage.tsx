'use client';

import { cn, toPersianNumber, formatPrice } from '@/lib/utils';
import {
  approveVehicleListing,
  fetchVehicleListings,
  listingImageUrl,
  rejectVehicleListing,
  type VehicleListing,
} from '@/lib/listing-api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useCallback } from 'react';
import {
  fetchPendingRoleChanges,
  reviewRoleChange,
  type RoleChangeRequest,
} from '@/lib/account-api';
import { roleLabels } from '@/stores/auth';
import { AdminBusinessPanel } from '@/components/business/AdminBusinessPanel';
import { AdminServiceRequestsPanel } from '@/components/services/AdminServiceRequestsPanel';
import {
  Users, Car, Eye, SearchCheck, FileText, Truck,
  LayoutDashboard, Store, Building2, Settings, ClipboardList,
  CheckCircle, XCircle, Clock, Shield, ArrowUpRight, TrendingUp,
  UserCog, ArrowLeftRight, Loader2, Send
} from 'lucide-react';

const mockUsers = [
  { id: 'u1', name: 'علی محمدی', phone: '09123456789', type: 'خریدار', status: 'active', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'u2', name: 'محمد رضایی', phone: '09129876543', type: 'فروشنده', status: 'active', date: '۱۴۰۳/۰۸/۰۵' },
  { id: 'u3', name: 'گالری رویال موتورز', phone: '02191009100', type: 'نمایشگاه', status: 'active', date: '۱۴۰۳/۰۷/۲۰' },
  { id: 'u4', name: 'سارا احمدی', phone: '09351234567', type: 'خریدار', status: 'pending', date: '۱۴۰۳/۰۹/۱۵' },
  { id: 'u5', name: 'حسن کریمی', phone: '09161112233', type: 'فروشنده', status: 'suspended', date: '۱۴۰۳/۰۹/۱۰' },
];

const userStatusMap: Record<string, { label: string; className: string }> = {
  active: { label: 'فعال', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'در انتظار تایید', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'معلق', className: 'bg-red-100 text-red-700 border-red-200' },
};

const recentActivities = [
  { id: 'a1', text: 'آگهی جدید توسط نمایندگی آلفا اتو ثبت شد.', time: '۱۰ دقیقه پیش', icon: Car, color: 'text-gold-dark' },
  { id: 'a2', text: 'درخواست بازرسی خودرو توسط کاربر ۲۳۴ ثبت شد.', time: '۲۵ دقیقه پیش', icon: SearchCheck, color: 'text-emerald-600' },
  { id: 'a3', text: 'کاربر جدید «سارا احمدی» ثبت‌نام کرد.', time: '۱ ساعت پیش', icon: Users, color: 'text-violet-600' },
  { id: 'a4', text: 'آگهی مرسدس بنز کلاس E تایید و منتشر شد.', time: '۲ ساعت پیش', icon: CheckCircle, color: 'text-success' },
  { id: 'a5', text: 'درخواست انتقال مالکیت خودرو جدید دریافت شد.', time: '۳ ساعت پیش', icon: FileText, color: 'text-amber-600' },
  { id: 'a6', text: 'گالری لوکس موتور درخواست احراز هویت مجدد کرد.', time: '۴ ساعت پیش', icon: Building2, color: 'text-rose-500' },
];

export function AdminDashboardPage() {
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleRequestError, setRoleRequestError] = useState('');
  const [pendingListings, setPendingListings] = useState<VehicleListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingActionId, setListingActionId] = useState<number | null>(null);
  const [listingsError, setListingsError] = useState('');

  const loadPendingRequests = useCallback(async () => {
    try {
      setRoleRequests(await fetchPendingRoleChanges());
      setRoleRequestError('');
    } catch (error) {
      setRoleRequestError(
        error instanceof Error ? error.message : 'خطا در دریافت درخواست‌ها',
      );
    }
  }, []);

  const loadPendingListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const response = await fetchVehicleListings({
        status: 'pending',
        authenticated: true,
        pageSize: 100,
      });
      setPendingListings(response.results);
      setListingsError('');
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'خطا در دریافت آگهی‌ها');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPendingRequests();
      void loadPendingListings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPendingListings, loadPendingRequests]);

  const handleListingApprove = async (id: number) => {
    setListingActionId(id);
    try {
      await approveVehicleListing(id);
      setPendingListings((items) => items.filter((item) => item.id !== id));
      setListingsError('');
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'تأیید آگهی انجام نشد.');
    } finally {
      setListingActionId(null);
    }
  };

  const handleListingReject = async (id: number) => {
    const reason = window.prompt('دلیل رد آگهی را وارد کنید:');
    if (!reason) return;
    setListingActionId(id);
    try {
      await rejectVehicleListing(id, reason);
      setPendingListings((items) => items.filter((item) => item.id !== id));
      setListingsError('');
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'رد آگهی انجام نشد.');
    } finally {
      setListingActionId(null);
    }
  };

  const handleApprove = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await reviewRoleChange(id, 'approve', 'تأیید شده توسط مدیر سیستم');
      setRoleRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (error) {
      setRoleRequestError(error instanceof Error ? error.message : 'خطا در تأیید درخواست');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      await reviewRoleChange(id, 'reject', 'رد شده توسط مدیر سیستم');
      setRoleRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (error) {
      setRoleRequestError(error instanceof Error ? error.message : 'خطا در رد درخواست');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const stats = [
    { label: 'کل کاربران', value: '۱۲,۵۰۰', icon: Users, color: 'text-gold-dark bg-gold/10' },
    { label: 'آگهی فعال', value: '۸۵۰', icon: Car, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'بازدید امروز', value: '۱۵,۰۰۰', icon: Eye, color: 'text-amber-600 bg-amber-50' },
    { label: 'درخواست بازرسی', value: '۴۵', icon: SearchCheck, color: 'text-violet-600 bg-violet-50' },
    { label: 'درخواست انتقال', value: '۲۸', icon: FileText, color: 'text-rose-500 bg-rose-50' },
    { label: 'درخواست حمل', value: '۱۵', icon: Truck, color: 'text-teal-600 bg-teal-50' },
  ];

  const tabs = [
    { value: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { value: 'users', label: 'کاربران', icon: Users },
    { value: 'listings', label: 'آگهی‌ها', icon: Car },
    { value: 'dealers', label: 'نمایندگی‌ها', icon: Store },
    { value: 'galleries', label: 'نمایشگاه‌ها', icon: Building2 },
    { value: 'services', label: 'خدمات', icon: ClipboardList },
    { value: 'role-requests', label: 'درخواست نقش', icon: UserCog },
    { value: 'content', label: 'محتوا', icon: FileText },
    { value: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-11">
              <AvatarFallback className="bg-gradient-brand text-white text-sm font-bold">
                <Shield className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">پنل مدیریت آزاد گذر</h1>
              <p className="text-sm text-muted-foreground">مدیر سیستم - امیر حسینی</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <ArrowUpRight className="size-5" />
          </Button>
        </div>

        {/* Stats Row - 6 large cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover-lift shadow-card">
                <CardContent className="p-4 flex flex-col items-end text-right gap-2">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', stat.color)}>
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="w-full md:w-auto flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 whitespace-nowrap">
                    <Icon className="size-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="size-5" />
                    فعالیت‌های اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {recentActivities.map((activity, i) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id}>
                        <div className="flex items-start gap-3 p-4">
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-muted', activity.color)}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-6">{activity.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                          </div>
                        </div>
                        {i < recentActivities.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Pending Approvals + Quick Stats */}
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="size-5 text-amber-600" />
                      در انتظار تایید
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {listingsLoading && <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />در حال دریافت...</div>}
                    {!listingsLoading && pendingListings.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">آگهی در انتظار تأیید نیست.</div>}
                    {pendingListings.slice(0, 3).map((v, i) => (
                      <div key={v.id}>
                        <div className="flex items-center gap-3 p-3">
                          <OptimizedImage src={listingImageUrl(v)} alt={v.brand_name} width={96} height={72} sizes="48px" className="w-12 h-9 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{v.brand_name} {v.model_name}</p>
                            <p className="text-xs text-muted-foreground">{v.owner_name}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="size-7 text-success" disabled={listingActionId === v.id} onClick={() => void handleListingApprove(v.id)}>
                              {listingActionId === v.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 text-danger" disabled={listingActionId === v.id} onClick={() => void handleListingReject(v.id)}>
                              <XCircle className="size-4" />
                            </Button>
                          </div>
                        </div>
                        {i < Math.min(pendingListings.length, 3) - 1 && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="size-5 text-emerald-600" />
                      آمار سریع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ثبت‌نام امروز</span>
                      <span className="text-sm font-bold">{toPersianNumber(23)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">آگهی جدید امروز</span>
                      <span className="text-sm font-bold">{toPersianNumber(18)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">نرخ تبدیل</span>
                      <span className="text-sm font-bold text-success">۲.۴٪</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">درآمد ماهانه</span>
                      <span className="text-sm font-bold">۱۲۵ میلیون</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">تلفن</TableHead>
                      <TableHead className="text-right">نوع</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">تاریخ عضویت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => {
                      const status = userStatusMap[user.status];
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-muted text-xs">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground" dir="ltr">{user.phone}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{user.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-xs', status.className)}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{user.date}</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs">
                              مشاهده
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">آگهی‌های در انتظار تایید</CardTitle>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {toPersianNumber(pendingListings.length)} آگهی
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {listingsError && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{listingsError}</span><Button size="sm" variant="outline" onClick={() => void loadPendingListings()}>تلاش دوباره</Button></div>}
                {listingsLoading && <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت آگهی‌ها...</div>}
                {!listingsLoading && pendingListings.length === 0 && <div className="p-8 text-center"><CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" /><p className="font-medium">آگهی در انتظار بررسی نیست</p></div>}
                {pendingListings.map((v, i) => (
                  <div key={v.id}>
                    <div className="flex items-center gap-4 p-4">
                      <OptimizedImage src={listingImageUrl(v)} alt={v.brand_name} width={160} height={112} sizes="80px" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{v.brand_name} {v.model_name} {v.trim_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.owner_name} · {toPersianNumber(v.production_year)} · {v.price === null ? 'تماس بگیرید' : formatPrice(v.price)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          تاریخ ثبت: {new Intl.DateTimeFormat('fa-IR').format(new Date(v.created_at))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" className="gap-1 bg-success hover:bg-success/90 text-white" disabled={listingActionId === v.id} onClick={() => void handleListingApprove(v.id)}>
                          {listingActionId === v.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                          تایید
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-danger border-danger/30 hover:bg-danger/10" disabled={listingActionId === v.id} onClick={() => void handleListingReject(v.id)}>
                          <XCircle className="size-3.5" />
                          رد
                        </Button>
                      </div>
                    </div>
                    {i < pendingListings.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Change Requests Tab */}
          <TabsContent value="role-requests" className="mt-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCog className="size-5" />
                  درخواست‌های تغییر نقش
                </CardTitle>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {toPersianNumber(roleRequests.length)} درخواست
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {roleRequestError && (
                  <div className="m-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {roleRequestError}
                  </div>
                )}
                {roleRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium">درخواستی در انتظار بررسی نیست</p>
                    <p className="text-sm text-muted-foreground mt-1">همه درخواست‌های تغییر نقش بررسی شده‌اند.</p>
                  </div>
                ) : (
                  roleRequests.map((req, i) => (
                    <div key={req.id}>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="size-9">
                                <AvatarFallback className="bg-muted text-xs">{req.userName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">{req.userName}</p>
                                <p className="text-xs text-muted-foreground">{req.createdAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">{roleLabels[req.fromRole]}</Badge>
                              <ArrowLeftRight className="size-3.5 text-muted-foreground" />
                              <Badge variant="outline" className={cn(
                                'text-xs',
                                req.toRole === 'seller' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                req.toRole === 'gallery' && 'bg-purple-100 text-purple-700 border-purple-200'
                              )}>
                                {roleLabels[req.toRole]}
                              </Badge>
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                <Clock className="size-3 ml-1" />
                                در انتظار
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-6">{req.reason}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="gap-1 bg-success hover:bg-success/90 text-white"
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-danger border-danger/30 hover:bg-danger/10"
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading === req.id}
                            >
                              {actionLoading === req.id ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                              رد
                            </Button>
                          </div>
                        </div>
                      </div>
                      {i < roleRequests.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dealers" className="mt-6">
            <AdminBusinessPanel kind="agency" />
          </TabsContent>

          <TabsContent value="galleries" className="mt-6">
            <AdminBusinessPanel kind="gallery" />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <AdminServiceRequestsPanel />
          </TabsContent>

          {/* Other tabs - placeholder */}
          {['content'].map((tab) => {
            const tabInfo: Record<string, { title: string; desc: string }> = {
              dealers: { title: 'مدیریت نمایندگی‌ها', desc: 'لیست نمایندگی‌های ثبت‌شده و درخواست‌های جدید در اینجا نمایش داده می‌شود.' },
              galleries: { title: 'مدیریت نمایشگاه‌ها', desc: 'لیست نمایشگاه‌های ثبت‌شده، درخواست احراز هویت و نظرات در اینجا نمایش داده می‌شود.' },
              services: { title: 'مدیریت خدمات', desc: 'درخواست‌های بازرسی، انتقال مالکیت و حمل و نقل در اینجا مدیریت می‌شوند.' },
              content: { title: 'مدیریت محتوا', desc: 'مقالات، ویدیوها، سوالات متداول و بنرها در اینجا مدیریت می‌شوند.' },
            };
            const info = tabInfo[tab]!;
            const Icon = FileText;
            return (
              <TabsContent key={tab} value={tab} className="mt-6">
                <Card>
                  <CardContent className="p-8 text-center">
                    <Icon className="size-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">{info.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{info.desc}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}

          {/* Admin Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تنظیمات سیستم</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 max-w-xl">
                <div className="flex flex-col gap-2">
                  <Label>نام سایت</Label>
                  <Input defaultValue="آزاد گذر" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>شماره پشتیبانی</Label>
                  <Input defaultValue="۰۲۱-۹۱۰۰۹۱۰۰" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>ایمیل سیستم</Label>
                  <Input defaultValue="support@azadgozar.com" dir="ltr" />
                </div>
                <Button className="mt-2">ذخیره تنظیمات</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
