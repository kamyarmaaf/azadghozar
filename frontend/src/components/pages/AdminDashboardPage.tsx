'use client';

import { cn, toPersianNumber, formatPrice } from '@/lib/utils';
import {
  approveVehicleListing,
  fetchAdminPendingListings,
  pendingListingImageUrl,
  rejectVehicleListing,
  type AdminPendingListing,
  type ListingCampaign,
} from '@/lib/listing-api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPendingRoleChanges,
  reviewRoleChange,
  type RoleChangeRequest,
} from '@/lib/account-api';
import { roleLabels } from '@/stores/auth';
import { AdminBusinessPanel } from '@/components/business/AdminBusinessPanel';
import { AdminServiceRequestsPanel } from '@/components/services/AdminServiceRequestsPanel';
import { AdminUsersPanel } from '@/components/dashboard/AdminUsersPanel';
import { ComingSoonNotice } from '@/components/ui/coming-soon';
import { useAuth } from '@/stores/auth';
import { useNavigation } from '@/stores/navigation';
import {
  Users, Car, FileText,
  LayoutDashboard, Store, Building2, Settings, ClipboardList,
  CheckCircle, XCircle, Clock, Shield,
  UserCog, ArrowLeftRight, Loader2, ChevronDown, Flame, Sparkles
} from 'lucide-react';

