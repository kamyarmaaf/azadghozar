'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Car, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { fetchAllCatalogBrands, type CatalogBrand } from '@/lib/catalog-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const brandColors = [
  'from-slate-900 to-slate-700',
  'from-blue-900 to-blue-700',
  'from-emerald-800 to-emerald-600',
  'from-red-800 to-red-600',
  'from-amber-800 to-amber-600',
  'from-indigo-900 to-indigo-700',
];

function brandTitle(brand: CatalogBrand): string {
  return brand.name_fa.trim() || brand.name;
}

export function BrandsPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetchAllCatalogBrands(query, controller.signal)
        .then((results) => {
          setBrands(results);
          setError('');
        })
        .catch((requestError) => {
          if (!controller.signal.aborted) {
            setError(requestError instanceof Error ? requestError.message : 'دریافت برندها انجام نشد.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const openBrandListings = (brand: CatalogBrand) => {
    navigateTo('brand-detail', { brandSlug: brand.slug });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>برندها</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">برندهای خودرو</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">برندهای ثبت‌شده در بانک اطلاعات خودرو آزادگذر</p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی برند..." className="pr-10" />
          </label>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> در حال دریافت برندها...</div>
        ) : brands.length === 0 ? (
          <Card className="p-10 text-center">
            <Car className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">برندی پیدا نشد</p>
            <p className="mt-1 text-sm text-muted-foreground">برندها از بخش کاتالوگ پنل مدیریت قابل ثبت هستند.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brands.map((brand, index) => (
              <Card key={brand.id} className="group cursor-pointer overflow-hidden py-0 hover-lift" onClick={() => openBrandListings(brand)}>
                <div className={`flex h-28 items-center justify-center bg-gradient-to-br ${brandColors[index % brandColors.length]} p-5`}>
                  {brand.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logo_url} alt={brandTitle(brand)} className="max-h-16 max-w-full object-contain" />
                  ) : (
                    <span className="text-center text-xl font-bold text-white">{brand.name.slice(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1 p-3 text-center">
                  <h2 className="text-sm font-bold">{brandTitle(brand)}</h2>
                  {brand.name_fa && brand.name_fa !== brand.name && <p className="text-[11px] text-muted-foreground">{brand.name}</p>}
                  <p className="text-xs text-muted-foreground">{toPersianNumber(brand.listing_count)} خودروی فعال</p>
                  <Button variant="ghost" size="sm" className="mt-2 w-full text-xs">مشاهده خودروها <ArrowLeft className="size-3" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
