'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { cn, toPersianNumber, formatPrice } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';
import {
  Car, Eye, ArrowLeftRight, BarChart3, MessageSquare,
  Settings, Pencil, Trash2, Plus, TrendingUp, DollarSign, UserPlus, Loader2, RefreshCw
} from 'lucide-react';
import { ReferralTab } from '@/components/dashboard/ReferralTab';
import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { MyServiceRequestsPanel } from '@/components/services/MyServiceRequestsPanel';
import { ComingSoonNotice } from '@/components/ui/coming-soon';

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: 'فعال', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'در انتظار تایید', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-700 border-red-200' },
  sold: { label: 'فروخته شده', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  expired: { label: 'منقضی', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function SellerDashboardPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const currentUser = useAuth((state) => state.currentUser);
  const [sellerVehicles, setSellerVehicles] = useState<VehicleListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const response = await fetchVehicleListings({ mine: true, authenticated: true, pageSize: 100 });
      setSellerVehicles(response.results);
      setListingsError('');
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'دریافت آگهی‌ها انجام نشد.');
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadListings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadListings]);

  const listingStats = useMemo(() => ({
    active: sellerVehicles.filter((item) => item.status === 'active').length,
    pending: sellerVehicles.filter((item) => item.status === 'pending').length,
    views: sellerVehicles.reduce((total, item) => total + item.view_count, 0),
    averagePrice: (() => {
      const priced = sellerVehicles.filter((item) => item.price !== null);
      return priced.length ? Math.round(priced.reduce((total, item) => total + (item.price || 0), 0) / priced.length) : 0;
    })(),
  }), [sellerVehicles]);

  const handleDelete = async (listing: VehicleListing) => {
    if (!window.confirm(`آگهی «${listing.brand_name} ${listing.model_name}» حذف شود؟`)) return;
    setDeletingId(listing.id);
    try {
      await deleteVehicleListing(listing.id);
      setSellerVehicles((items) => items.filter((item) => item.id !== listing.id));
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'حذف آگهی انجام نشد.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = [
    { label: 'آگهی فعال در این صفحه', value: toPersianNumber(listingStats.active), icon: Car, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'در انتظار تأیید در این صفحه', value: toPersianNumber(listingStats.pending), icon: RefreshCw, color: 'text-amber-600 bg-amber-50' },
    { label: 'بازدید آگهی‌های این صفحه', value: toPersianNumber(listingStats.views), icon: Eye, color: 'text-gold-dark bg-gold/10' },
    { label: 'آگهی‌های بارگیری‌شده', value: toPersianNumber(sellerVehicles.length), icon: ArrowLeftRight, color: 'text-violet-600 bg-violet-50' },
  ];

  const tabs = [
    { value: 'listings', label: 'آگهی‌های من', icon: Car },
    { value: 'inspections', label: 'درخواست‌های بازرسی', icon: BarChart3 },
    { value: 'stats', label: 'آمار محدود', icon: TrendingUp },
    { value: 'messages', label: 'پیام‌ها (به‌زودی)', icon: MessageSquare },
    { value: 'referral', label: 'دعوت از دوستان', icon: UserPlus },
    { value: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-11">
              <AvatarFallback className="bg-brand text-white text-sm font-bold">{currentUser?.avatar || 'ک'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">پنل کاربری فروشنده</h1>
              <p className="text-sm text-muted-foreground">{currentUser?.name || 'فروشنده آزادگذر'}</p>
            </div>
          </div>
          <Button onClick={() => navigateTo('sell')} className="gap-2">
            <Plus className="size-4" />
            ثبت آگهی جدید
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover-lift shadow-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', stat.color)}>
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="w-full md:w-auto flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 whitespace-nowrap">
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.replace(/آگهی‌های من/, 'آگهی‌ها').replace(/درخواست‌های بازرسی/, 'بازرسی').replace(/آمار و گزارش/, 'آمار').replace(/پیام‌ها/, 'پیام').replace(/تنظیمات/, 'تنظیمات')}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* My Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">در این پنل فعلاً حداکثر ۱۰۰ آگهی بارگیری می‌شود؛ نمایش همه آگهی‌ها با صفحه‌بندی هنوز در دست توسعه است.</p>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">تصویر</TableHead>
                      <TableHead className="text-right">عنوان</TableHead>
                      <TableHead className="text-right">قیمت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">بازدید</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingListings && <TableRow><TableCell colSpan={6}><div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" />در حال دریافت آگهی‌ها...</div></TableCell></TableRow>}
                    {!isLoadingListings && sellerVehicles.length === 0 && <TableRow><TableCell colSpan={6}><div className="py-8 text-center text-sm text-muted-foreground">هنوز آگهی‌ای ثبت نکرده‌اید.</div></TableCell></TableRow>}
                    {sellerVehicles.map((v) => {
                      const status = statusMap[v.status];
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <OptimizedImage src={listingImageUrl(v)} alt={v.brand_name} width={128} height={88} sizes="64px" className="w-16 h-11 rounded-lg object-cover" />
                          </TableCell>
                          <TableCell>
                            <div>
                              <button className="font-medium text-sm line-clamp-1 hover:text-gold-dark" onClick={() => navigateTo('vehicle-details', { vehicleId: v.id })}>{v.brand_name} {v.model_name}</button>
                              <p className="text-xs text-muted-foreground mt-0.5">{toPersianNumber(v.production_year)}</p>
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
            {listingsError && <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><span>{listingsError}</span><Button size="sm" variant="outline" onClick={() => void loadListings()}>تلاش دوباره</Button></div>}
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="mt-6">
            <MyServiceRequestsPanel serviceType="inspection" />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <ComingSoonNotice title="گزارش عملکرد" detail="بازدید روزانه و تماس‌های امروز هنوز ثبت نمی‌شوند؛ مقادیر نمایشی حذف شده‌اند. اعداد زیر فقط از آگهی‌های بارگیری‌شده در این صفحه محاسبه می‌شوند." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover-lift shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">میانگین قیمت آگهی‌های بارگیری‌شده</p>
                    <DollarSign className="size-5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-bold">{listingStats.averagePrice ? formatPrice(listingStats.averagePrice) : 'بدون داده'}</p>
                  <p className="text-xs text-muted-foreground mt-1">بر اساس آگهی‌های بارگیری‌شده</p>
                </CardContent>
              </Card>
              <Card className="hover-lift shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">آگهی‌های فعال این صفحه</p>
                    <Car className="size-5 text-violet-600" />
                  </div>
                  <p className="text-3xl font-bold">{toPersianNumber(listingStats.active)}</p>
                  <p className="text-xs text-muted-foreground mt-1">از {toPersianNumber(sellerVehicles.length)} آگهی بارگیری‌شده</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="size-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">پیام‌ها: به‌زودی</p>
                <p className="text-sm text-muted-foreground mt-1">اتصال به سامانه پیام‌رسانی هنوز انجام نشده است.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral" className="mt-6">
            <ReferralTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تنظیمات پروفایل فروشنده</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
