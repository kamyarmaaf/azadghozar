'use client';

import { useEffect, useState } from 'react';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { useComparison } from '@/stores/comparison';
import { useFavorites } from '@/stores/favorites';
import { cn, toPersianNumber, formatPrice, formatMileage } from '@/lib/utils';
import {
  comparisonImageUrl,
  fetchComparisonListings,
  listingImageUrl,
  type ComparisonListing,
} from '@/lib/listing-api';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Heart, GitCompare, History, FileText, MessageSquare,
  Settings, Eye, MapPin, UserPlus, UserCog, Loader2
} from 'lucide-react';
import { ReferralTab } from '@/components/dashboard/ReferralTab';
import { RoleChangeTab } from '@/components/dashboard/RoleChangeTab';
import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ComingSoonNotice } from '@/components/ui/coming-soon';
import { MyServiceRequestsPanel } from '@/components/services/MyServiceRequestsPanel';

export function BuyerDashboardPage() {
  const navigateTo = useNavigation((s) => s.navigateTo);
  const currentUser = useAuth((state) => state.currentUser);
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const favoriteListings = useFavorites((state) => state.listings);
  const mutatingFavoriteIds = useFavorites((state) => state.mutatingIds);
  const favoritesLoading = useFavorites((state) => state.isLoading);
  const favoritesLoaded = useFavorites((state) => state.hasLoaded);
  const loadFavorites = useFavorites((state) => state.loadFavorites);
  const removeFavorite = useFavorites((state) => state.removeFavorite);
  const comparisonIds = useComparison((state) => state.selectedIds);
  const [comparisonListings, setComparisonListings] = useState<ComparisonListing[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [isAuthenticated, loadFavorites]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (comparisonIds.length === 0) {
        setComparisonListings([]);
        return;
      }
      setComparisonLoading(true);
      fetchComparisonListings(comparisonIds, controller.signal)
        .then(setComparisonListings)
        .catch(() => {
          if (!controller.signal.aborted) setComparisonListings([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setComparisonLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [comparisonIds]);

  const handleRemoveFavorite = async (listingId: number) => {
    try {
      await removeFavorite(listingId);
      toast({ title: 'آگهی از علاقه‌مندی‌ها حذف شد' });
    } catch (error) {
      toast({
        title: 'حذف آگهی انجام نشد',
        description: error instanceof Error ? error.message : 'دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const stats = [
    { label: 'آگهی ذخیره شده', value: toPersianNumber(favoriteListings.length), icon: Heart, color: 'text-rose-500 bg-rose-50' },
    { label: 'مقایسه‌ها', value: toPersianNumber(comparisonIds.length), icon: GitCompare, color: 'text-gold-dark bg-gold/10' },
  ];

  const tabs = [
    { value: 'saved', label: 'آگهی‌های ذخیره شده', icon: Heart },
    { value: 'compare', label: 'لیست مقایسه', icon: GitCompare },
    { value: 'history', label: 'تاریخچه (به‌زودی)', icon: History },
    { value: 'requests', label: 'درخواست‌های من', icon: FileText },
    { value: 'messages', label: 'پیام‌ها (به‌زودی)', icon: MessageSquare },
    { value: 'referral', label: 'دعوت از دوستان', icon: UserPlus },
    { value: 'role-change', label: 'تغییر نقش', icon: UserCog },
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
              <h1 className="text-xl font-bold">پنل کاربری خریدار</h1>
              <p className="text-sm text-muted-foreground">{currentUser?.name || 'کاربر آزادگذر'}، خوش آمدید</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">اعلان‌ها: به‌زودی</span>
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
        <Tabs defaultValue="saved">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="w-full md:w-auto flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 whitespace-nowrap">
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.replace(/آگهی‌های /, '').replace(/لیست /, '').replace(/تاریخچه /, '').replace(/درخواست‌های /, '').replace(/پیام‌ها/, 'پیام‌ها').replace(/تنظیمات/, 'تنظیمات')}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Saved Listings Tab */}
          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">آگهی‌های ذخیره شده</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-0 p-0">
                {favoritesLoading && !favoritesLoaded ? (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                    در حال دریافت آگهی‌های ذخیره‌شده...
                  </div>
                ) : favoriteListings.length === 0 ? (
                  <div className="p-10 text-center">
                    <Heart className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-medium">هنوز آگهی‌ای ذخیره نکرده‌اید</p>
                    <Button variant="outline" className="mt-3" onClick={() => navigateTo('buy')}>مشاهده آگهی‌ها</Button>
                  </div>
                ) : favoriteListings.map((listing, index) => (
                  <div key={listing.id}>
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}>
                      <OptimizedImage src={listingImageUrl(listing)} alt={`${listing.brand_name} ${listing.model_name}`} width={224} height={160} sizes="112px" className="w-24 h-16 md:w-28 md:h-20 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">{listing.brand_name} {listing.model_name} {listing.trim_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{toPersianNumber(listing.production_year)} · {listing.price === null ? 'تماس بگیرید' : formatPrice(listing.price)}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />{listing.city}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" />{formatMileage(listing.mileage)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        disabled={mutatingFavoriteIds.includes(listing.id)}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveFavorite(listing.id);
                        }}
                      >
                        {mutatingFavoriteIds.includes(listing.id) ? <Loader2 className="size-5 animate-spin" /> : <Heart className="size-5 fill-rose-500 text-rose-500" />}
                      </Button>
                    </div>
                    {index < favoriteListings.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="compare" className="mt-6">
            {comparisonLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                در حال دریافت فهرست مقایسه...
              </div>
            ) : comparisonListings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitCompare className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground mb-4">هنوز خودرویی برای مقایسه انتخاب نکرده‌اید.</p>
                  <Button onClick={() => navigateTo('comparison')}>انتخاب خودرو</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {comparisonListings.map((listing) => (
                    <Card key={listing.id} className="hover-lift shadow-card overflow-hidden py-0">
                      <OptimizedImage
                        src={comparisonImageUrl(listing)}
                        alt={`${listing.brand_name} ${listing.model_name}`}
                        width={720}
                        height={384}
                        className="w-full h-48 object-cover"
                      />
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg">{listing.brand_name} {listing.model_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{listing.trim_name || 'تیپ پایه'}</p>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="text-sm"><span className="text-muted-foreground">سال:</span> {toPersianNumber(listing.production_year)}</div>
                          <div className="text-sm"><span className="text-muted-foreground">کارکرد:</span> {formatMileage(listing.mileage)}</div>
                          <div className="text-sm"><span className="text-muted-foreground">گیربکس:</span> {listing.transmission_label}</div>
                          <div className="text-sm"><span className="text-muted-foreground">سوخت:</span> {listing.fuel_type_label}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-lg font-bold text-primary">
                            {listing.price === null ? 'تماس بگیرید' : formatPrice(listing.price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-center mt-5">
                  <Button variant="outline" onClick={() => navigateTo('comparison')}>مشاهده جدول کامل مقایسه</Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <ComingSoonNotice title="تاریخچه بازدید" detail="ثبت و نمایش تاریخچه واقعی هنوز راه‌اندازی نشده است؛ رویدادهای نمونه نمایش داده نمی‌شوند." />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <MyServiceRequestsPanel />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6">
            <ComingSoonNotice title="پیام‌ها" detail="گفت‌وگوی خریدار و فروشنده هنوز به سامانهٔ پیام متصل نیست." />
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral" className="mt-6">
            <ReferralTab />
          </TabsContent>

          {/* Role Change Tab */}
          <TabsContent value="role-change" className="mt-6">
            <RoleChangeTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات شخصی</CardTitle>
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