function ListingApprovalMenu({
  listing,
  disabled,
  loading,
  compact = false,
  onApprove,
}: {
  listing: AdminPendingListing;
  disabled: boolean;
  loading: boolean;
  compact?: boolean;
  onApprove: (id: number, campaign: ListingCampaign) => Promise<void>;
}) {
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant={compact ? 'ghost' : 'default'}
          size={compact ? 'icon' : 'sm'}
          aria-label={`انتخاب نوع تأیید ${listing.brand_name} ${listing.model_name}`}
          className={compact
            ? 'size-7 text-success'
            : 'gap-1 bg-success text-white hover:bg-success/90'}
          disabled={disabled}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle className="size-3.5" />
          )}
          {!compact && (
            <>
              تأیید
              <ChevronDown className="size-3.5" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 text-right">
        <DropdownMenuLabel>تأیید به‌عنوان</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer justify-start"
          onSelect={() => void onApprove(listing.id, 'regular')}
        >
          <CheckCircle className="size-4 text-success" />
          آگهی عادی
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer justify-start"
          onSelect={() => void onApprove(listing.id, 'instant')}
        >
          <Flame className="size-4 text-destructive" />
          فروش فوری
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer justify-start"
          onSelect={() => void onApprove(listing.id, 'special')}
        >
          <Sparkles className="size-4 text-gold-dark" />
          فروش ویژه
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminDashboardPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const currentUser = useAuth((state) => state.currentUser);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const canManage = hasHydrated && currentUser?.role === 'admin';
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [roleNext, setRoleNext] = useState<string | null>(null);
  const [roleRequestsLoading, setRoleRequestsLoading] = useState(true);
  const [roleMoreLoading, setRoleMoreLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleRequestError, setRoleRequestError] = useState('');
  const [pendingListings, setPendingListings] = useState<AdminPendingListing[]>([]);
  const [listingCursorUrl, setListingCursorUrl] = useState<string | null>(null);
  const [listingNext, setListingNext] = useState<string | null>(null);
  const [listingPrevious, setListingPrevious] = useState<string | null>(null);
  const listingRequestVersion = useRef(0);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingActionId, setListingActionId] = useState<number | null>(null);
  const [listingsError, setListingsError] = useState('');

  const loadPendingRequests = useCallback(async () => {
    setRoleRequestsLoading(true);
    try {
      const response = await fetchPendingRoleChanges();
      setRoleRequests(response.requests);
      setRoleNext(response.next);
      setRoleRequestError('');
    } catch (error) {
      setRoleRequestError(
        error instanceof Error ? error.message : 'خطا در دریافت درخواست‌ها',
      );
    } finally {
      setRoleRequestsLoading(false);
    }
  }, []);

  const loadMoreRoleRequests = async () => {
    if (!roleNext || roleMoreLoading) return;
    setRoleMoreLoading(true);
    try {
      const response = await fetchPendingRoleChanges({ nextUrl: roleNext });
      setRoleRequests((current) => {
        const seen = new Set(current.map((request) => request.id));
        return [...current, ...response.requests.filter((request) => !seen.has(request.id))];
      });
      setRoleNext(response.next);
      setRoleRequestError('');
    } catch (error) {
      setRoleRequestError(error instanceof Error ? error.message : 'دریافت ادامه درخواست‌ها انجام نشد.');
    } finally {
      setRoleMoreLoading(false);
    }
  };

  const loadPendingListings = useCallback(async (nextUrl: string | null) => {
    const requestVersion = ++listingRequestVersion.current;
    setListingsLoading(true);
    setPendingListings([]);
    setListingNext(null);
    setListingPrevious(null);
    setListingsError('');
    try {
      const response = await fetchAdminPendingListings({ nextUrl });
      if (listingRequestVersion.current !== requestVersion) return;
      setPendingListings(response.results);
      setListingNext(response.next);
      setListingPrevious(response.previous);
      setListingsError('');
    } catch (error) {
      if (listingRequestVersion.current !== requestVersion) return;
      setListingsError(error instanceof Error ? error.message : 'خطا در دریافت آگهی‌ها');
    } finally {
      if (listingRequestVersion.current === requestVersion) setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    const timer = window.setTimeout(() => void loadPendingRequests(), 0);
    return () => window.clearTimeout(timer);
  }, [canManage, loadPendingRequests]);

  useEffect(() => {
    if (!canManage) return;
    const requestVersion = listingRequestVersion;
    const timer = window.setTimeout(() => void loadPendingListings(listingCursorUrl), 0);
    return () => {
      window.clearTimeout(timer);
      requestVersion.current++;
    };
  }, [canManage, listingCursorUrl, loadPendingListings]);

  const handleListingApprove = async (
    id: number,
    campaign: ListingCampaign,
  ) => {
    setListingActionId(id);
    try {
      await approveVehicleListing(id, campaign);
      setPendingListings((items) => items.filter((item) => item.id !== id));
      if (pendingListings.length === 1 && (listingNext || listingPrevious)) {
        setListingCursorUrl(listingNext || listingPrevious);
      } else {
        void loadPendingListings(listingCursorUrl);
      }
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
      if (pendingListings.length === 1 && (listingNext || listingPrevious)) {
        setListingCursorUrl(listingNext || listingPrevious);
      } else {
        void loadPendingListings(listingCursorUrl);
      }
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


  const tabs = [
    { value: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { value: 'users', label: 'کاربران', icon: Users },
    { value: 'listings', label: 'آگهی‌ها', icon: Car },
    { value: 'agencies', label: 'نمایندگی‌ها', icon: Store },
    { value: 'galleries', label: 'نمایشگاه‌ها', icon: Building2 },
    { value: 'services', label: 'خدمات', icon: ClipboardList },
    { value: 'role-requests', label: 'درخواست نقش', icon: UserCog },
    { value: 'content', label: 'محتوا (به‌زودی)', icon: FileText },
    { value: 'settings', label: 'تنظیمات (به‌زودی)', icon: Settings },
  ];

  if (!hasHydrated) {
    return <div role="status" className="p-8 text-center text-muted-foreground">در حال بررسی دسترسی مدیر...</div>;
  }
  if (!canManage) {
    return <div role="alert" className="p-8 text-center">این بخش فقط برای حساب مدیر سامانه در دسترس است.</div>;
  }

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
              <p className="text-sm text-muted-foreground">{currentUser?.name || 'مدیر سیستم'}</p>
            </div>
          </div>
        </div>
        <p className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          صف‌های زیر داده واقعی را نشان می‌دهند. آمار کل کاربران، بازدید و درآمد تا زمان راه‌اندازی گزارش‌گیری قابل اتکا نمایش داده نمی‌شود.
        </p>

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
              {/* Request queues */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="size-5" />
                    مدیریت کاربران
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-7">برای جست‌وجوی سریع موبایل، فیلتر نقش و وضعیت، تب «کاربران» را باز کنید. رویداد ساختگی نمایش داده نمی‌شود.</p>
                </CardContent>
              </Card>

              {/* Pending approvals */}
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="size-5 text-amber-600" />
                      در انتظار تأیید (صفحهٔ جاری)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {listingsLoading && <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />در حال دریافت...</div>}
                    {listingsError && <div role="alert" className="p-6 text-center text-sm text-red-700">دریافت صف آگهی ناموفق بود.</div>}
                    {!listingsLoading && !listingsError && pendingListings.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">آگهی در انتظار تأیید نیست.</div>}
                    {pendingListings.slice(0, 3).map((v, i) => (
                      <div key={v.id}>
                        <div className="flex items-center gap-3 p-3">
                          <OptimizedImage src={pendingListingImageUrl(v)} alt={v.brand_name} width={96} height={72} sizes="48px" className="w-12 h-9 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{v.brand_name} {v.model_name}</p>
                            <p className="text-xs text-muted-foreground">{v.owner_name}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <ListingApprovalMenu
                              listing={v}
                              compact
                              disabled={listingActionId !== null}
                              loading={listingActionId === v.id}
                              onApprove={handleListingApprove}
                            />
                            <Button variant="ghost" size="icon" aria-label={`رد ${v.brand_name} ${v.model_name}`} className="size-7 text-danger" disabled={listingActionId !== null} onClick={() => void handleListingReject(v.id)}>
                              <XCircle className="size-4" />
                            </Button>
                          </div>
                        </div>
                        {i < Math.min(pendingListings.length, 3) - 1 && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <AdminUsersPanel />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <p role="status" className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm leading-7 text-muted-foreground">آگهی‌ها با cursor در صفحه‌های ۲۰تایی و بدون شمارش کل جدول بارگیری می‌شوند. پس از بررسی جزئیات، از منوی «تأیید» مشخص کنید آگهی عادی، فروش فوری یا فروش ویژه باشد.</p>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">آگهی‌های در انتظار تایید</CardTitle>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {toPersianNumber(pendingListings.length)} آگهی در صفحهٔ جاری
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {listingsError && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{listingsError}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void loadPendingListings(listingCursorUrl)}>تلاش دوباره</Button>{listingCursorUrl && <Button size="sm" variant="outline" onClick={() => setListingCursorUrl(null)}>صفحهٔ اول</Button>}</div></div>}
                {listingsLoading && <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت آگهی‌ها...</div>}
                {!listingsLoading && !listingsError && pendingListings.length === 0 && <div className="p-8 text-center"><CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" /><p className="font-medium">آگهی در انتظار بررسی نیست</p></div>}
                {pendingListings.map((v, i) => (
                  <div key={v.id}>
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <OptimizedImage src={pendingListingImageUrl(v)} alt={v.brand_name} width={160} height={112} sizes="80px" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{v.brand_name} {v.model_name} {v.trim_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {v.owner_name} · {toPersianNumber(v.production_year)} · {v.price === null ? 'تماس بگیرید' : formatPrice(v.price)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          تاریخ ثبت: {new Intl.DateTimeFormat('fa-IR').format(new Date(v.created_at))}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => navigateTo('vehicle-details', { vehicleId: v.id })}>جزئیات</Button>
                        <ListingApprovalMenu
                          listing={v}
                          disabled={listingActionId !== null}
                          loading={listingActionId === v.id}
                          onApprove={handleListingApprove}
                        />
                        <Button size="sm" variant="outline" className="gap-1 text-danger border-danger/30 hover:bg-danger/10" disabled={listingActionId !== null} onClick={() => void handleListingReject(v.id)}>
                          <XCircle className="size-3.5" />
                          رد
                        </Button>
                      </div>
                    </div>
                    {i < pendingListings.length - 1 && <Separator />}
                  </div>
                ))}
                {!listingsLoading && !listingsError && (listingPrevious || listingNext) && (
                  <nav aria-label="صفحه‌بندی صف آگهی" className="flex items-center justify-center gap-3 border-t p-4">
                    <Button variant="outline" disabled={!listingPrevious} onClick={() => setListingCursorUrl(listingPrevious)}>صفحهٔ قبل</Button>
                    <Button variant="outline" onClick={() => setListingCursorUrl(null)} disabled={!listingCursorUrl}>صفحهٔ اول</Button>
                    <Button variant="outline" disabled={!listingNext} onClick={() => setListingCursorUrl(listingNext)}>صفحهٔ بعد</Button>
                  </nav>
                )}
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
                  {toPersianNumber(roleRequests.length)} درخواست بارگیری‌شده
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {roleRequestError && (
                  <div role="alert" className="m-4 flex items-center justify-between gap-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span>{roleRequestError}</span>
                    {roleRequests.length === 0 && <Button size="sm" variant="outline" onClick={() => void loadPendingRequests()}>تلاش دوباره</Button>}
                  </div>
                )}
                {roleRequestsLoading && <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />در حال دریافت درخواست‌ها...</div>}
                {!roleRequestsLoading && !roleRequestError && roleRequests.length === 0 ? (
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
                              disabled={actionLoading !== null || roleMoreLoading}
                            >
                              {actionLoading === req.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-danger border-danger/30 hover:bg-danger/10"
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoading !== null || roleMoreLoading}
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
                {roleNext && !roleRequestsLoading && <div className="border-t p-4 text-center"><Button variant="outline" disabled={roleMoreLoading} onClick={() => void loadMoreRoleRequests()}>{roleMoreLoading ? <Loader2 className="size-4 animate-spin" /> : 'نمایش درخواست‌های بعدی'}</Button></div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agencies" className="mt-6">
            <AdminBusinessPanel kind="agency" />
          </TabsContent>

          <TabsContent value="galleries" className="mt-6">
            <AdminBusinessPanel kind="gallery" />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <AdminServiceRequestsPanel />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <ComingSoonNotice title="مدیریت محتوا" detail="مدیریت و انتشار ویدیوهای آموزشی از پنل مدیریت Django فعال است؛ مقاله‌ها، پرسش‌های متداول و بنرهای عمومی هنوز به API متصل نشده‌اند." />
          </TabsContent>

          {/* Admin Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تنظیمات سیستم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">تنظیمات سامانه هنوز به API متصل نشده است؛ برای جلوگیری از ذخیره‌سازی ظاهری، ویرایش در این بخش غیرفعال است.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
