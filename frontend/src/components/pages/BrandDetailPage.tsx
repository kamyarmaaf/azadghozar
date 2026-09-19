'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Car, Loader2, MapPin } from 'lucide-react';
import { PublicListingCard } from '@/components/vehicle/PublicListingCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  fetchCatalogBrand,
  fetchCatalogModels,
  type CatalogBrand,
  type CatalogVehicleModel,
} from '@/lib/catalog-api';
import { fetchVehicleListings, type PublicListingSummary } from '@/lib/listing-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

function displayName(brand: CatalogBrand): string {
  return brand.name_fa.trim() || brand.name;
}

export function BrandDetailPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const pageData = useNavigation((state) => state.pageData);
  const brandSlug = typeof pageData?.brandSlug === 'string' ? pageData.brandSlug : '';
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [models, setModels] = useState<CatalogVehicleModel[]>([]);
  const [listings, setListings] = useState<PublicListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    if (!brandSlug) {
      return () => controller.abort();
    }
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchCatalogBrand(brandSlug, controller.signal)
      .then(async (brandResult) => {
        const title = displayName(brandResult);
        const [modelResults, listingPage] = await Promise.all([
          fetchCatalogModels(brandResult.slug, controller.signal),
          fetchVehicleListings({ brand: title, page: 1, pageSize: 12, summary: true }),
        ]);
        if (controller.signal.aborted) return;
        setBrand(brandResult);
        setModels(modelResults);
        setListings(listingPage.results);
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'دریافت اطلاعات برند انجام نشد.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [brandSlug]);

  if (!brandSlug) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="mb-4 text-red-700">نشانی برند مشخص نیست.</p>
        <Button onClick={() => navigateTo('brands')}>بازگشت به برندها</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-2"><Loader2 className="size-5 animate-spin" /> در حال دریافت اطلاعات برند...</div>;
  }

  if (error || !brand) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="mb-4 text-red-700">{error || 'برند پیدا نشد.'}</p>
        <Button onClick={() => navigateTo('brands')}>بازگشت به برندها</Button>
      </div>
    );
  }

  const title = displayName(brand);
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-7">
        <Button variant="ghost" className="mb-4" onClick={() => navigateTo('brands')}>بازگشت به برندها</Button>

        <Card className="mb-8 overflow-hidden p-0">
          <div className="relative min-h-64 overflow-hidden bg-gradient-to-l from-slate-950 to-slate-800 text-white">
            {brand.banner_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.banner_url} alt={`بنر ${title}`} className="absolute inset-0 size-full object-cover" />
            )}
            <div className={`absolute inset-0 ${brand.banner_url ? 'bg-slate-950/70' : 'bg-transparent'}`} />
            <div className="relative grid p-6 md:grid-cols-[1fr_220px] md:items-center md:p-9">
              <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold md:text-4xl">{title}</h1>
                {brand.country && <Badge variant="secondary"><MapPin className="size-3" /> {brand.country}</Badge>}
              </div>
              {brand.name_fa && brand.name_fa !== brand.name && <p className="text-white/65">{brand.name}</p>}
              <p className="mt-4 text-sm text-white/75">{toPersianNumber(brand.listing_count)} خودروی فعال در آزادگذر</p>
              <Button className="mt-5 bg-white text-slate-950 hover:bg-white/90" onClick={() => navigateTo('buy', { brands: [title] })}>
                مشاهده همه خودروها <ArrowLeft className="size-4" />
              </Button>
              </div>
              <div className="mt-6 flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-5 shadow-lg md:mt-0">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo_url} alt={`لوگوی ${title}`} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-4xl font-bold text-slate-800">{brand.name.slice(0, 3).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <section className="mb-9">
          <h2 className="mb-4 text-lg font-bold">مدل‌های {title}</h2>
          {models.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">هنوز مدلی در کاتالوگ این برند ثبت نشده است.</Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {models.map((model) => (
                <Button key={model.id} variant="outline" onClick={() => navigateTo('buy', { brands: [title], search: model.name_fa || model.name })}>
                  {model.name_fa || model.name}
                  {model.body_type && <span className="text-xs text-muted-foreground">({model.body_type})</span>}
                </Button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">خودروهای فعال {title}</h2>
            {brand.listing_count > listings.length && <Button variant="ghost" onClick={() => navigateTo('buy', { brands: [title] })}>مشاهده همه <ArrowLeft className="size-4" /></Button>}
          </div>
          {listings.length === 0 ? (
            <Card className="p-9 text-center text-sm text-muted-foreground"><Car className="mx-auto mb-3 size-9" />در حال حاضر آگهی فعالی برای این برند وجود ندارد.</Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <PublicListingCard key={listing.id} listing={listing} />)}</div>
          )}
        </section>
      </div>
    </main>
  );
}
