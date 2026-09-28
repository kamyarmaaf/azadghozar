'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Loader2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  fetchBusinesses,
  type BusinessKind,
  type BusinessProfile,
} from '@/lib/business-api';
import { toPersianNumber } from '@/lib/utils';
import { type PageId, useNavigation } from '@/stores/navigation';

interface Props {
  kind: BusinessKind;
  detailPage: PageId;
  title: string;
  description: string;
}

export function BusinessDirectoryPage({
  kind,
  detailPage,
  title,
  description,
}: Props) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<BusinessProfile[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const page = await fetchBusinesses({
          kind,
          query,
          pageSize: 12,
          signal: controller.signal,
        });
        setItems(page.results);
        setNextUrl(page.next);
        setError('');
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'دریافت اطلاعات انجام نشد.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kind, query]);

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchBusinesses({ nextUrl });
      setItems((current) => [...current, ...page.results]);
      setNextUrl(page.next);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'دریافت صفحه بعد انجام نشد.',
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          <label className="relative block w-full md:w-80">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی نام یا شهر..."
              className="pr-10"
              aria-label="جست‌وجوی کسب‌وکار"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> در حال دریافت...
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            نتیجه‌ای پیدا نشد.
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {toPersianNumber(items.length)} مورد بارگذاری شده
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((business) => (
                <Card
                  key={business.id}
                  className="group cursor-pointer overflow-hidden py-0 hover-lift"
                  onClick={() =>
                    navigateTo(detailPage, { businessSlug: business.slug })
                  }
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand to-brand-light">
                    {business.cover ? (
                      <OptimizedImage
                        src={business.cover}
                        alt={`کاور ${business.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Building2 className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 text-white/25" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-emerald-700">
                      <ShieldCheck className="size-3.5" /> تأیید شده
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-3 text-white">
                      <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow">
                        {business.logo ? (
                          <OptimizedImage src={business.logo} alt={business.name} width={96} height={96} className="size-full object-cover" />
                        ) : (
                          <Building2 className="size-6 text-brand" />
                        )}
                      </div>
                      <div>
                        <h2 className="font-bold">{business.name}</h2>
                        <span className="flex items-center gap-1 text-xs text-white/80">
                          <MapPin className="size-3" /> {business.city || business.province || 'ایران'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-muted-foreground">
                      {toPersianNumber(business.listing_count)} خودروی فعال
                    </span>
                    <Button variant="ghost" size="sm">
                      مشاهده <ArrowLeft className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {nextUrl && (
              <div className="mt-8 text-center">
                <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  نمایش موارد بیشتر
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
