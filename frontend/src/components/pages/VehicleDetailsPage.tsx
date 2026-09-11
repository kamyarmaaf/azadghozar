'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown, Calendar, Car, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, Cog, Fuel, Gauge, GitCompareArrows, Heart, Loader2, MapPin,
  MessageSquare, Palette, Phone, RefreshCw, SearchCheck, Share2,
  ShieldCheck, Zap,
} from 'lucide-react';
import { VisitRequestSection } from '@/components/vehicle/VisitRequestSection';
import {
  fetchVehicleListing, fetchVehicleListings, listingImageUrl,
  type PublicListingSummary,
  type VehicleListing,
} from '@/lib/listing-api';
import { formatMileage, formatPrice, toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { MAX_COMPARISON_ITEMS, useComparison } from '@/stores/comparison';
import { useFavorites } from '@/stores/favorites';
import { toast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

function listingDate(value: string | null): string {
  if (!value) return 'در انتظار انتشار';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));
}

function listingPrice(listing: { price: number | null }): string {
  return listing.price === null ? 'برای قیمت تماس بگیرید' : formatPrice(listing.price);
}

export function VehicleDetailsPage() {
  const { navigateTo, pageData } = useNavigation();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const favoriteIds = useFavorites((state) => state.favoriteIds);
  const mutatingFavoriteIds = useFavorites((state) => state.mutatingIds);
  const loadFavorites = useFavorites((state) => state.loadFavorites);
  const toggleListingFavorite = useFavorites((state) => state.toggleFavorite);
  const comparisonIds = useComparison((state) => state.selectedIds);
  const toggleComparison = useComparison((state) => state.toggle);
  const listingId = Number(pageData?.vehicleId);
  const [vehicle, setVehicle] = useState<VehicleListing | null>(null);
  const [similarVehicles, setSimilarVehicles] = useState<PublicListingSummary[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isInteger(listingId) || listingId <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void fetchVehicleListing(listingId)
      .then(async (listing) => {
        if (cancelled) return;
        setVehicle(listing);
        setActiveImage(0);
        setLoadError('');
        try {
          const similar = await fetchVehicleListings({
            brand: listing.brand_name,
            pageSize: 5,
            summary: true,
          });
          if (!cancelled) {
            setSimilarVehicles(similar.results.filter((item) => item.id !== listing.id).slice(0, 4));
          }
        } catch {
          if (!cancelled) setSimilarVehicles([]);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setVehicle(null);
        setLoadError(error instanceof Error ? error.message : 'دریافت جزئیات آگهی انجام نشد.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [listingId, reloadVersion]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [hasHydrated, isAuthenticated, loadFavorites]);

  const images = useMemo(
    () => vehicle?.image_files.map((_, index) => listingImageUrl(vehicle, index)) ?? [],
    [vehicle],
  );
  const isFavorite = favoriteIds.includes(listingId);
  const isFavoriteLoading = mutatingFavoriteIds.includes(listingId);
  const isCompared = comparisonIds.includes(listingId);

  const handleFavorite = async () => {
    if (!vehicle) return;
    if (!isAuthenticated) {
      toast({
        title: 'ابتدا وارد حساب شوید',
        description: 'برای ذخیره آگهی باید وارد حساب کاربری شوید.',
      });
      navigateTo('login');
      return;
    }
    try {
      const saved = await toggleListingFavorite(vehicle);
      toast({
        title: saved ? 'آگهی ذخیره شد' : 'از علاقه‌مندی‌ها حذف شد',
      });
    } catch (error) {
      toast({
        title: 'تغییر علاقه‌مندی انجام نشد',
        description: error instanceof Error ? error.message : 'دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const handleComparison = () => {
    if (isCompared) {
      navigateTo('comparison');
      return;
    }
    const result = toggleComparison(listingId);
    if (result === 'limit') {
      toast({
        title: 'ظرفیت مقایسه تکمیل است',
        description: `حداکثر ${toPersianNumber(MAX_COMPARISON_ITEMS)} خودرو قابل مقایسه است.`,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'خودرو به مقایسه اضافه شد' });
    navigateTo('comparison');
  };

  if (!Number.isInteger(listingId) || listingId <= 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <RefreshCw className="size-12 text-destructive/50" />
        <h1 className="text-lg font-bold">شناسه آگهی معتبر نیست</h1>
        <p className="text-sm text-muted-foreground">آگهی را از صفحه خرید انتخاب کنید.</p>
        <Button onClick={() => navigateTo('buy')}>بازگشت به خرید خودرو</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-10 animate-spin text-gold-dark" />
        <p className="text-sm text-muted-foreground">در حال دریافت جزئیات آگهی...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <RefreshCw className="size-12 text-destructive/50" />
        <h1 className="text-lg font-bold">آگهی قابل نمایش نیست</h1>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <div className="flex gap-2">
          <Button onClick={() => navigateTo('buy')}>بازگشت به خرید خودرو</Button>
          {listingId > 0 && <Button variant="outline" onClick={() => setReloadVersion((value) => value + 1)}>تلاش دوباره</Button>}
        </div>
      </div>
    );
  }

  const specs = [
    { icon: Calendar, label: 'سال ساخت', value: toPersianNumber(vehicle.production_year) },
    { icon: Gauge, label: 'کارکرد', value: formatMileage(vehicle.mileage) },
    { icon: Cog, label: 'گیربکس', value: vehicle.transmission_label },
    { icon: Fuel, label: 'سوخت', value: vehicle.fuel_type_label },
    { icon: Car, label: 'بدنه', value: vehicle.body_type },
    { icon: Palette, label: 'رنگ', value: vehicle.color },
    { icon: ArrowUpDown, label: 'انتقال قدرت', value: vehicle.drivetrain_label },
    { icon: ShieldCheck, label: 'نوع پلاک', value: vehicle.plate_type_label },
  ];
  const nextImage = () => setActiveImage((previous) => (previous + 1) % images.length);
  const previousImage = () => setActiveImage((previous) => (previous - 1 + images.length) % images.length);
  const title = `${vehicle.brand_name} ${vehicle.model_name}`;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('buy')} className="cursor-pointer">خرید خودرو</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/10]">
                <OptimizedImage src={images[activeImage] || '/images/car-1.jpg'} alt={title} width={1200} height={750} priority className="w-full h-full object-cover" />
                {images.length > 1 && (
                  <>
                    <div className="absolute inset-y-0 left-0 flex items-center"><button aria-label="تصویر قبلی" onClick={previousImage} className="p-2 bg-white/80 hover:bg-white rounded-r-lg transition-colors m-2"><ChevronLeft className="size-5" /></button></div>
                    <div className="absolute inset-y-0 right-0 flex items-center justify-end"><button aria-label="تصویر بعدی" onClick={nextImage} className="p-2 bg-white/80 hover:bg-white rounded-l-lg transition-colors m-2"><ChevronRight className="size-5" /></button></div>
                  </>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                  {vehicle.is_instant_sale && <Badge className="bg-destructive text-white">فروش فوری</Badge>}
                  {vehicle.is_special_sale && <Badge className="bg-gold text-white">فروش ویژه</Badge>}
                  {vehicle.is_inspected && <Badge variant="secondary" className="bg-success/90 text-white"><CheckCircle2 className="size-3 ml-1" />بازرسی شده</Badge>}
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {images.map((image, index) => (
                    <button key={image} onClick={() => setActiveImage(index)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${index === activeImage ? 'border-gold' : 'border-transparent'}`}>
                      <OptimizedImage src={image} alt={`تصویر ${toPersianNumber(index + 1)} ${title}`} width={160} height={128} sizes="80px" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted-foreground text-sm mt-1">{vehicle.trim_name || 'تیپ پایه'} · مدل {toPersianNumber(vehicle.production_year)}</p></div>
                <p className="text-2xl font-bold text-brand">{listingPrice(vehicle)}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline"><MapPin className="size-3 ml-1" />{vehicle.city}</Badge>
                <Badge variant="outline"><Clock className="size-3 ml-1" />{listingDate(vehicle.published_at || vehicle.created_at)}</Badge>
                <Badge variant="outline">{vehicle.plate_type_label}{vehicle.free_zone ? ` - ${vehicle.free_zone}` : ''}</Badge>
              </div>
            </div>

            <Separator />
            <section>
              <h2 className="text-lg font-semibold mb-4">مشخصات کلیدی</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map((spec) => {
                  const Icon = spec.icon;
                  return <div key={spec.label} className="bg-secondary/50 rounded-xl p-3 text-center"><Icon className="size-5 mx-auto text-gold-dark mb-1.5" /><p className="text-xs text-muted-foreground">{spec.label}</p><p className="font-semibold text-sm mt-0.5">{spec.value || 'ثبت نشده'}</p></div>;
                })}
              </div>
            </section>

            <Separator />
            <section>
              <h2 className="text-lg font-semibold mb-3">وضعیت خودرو</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[['وضعیت کلی', vehicle.condition_label], ['بدنه', vehicle.body_condition_label], ['شاسی', vehicle.chassis_condition_label], ['موتور', vehicle.engine_condition_label]].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-1">{value}</p></div>
                ))}
              </div>
            </section>

            <Separator />
            <section><h2 className="text-lg font-semibold mb-3">توضیحات فروشنده</h2><p className="text-sm text-muted-foreground leading-7 whitespace-pre-line">{vehicle.description || 'توضیحی ثبت نشده است.'}</p></section>
            <Separator />
            <VisitRequestSection vehicleBrand={vehicle.brand_name} vehicleModel={vehicle.model_name} sellerName={vehicle.owner_name} city={vehicle.city} />

            <div className="lg:hidden flex flex-wrap gap-2">
              <Button className="flex-1" disabled={isFavoriteLoading} onClick={() => void handleFavorite()}>{isFavoriteLoading ? <Loader2 className="size-4 animate-spin" /> : <Heart className={`size-4 ${isFavorite ? 'fill-destructive' : ''}`} />}{isFavorite ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}</Button>
              <Button variant="outline" className="flex-1" onClick={handleComparison}><GitCompareArrows className="size-4" />{isCompared ? 'مشاهده مقایسه' : 'مقایسه'}</Button>
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="py-0">
              <CardHeader className="p-4"><CardTitle className="text-base">اطلاعات فروشنده</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="flex items-center gap-3">
                  {vehicle.owner_business_logo ? <OptimizedImage src={vehicle.owner_business_logo} alt={vehicle.owner_name} width={96} height={96} sizes="48px" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-white font-bold text-lg">{vehicle.owner_name.charAt(0)}</div>}
                  <div><p className="font-semibold text-sm">{vehicle.owner_name}</p><p className="text-xs text-muted-foreground">{vehicle.owner_role_label}</p></div>
                </div>
                <Separator />
                <div className="space-y-2">
                  {vehicle.contact_preference !== 'chat' && <Button asChild className="w-full gap-2" size="lg"><a href={`tel:${vehicle.contact_number}`} dir="ltr"><Phone className="size-4" />{vehicle.contact_number}</a></Button>}
                  {vehicle.contact_preference !== 'phone' && <Button variant="outline" className="w-full gap-2" size="lg"><MessageSquare className="size-4" />ارسال پیام</Button>}
                </div>
              </CardContent>
            </Card>

            <Card className="py-0 hidden lg:block"><CardContent className="p-4 space-y-2">
              <Button className="w-full gap-2" disabled={isFavoriteLoading} variant={isFavorite ? 'secondary' : 'outline'} onClick={() => void handleFavorite()}>{isFavoriteLoading ? <Loader2 className="size-4 animate-spin" /> : <Heart className={`size-4 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />}{isFavorite ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}</Button>
              <Button variant="outline" className="w-full gap-2" onClick={handleComparison}><GitCompareArrows className="size-4" />{isCompared ? 'مشاهده مقایسه' : 'افزودن به مقایسه'}</Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => void navigator.share?.({ title, url: window.location.href })}><Share2 className="size-4" />اشتراک‌گذاری</Button>
              <Button variant="outline" className="w-full gap-2"><SearchCheck className="size-4" />درخواست بازرسی</Button>
            </CardContent></Card>

            <Card className="py-0 hidden lg:block"><CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">اطلاعات سریع</h3>
              {[['موتور', vehicle.engine_description || 'ثبت نشده'], ['بیمه', vehicle.insurance_months === null ? 'ثبت نشده' : `${toPersianNumber(vehicle.insurance_months)} ماه`], ['مالکیت', vehicle.ownership_status_label], ['بازدید', toPersianNumber(vehicle.view_count)]].map(([label, value], index) => (
                <div key={label}>{index > 0 && <Separator className="mb-3" />}<div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div></div>
              ))}
              {vehicle.trade_possible && <><Separator /><div className="flex items-center gap-2"><Zap className="size-4 text-warning" /><span className="text-sm font-medium">امکان معاوضه وجود دارد</span></div></>}
            </CardContent></Card>
          </aside>
        </div>

        {similarVehicles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">خودروهای مشابه</h2><Button variant="ghost" onClick={() => navigateTo('buy')}>مشاهده همه<ChevronLeft className="size-4" /></Button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarVehicles.map((item) => (
                <Card key={item.id} className="py-0 overflow-hidden hover-lift cursor-pointer" onClick={() => navigateTo('vehicle-details', { vehicleId: item.id })}>
                  <OptimizedImage src={listingImageUrl(item)} alt={`${item.brand_name} ${item.model_name}`} width={640} height={400} sizes="(max-width: 640px) 100vw, 25vw" className="aspect-[16/10] w-full object-cover" />
                  <div className="p-3 space-y-2"><h3 className="font-bold text-sm line-clamp-1">{item.brand_name} {item.model_name}</h3><p className="text-xs text-muted-foreground">{toPersianNumber(item.production_year)} · {formatMileage(item.mileage)}</p><p className="font-bold text-sm text-brand">{listingPrice(item)}</p></div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
