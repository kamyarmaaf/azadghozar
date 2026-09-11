'use client';

import { GitCompareArrows, Heart, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { toast } from '@/hooks/use-toast';
import {
  listingImageUrl,
  type PublicListingSummary,
  type VehicleListing,
} from '@/lib/listing-api';
import { formatMileage, formatPrice, toPersianNumber } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { MAX_COMPARISON_ITEMS, useComparison } from '@/stores/comparison';
import { useFavorites } from '@/stores/favorites';
import { useNavigation } from '@/stores/navigation';

interface PublicListingCardProps {
  listing: VehicleListing | PublicListingSummary;
  emphasis?: 'instant' | 'special' | 'default';
  compact?: boolean;
}

export function PublicListingCard({
  listing,
  emphasis = 'default',
  compact = false,
}: PublicListingCardProps) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const favoriteIds = useFavorites((state) => state.favoriteIds);
  const mutatingIds = useFavorites((state) => state.mutatingIds);
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);
  const comparisonIds = useComparison((state) => state.selectedIds);
  const toggleComparison = useComparison((state) => state.toggle);
  const isFavorite = favoriteIds.includes(listing.id);
  const isMutating = mutatingIds.includes(listing.id);
  const isCompared = comparisonIds.includes(listing.id);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'ابتدا وارد حساب شوید',
        description: 'برای ذخیره آگهی باید وارد حساب کاربری شوید.',
      });
      navigateTo('login');
      return;
    }
    try {
      const saved = await toggleFavorite(listing);
      toast({ title: saved ? 'آگهی ذخیره شد' : 'از علاقه‌مندی‌ها حذف شد' });
    } catch (error) {
      toast({
        title: 'ذخیره آگهی انجام نشد',
        description: error instanceof Error ? error.message : 'دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleComparison = () => {
    const result = toggleComparison(listing.id);
    if (result === 'limit') {
      toast({
        title: 'ظرفیت مقایسه تکمیل است',
        description: `حداکثر ${toPersianNumber(MAX_COMPARISON_ITEMS)} خودرو قابل مقایسه است.`,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: result === 'added' ? 'به مقایسه اضافه شد' : 'از مقایسه حذف شد' });
  };

  const badge = emphasis === 'instant'
    ? 'فروش فوری'
    : emphasis === 'special'
      ? 'فروش ویژه'
      : listing.is_instant_sale
        ? 'فروش فوری'
        : listing.is_special_sale
          ? 'فروش ویژه'
          : '';

  return (
    <Card className="py-0 overflow-hidden hover-lift group h-full">
      <div className={`relative overflow-hidden bg-muted ${compact ? 'h-48' : 'aspect-[16/10]'}`}>
        <OptimizedImage
          src={listingImageUrl(listing)}
          alt={`${listing.brand_name} ${listing.model_name}`}
          width={640}
          height={400}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
          onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
        />
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {badge && (
            <Badge className={emphasis === 'instant' || listing.is_instant_sale ? 'bg-destructive text-white' : 'bg-gold text-white'}>
              {badge}
            </Badge>
          )}
          {listing.is_inspected && <Badge className="bg-success text-white">کارشناسی شده</Badge>}
        </div>
        <button
          type="button"
          aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          disabled={isMutating}
          onClick={() => void handleFavorite()}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm disabled:opacity-60"
        >
          {isMutating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Heart className={`size-4 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
          )}
        </button>
        <button
          type="button"
          aria-label={isCompared ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
          onClick={handleComparison}
          className={`absolute top-14 left-3 p-2 rounded-full transition-colors shadow-sm ${
            isCompared
              ? 'bg-brand text-white'
              : 'bg-white/90 hover:bg-white text-foreground'
          }`}
        >
          <GitCompareArrows className="size-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm line-clamp-1">
            {listing.brand_name} {listing.model_name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {listing.trim_name || 'تیپ پایه'} · {toPersianNumber(listing.production_year)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>{listing.plate_type_label}</span>
          <span>{formatMileage(listing.mileage)}</span>
          <span>{listing.city}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t gap-2">
          <div>
            <p className="text-xs text-muted-foreground">قیمت</p>
            <p className="font-bold text-sm text-brand">
              {listing.price === null ? 'تماس بگیرید' : formatPrice(listing.price)}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
          >
            جزئیات
          </Button>
        </div>
      </div>
    </Card>
  );
}
