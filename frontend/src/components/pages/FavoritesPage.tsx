'use client';

import { useEffect } from 'react';
import {
  CalendarDays,
  Fuel,
  Gauge,
  Heart,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { useFavorites } from '@/stores/favorites';
import { formatMileage, formatPrice, toPersianNumber } from '@/lib/utils';
import { listingImageUrl } from '@/lib/listing-api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { toast } from '@/hooks/use-toast';

export function FavoritesPage() {
  const { navigateTo } = useNavigation();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const listings = useFavorites((state) => state.listings);
  const mutatingIds = useFavorites((state) => state.mutatingIds);
  const isLoading = useFavorites((state) => state.isLoading);
  const hasLoaded = useFavorites((state) => state.hasLoaded);
  const error = useFavorites((state) => state.error);
  const loadFavorites = useFavorites((state) => state.loadFavorites);
  const removeFavorite = useFavorites((state) => state.removeFavorite);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [hasHydrated, isAuthenticated, loadFavorites]);

  const handleRemove = async (listingId: number) => {
    try {
      await removeFavorite(listingId);
      toast({ title: 'آگهی از علاقه‌مندی‌ها حذف شد' });
    } catch (removeError) {
      toast({
        title: 'حذف آگهی انجام نشد',
        description: removeError instanceof Error ? removeError.message : 'دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
            <Heart className="size-6 text-red-500" />
            مورد علاقه‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {toPersianNumber(listings.length)} خودرو ذخیره شده
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!hasHydrated || (isAuthenticated && isLoading && !hasLoaded) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="size-10 animate-spin text-gold-dark mb-3" />
            <p className="text-sm text-muted-foreground">در حال دریافت علاقه‌مندی‌ها...</p>
          </div>
        ) : !isAuthenticated ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Heart className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand mb-2">برای مشاهده علاقه‌مندی‌ها وارد شوید</h3>
              <p className="text-sm text-muted-foreground mb-4">آگهی‌های ذخیره‌شده به حساب کاربری شما متصل می‌شوند.</p>
              <Button onClick={() => navigateTo('login')}>ورود به حساب کاربری</Button>
            </CardContent>
          </Card>
        ) : error && listings.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <RefreshCw className="size-12 text-destructive/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand mb-2">دریافت علاقه‌مندی‌ها ناموفق بود</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => void loadFavorites(true).catch(() => undefined)}>تلاش دوباره</Button>
            </CardContent>
          </Card>
        ) : listings.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Heart className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand mb-2">لیست خالی است</h3>
              <p className="text-sm text-muted-foreground mb-4">خودروهای مورد علاقه خود را اضافه کنید</p>
              <Button onClick={() => navigateTo('buy')}>مشاهده خودروها</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover-lift py-0">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <OptimizedImage
                    src={listingImageUrl(listing)}
                    alt={`${listing.brand_name} ${listing.model_name}`}
                    width={720}
                    height={384}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  {(listing.is_instant_sale || listing.is_special_sale) && (
                    <Badge className={`absolute top-3 left-3 ${listing.is_instant_sale ? 'bg-destructive text-white' : 'bg-gold text-white'}`}>
                      {listing.is_instant_sale ? 'فروش فوری' : 'فروش ویژه'}
                    </Badge>
                  )}
                  <button
                    type="button"
                    aria-label="حذف از علاقه‌مندی‌ها"
                    disabled={mutatingIds.includes(listing.id)}
                    onClick={() => void handleRemove(listing.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {mutatingIds.includes(listing.id) ? (
                      <Loader2 className="size-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="size-4 text-red-500" />
                    )}
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-brand text-sm mb-1">
                    {listing.brand_name} {listing.model_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {listing.trim_name || 'تیپ پایه'} · {listing.city}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays className="size-3" />{toPersianNumber(listing.production_year)}</span>
                    <span className="flex items-center gap-1"><Gauge className="size-3" />{formatMileage(listing.mileage)}</span>
                    <span className="flex items-center gap-1"><Fuel className="size-3" />{listing.fuel_type_label}</span>
                  </div>
                  <span className="text-sm font-bold text-brand">
                    {listing.price === null ? 'برای قیمت تماس بگیرید' : formatPrice(listing.price)}
                  </span>
                  <Button
                    variant="outline"
                    className="w-full mt-3 h-9 text-xs rounded-lg"
                    onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
                  >
                    مشاهده جزئیات
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
