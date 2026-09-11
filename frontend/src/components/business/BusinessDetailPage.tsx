'use client';

import { useEffect, useState } from 'react';
import { Building2, Calendar, Car, Eye, Loader2, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { PublicListingCard } from '@/components/vehicle/PublicListingCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  fetchBusiness,
  fetchBusinessListings,
  type BusinessProfile,
} from '@/lib/business-api';
import type { PublicListingSummary } from '@/lib/listing-api';
import { toPersianNumber } from '@/lib/utils';
import { type PageId, useNavigation } from '@/stores/navigation';

interface Props {
  directoryPage: PageId;
}

export function BusinessDetailPage({ directoryPage }: Props) {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const pageData = useNavigation((state) => state.pageData);
  const slug = typeof pageData?.businessSlug === 'string' ? pageData.businessSlug : '';
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [listings, setListings] = useState<PublicListingSummary[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!slug) {
      return () => { active = false; };
    }
    void Promise.all([fetchBusiness(slug), fetchBusinessListings(slug)])
      .then(([profile, page]) => {
        if (!active) return;
        setBusiness(profile);
        setListings(page.results);
        setNextUrl(page.next);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'دریافت اطلاعات انجام نشد.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  const loadMore = async () => {
    if (!business || !nextUrl) return;
    const page = await fetchBusinessListings(business.slug, nextUrl);
    setListings((current) => [...current, ...page.results]);
    setNextUrl(page.next);
  };

  if (!slug) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="mb-4 text-red-700">نشانی کسب‌وکار مشخص نیست.</p>
        <Button onClick={() => navigateTo(directoryPage)}>بازگشت به فهرست</Button>
      </div>
    );
  }
  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-2"><Loader2 className="size-5 animate-spin" /> در حال دریافت...</div>;
  }
  if (error || !business) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="mb-4 text-red-700">{error || 'کسب‌وکار پیدا نشد.'}</p>
        <Button onClick={() => navigateTo(directoryPage)}>بازگشت به فهرست</Button>
      </div>
    );
  }

  const stats = [
    { icon: Car, label: 'خودروی فعال', value: business.listing_count },
    { icon: Eye, label: 'بازدید آگهی‌ها', value: business.total_views },
    { icon: Calendar, label: 'سال تأسیس', value: business.established_year || '—' },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-7">
        <Button variant="ghost" className="mb-4" onClick={() => navigateTo(directoryPage)}>
          بازگشت به فهرست
        </Button>
        <div className="relative mb-6 h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-light md:h-72">
          {business.cover && <OptimizedImage src={business.cover} alt={business.name} fill sizes="100vw" className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-5 right-5 flex items-end gap-4 text-white md:bottom-8 md:right-8">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-white md:size-20">
              {business.logo ? <OptimizedImage src={business.logo} alt={business.name} width={160} height={160} className="size-full object-cover" /> : <Building2 className="size-8 text-brand" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold md:text-2xl">{business.name}</h1>
                <Badge className="bg-white text-emerald-700"><ShieldCheck className="size-3.5" /> تأیید شده</Badge>
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm text-white/80"><MapPin className="size-4" /> {business.city || business.province}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <Card key={label} className="p-4 text-center">
                  <Icon className="mx-auto mb-2 size-5 text-gold-dark" />
                  <p className="font-bold">{toPersianNumber(value)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </Card>
              ))}
            </div>
            {business.description && <Card className="p-5"><h2 className="mb-2 font-bold">درباره {business.name}</h2><p className="text-sm leading-7 text-muted-foreground">{business.description}</p></Card>}
            {business.brands.length > 0 && <Card className="p-5"><h2 className="mb-3 font-bold">برندهای فعال</h2><div className="flex flex-wrap gap-2">{business.brands.map((brand) => <Badge key={brand} variant="secondary">{brand}</Badge>)}</div></Card>}
          </div>
          <Card className="h-fit p-5">
            <h2 className="mb-4 font-bold">اطلاعات تماس</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-2 hover:text-foreground"><Phone className="size-4" /> {business.phone}</a>}
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {business.address || `${business.province}، ${business.city}`}</p>
              {business.working_hours && <p>{business.working_hours}</p>}
            </div>
          </Card>
        </div>

        <section className="mt-9">
          <h2 className="mb-4 text-lg font-bold">خودروهای فعال</h2>
          {listings.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">در حال حاضر آگهی فعالی وجود ندارد.</Card> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <PublicListingCard key={listing.id} listing={listing} />)}</div>}
          {nextUrl && <div className="mt-7 text-center"><Button variant="outline" onClick={() => void loadMore()}>نمایش خودروهای بیشتر</Button></div>}
        </section>
      </div>
    </main>
  );
}
