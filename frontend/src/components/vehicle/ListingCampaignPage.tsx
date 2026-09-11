'use client';

import { useEffect, useState } from 'react';
import { Flame, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';
import { PublicListingCard } from '@/components/vehicle/PublicListingCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { brands, bodyTypes } from '@/lib/mock-data';
import {
  fetchVehicleListings,
  type PublicListingSummary,
} from '@/lib/listing-api';
import { toPersianNumber } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useFavorites } from '@/stores/favorites';
import { useNavigation } from '@/stores/navigation';

interface ListingCampaignPageProps {
  kind: 'instant' | 'special';
}

function priceValue(value: string): number | undefined {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬\s]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number * 1_000_000 : undefined;
}

export function ListingCampaignPage({ kind }: ListingCampaignPageProps) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const loadFavorites = useFavorites((state) => state.loadFavorites);
  const [listings, setListings] = useState<PublicListingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [brand, setBrand] = useState('all');
  const [bodyType, setBodyType] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const isInstant = kind === 'instant';

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [hasHydrated, isAuthenticated, loadFavorites]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void fetchVehicleListings({
        pageSize: 100,
        brand: brand === 'all' ? undefined : brand,
        bodyType: bodyType === 'all' ? undefined : bodyType,
        priceMin: priceValue(priceMin),
        priceMax: priceValue(priceMax),
        instantSale: isInstant,
        specialSale: !isInstant,
        summary: true,
      })
        .then((response) => {
          if (cancelled) return;
          setListings(response.results);
          setTotal(response.count);
          setError('');
        })
        .catch((loadError) => {
          if (cancelled) return;
          setListings([]);
          setTotal(0);
          setError(loadError instanceof Error ? loadError.message : 'دریافت آگهی‌ها انجام نشد.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [bodyType, brand, isInstant, priceMax, priceMin, reloadVersion]);

  const title = isInstant ? 'فروش فوری خودروها' : 'پیشنهادات ویژه آزاد گذر';
  const description = isInstant
    ? 'خودروهای آماده فروش فوری را مستقیم از آگهی‌های تاییدشده مشاهده کنید.'
    : 'بهترین فرصت‌های خرید و آگهی‌های ویژه تاییدشده آزاد گذر';
  const Icon = isInstant ? Flame : Sparkles;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{isInstant ? 'فروش فوری' : 'فروش ویژه'}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={isInstant ? 'p-2 rounded-lg bg-destructive/10' : 'p-2 rounded-lg bg-gradient-powder'}>
              <Icon className={isInstant ? 'size-6 text-destructive' : 'size-6 text-white'} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">{description}</p>
        </div>

        <Card className="mb-6 py-0">
          <div className="p-4 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm font-medium mb-2 block">برند</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-full"><SelectValue placeholder="همه برندها" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه برندها</SelectItem>
                  {brands.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-sm font-medium mb-2 block">نوع بدنه</Label>
              <Select value={bodyType} onValueChange={setBodyType}>
                <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {bodyTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm font-medium mb-2 block">قیمت از (میلیون)</Label>
              <Input placeholder="مثلاً ۵۰۰۰" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-sm font-medium mb-2 block">قیمت تا (میلیون)</Label>
              <Input placeholder="مثلاً ۳۰۰۰۰" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} />
            </div>
          </div>
        </Card>

        <p className="text-sm text-muted-foreground mb-4">{toPersianNumber(total)} آگهی یافت شد</p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="size-10 animate-spin text-gold-dark mb-3" />
            <p className="text-sm text-muted-foreground">در حال دریافت آگهی‌های واقعی...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="size-12 text-destructive/50 mb-3" />
            <h3 className="text-lg font-semibold mb-2">دریافت آگهی‌ها ناموفق بود</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => setReloadVersion((value) => value + 1)}>تلاش دوباره</Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="size-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">آگهی‌ای یافت نشد</h3>
            <p className="text-muted-foreground text-sm">فیلترها را تغییر دهید یا بعداً دوباره بررسی کنید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <PublicListingCard
                key={listing.id}
                listing={listing}
                emphasis={isInstant ? 'instant' : 'special'}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
