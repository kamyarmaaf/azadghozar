'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn, toPersianNumber, formatPrice } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import {
  deleteVehicleListing,
  fetchVehicleListings,
  listingImageUrl,
  type VehicleListing,
} from '@/lib/listing-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  Car, Eye, BarChart3, Settings,
  Bell, Pencil, Trash2, Plus, Star, Loader2, RefreshCw, Users, CreditCard,
  CheckCircle2, Crown,
} from 'lucide-react';
import { BusinessMediaUploader } from '@/components/dashboard/BusinessMediaUploader';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { BusinessTeamPanel } from '@/components/business/BusinessTeamPanel';
import { BusinessSubscriptionPanel } from '@/components/business/BusinessSubscriptionPanel';
import { BusinessVerificationForm } from '@/components/business/BusinessVerificationForm';
import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import {
  fetchBusinessDashboard,
  type BusinessDashboard,
} from '@/lib/business-api';

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: 'فعال', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'در انتظار تایید', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-700 border-red-200' },
  sold: { label: 'فروخته شده', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  expired: { label: 'منقضی', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function BusinessDashboardPage({
  expectedKind,
}: {
  expectedKind: 'gallery' | 'agency';
}) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const currentUser = useAuth((state) => state.currentUser);
  const [galleryVehicles, setGalleryVehicles] = useState<VehicleListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [businessDashboard, setBusinessDashboard] = useState<BusinessDashboard | null>(null);
  const [listingPage, setListingPage] = useState(1);
  const [listingCount, setListingCount] = useState(0);
  const [registrationNotice, setRegistrationNotice] = useState<'gallery' | 'agency' | null>(null);

  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const response = await fetchVehicleListings({ mine: true, authenticated: true, page: listingPage, pageSize: 25 });
      setGalleryVehicles(response.results);
      setListingCount(response.count);
      setListingsError('');
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'دریافت خودروها انجام نشد.');
    } finally {
      setIsLoadingListings(false);
    }
  }, [listingPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadListings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadListings]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBusinessDashboard()
        .then(setBusinessDashboard)
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const notice = window.sessionStorage.getItem('azadgozar-business-registration-notice');
    if (notice !== 'gallery' && notice !== 'agency') return;
    window.sessionStorage.removeItem('azadgozar-business-registration-notice');
    const timer = window.setTimeout(() => setRegistrationNotice(notice), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const listingStats = useMemo(() => ({
    active: galleryVehicles.filter((item) => item.status === 'active').length,
    pending: galleryVehicles.filter((item) => item.status === 'pending').length,
    rejected: galleryVehicles.filter((item) => item.status === 'rejected').length,
    sold: galleryVehicles.filter((item) => item.status === 'sold').length,
    views: galleryVehicles.reduce((total, item) => total + item.view_count, 0),
  }), [galleryVehicles]);

  const handleDelete = async (listing: VehicleListing) => {
    if (!window.confirm(`آگهی «${listing.brand_name} ${listing.model_name}» حذف شود؟`)) return;
    setDeletingId(listing.id);
    try {
      await deleteVehicleListing(listing.id);
      setGalleryVehicles((items) => items.filter((item) => item.id !== listing.id));
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'حذف آگهی انجام نشد.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    { label: 'خودروهای فعال', value: businessDashboard ? toPersianNumber(businessDashboard.stats.active_listing_count) : '—', icon: Car, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'در انتظار تأیید', value: businessDashboard ? toPersianNumber(businessDashboard.stats.pending_listing_count) : '—', icon: Bell, color: 'text-amber-600 bg-amber-50' },
    { label: 'کل آگهی‌ها', value: businessDashboard ? toPersianNumber(businessDashboard.stats.listing_count) : '—', icon: BarChart3, color: 'text-violet-600 bg-violet-50' },
    { label: 'بازدید کل', value: businessDashboard ? toPersianNumber(businessDashboard.stats.total_views) : '—', icon: Eye, color: 'text-gold-dark bg-gold/10' },
    { label: 'فروخته شده', value: businessDashboard ? toPersianNumber(businessDashboard.stats.sold_listing_count) : '—', icon: Star, color: 'text-blue-600 bg-blue-50' },
    { label: 'ردشده در این صفحه', value: toPersianNumber(listingStats.rejected), icon: RefreshCw, color: 'text-red-600 bg-red-50' },
  ];

  const isAgencyAccount = (
    businessDashboard?.business.kind ?? currentUser?.businessAccess?.kind ?? expectedKind
  ) === 'agency';

  const tabs = [
    { value: 'vehicles', label: 'مدیریت خودروها', icon: Car },
    { value: 'add', label: 'افزودن خودرو', icon: Plus },
    { value: 'team', label: 'کارمندان', icon: Users },
    { value: 'subscription', label: 'وضعیت اشتراک', icon: CreditCard },
    { value: 'stats', label: 'آمار', icon: BarChart3 },
    { value: 'settings', label: isAgencyAccount ? 'تنظیمات نمایندگی' : 'تنظیمات نمایشگاه', icon: Settings },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarFallback className="bg-gradient-brand text-white text-sm font-bold">{currentUser?.avatar || 'ک'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                {isAgencyAccount && <Crown className="size-5 text-indigo-600" />}
                {isAgencyAccount ? 'پنل نمایندگی' : 'پنل نمایشگاه'}
              </h1>
              <p className="text-sm text-muted-foreground">{currentUser?.businessAccess?.name || currentUser?.businessName || currentUser?.name || (isAgencyAccount ? 'شرکت واردکننده آزادگذر' : 'نمایشگاه آزادگذر')}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">اعلان‌ها: به‌زودی</span>
        </div>

        {registrationNotice && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                {registrationNotice === 'agency'
                  ? 'درخواست ثبت نمایندگی شما با موفقیت ثبت شد.'
                  : 'نمایشگاه شما با موفقیت ثبت شد.'}
              </p>
              <p className="mt-1 text-xs leading-6">
                {registrationNotice === 'agency'
                  ? 'اطلاعات حقوقی شرکت واردکننده در صف نمایندگی‌ها بررسی می‌شود. تا قبل از تأیید، پروفایل عمومی و امکان ثبت آگهی فعال نخواهد بود.'
                  : 'اطلاعات در صف بررسی مدیریت است و پس از تأیید، پروفایل نمایشگاه برای کاربران نمایش داده می‌شود.'}
              </p>
            </div>
          </div>
        )}

        {/* Stats Row - 6 cards */}
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
        <Tabs defaultValue="vehicles">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="w-full md:w-auto flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 whitespace-nowrap">
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.value === 'vehicles' ? 'خودروها' : tab.value === 'settings' ? 'تنظیمات' : tab.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Vehicle Management Tab */}
          <TabsContent value="vehicles" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">تصویر</TableHead>
                      <TableHead className="text-right">برند/مدل</TableHead>
                      <TableHead className="text-right">قیمت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">بازدید</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingListings && (
                      <TableRow><TableCell colSpan={6}><div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت آگهی‌ها...</div></TableCell></TableRow>
                    )}
                    {!isLoadingListings && galleryVehicles.length === 0 && (
                      <TableRow><TableCell colSpan={6}><div className="py-8 text-center text-sm text-muted-foreground">هنوز خودرویی ثبت نشده است.</div></TableCell></TableRow>
                    )}
                    {galleryVehicles.map((v) => {
                      const status = statusMap[v.status];
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <OptimizedImage src={listingImageUrl(v)} alt={v.brand_name} width={128} height={88} sizes="64px" className="w-16 h-11 rounded-lg object-cover" />
                          </TableCell>
                          <TableCell>
                            <div>
                              <button className="font-medium text-sm line-clamp-1 hover:text-gold-dark" onClick={() => navigateTo('vehicle-details', { vehicleId: v.id })}>{v.brand_name} {v.model_name}</button>
                              <p className="text-xs text-muted-foreground mt-0.5">{v.trim_name || toPersianNumber(v.production_year)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium whitespace-nowrap">{v.price === null ? 'تماس بگیرید' : formatPrice(v.price)}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-xs', status.className)}>
                              {status.label}
                            </Badge>
                            {v.status === 'rejected' && v.rejection_reason && (
                              <p className="mt-1 max-w-40 text-[11px] leading-5 text-red-600" title={v.rejection_reason}>
                                علت: {v.rejection_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Eye className="size-3" />{toPersianNumber(v.view_count)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`ویرایش آگهی ${v.brand_name} ${v.model_name}`}
                                onClick={() => navigateTo('sell', { vehicleId: v.id })}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-danger" disabled={deletingId === v.id} onClick={() => void handleDelete(v)}>
                                {deletingId === v.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {listingCount > 25 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button variant="outline" disabled={listingPage === 1 || isLoadingListings} onClick={() => setListingPage((page) => Math.max(1, page - 1))}>صفحه قبل</Button>
                <span className="text-sm text-muted-foreground">صفحه {toPersianNumber(listingPage)} از {toPersianNumber(Math.ceil(listingCount / 25))}</span>
                <Button variant="outline" disabled={listingPage >= Math.ceil(listingCount / 25) || isLoadingListings} onClick={() => setListingPage((page) => page + 1)}>صفحه بعد</Button>
              </div>
            )}
            {listingsError && <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{listingsError}</span><Button size="sm" variant="outline" onClick={() => void loadListings()}>تلاش دوباره</Button></div>}
          </TabsContent>

          {/* Add Vehicle Tab */}
          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">افزودن خودرو جدید</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-6">
                  برای ثبت خودروی جدید، از فرم ثبت آگهی استفاده کنید.
                </p>
                <Button className="gap-2" onClick={() => navigateTo('sell')}>
                  <Plus className="size-4" />
                  رفتن به فرم ثبت آگهی
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <BusinessTeamPanel />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <BusinessSubscriptionPanel />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            {!businessDashboard && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">آمار کسب‌وکار دریافت نشد؛ عدد پیش‌فرض نمایش داده نمی‌شود.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'کل بازدید آگهی‌ها', value: businessDashboard ? toPersianNumber(businessDashboard.stats.total_views) : '—' },
                { label: 'کل آگهی‌ها', value: businessDashboard ? toPersianNumber(businessDashboard.stats.listing_count) : '—' },
                { label: 'آگهی فعال', value: businessDashboard ? toPersianNumber(businessDashboard.stats.active_listing_count) : '—' },
                { label: 'در انتظار تأیید', value: businessDashboard ? toPersianNumber(businessDashboard.stats.pending_listing_count) : '—' },
                { label: 'فروخته‌شده', value: businessDashboard ? toPersianNumber(businessDashboard.stats.sold_listing_count) : '—' },
                { label: 'کارمندان فعال', value: businessDashboard ? toPersianNumber(businessDashboard.stats.member_count) : '—' },
              ].map((item) => (
                <Card key={item.label} className="hover-lift shadow-card">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
                    <p className="text-3xl font-bold">{item.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">اطلاعات زنده سامانه</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gallery Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isAgencyAccount ? 'اطلاعات نمایندگی' : 'اطلاعات نمایشگاه'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BusinessVerificationForm />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">اطلاعات مالک حساب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileSettingsForm />
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-6">
                {/* Logo Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">لوگوی کسب‌وکار</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BusinessMediaUploader kind="logo" />
                  </CardContent>
                </Card>

                {/* Cover Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تصویر کاور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BusinessMediaUploader kind="cover" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function GalleryDashboardPage() {
  return <BusinessDashboardPage expectedKind="gallery" />;
}
