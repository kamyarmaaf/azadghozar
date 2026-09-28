'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Search } from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { useContentPage } from '@/hooks/use-content-page';
import {
  contentDate,
  contentImageUrl,
  fetchContentCategories,
  type Article,
  type ContentCategory,
  type EducationalVideo,
} from '@/lib/content-api';
import { toPersianNumber } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContentListingPage({ kind }: { kind: 'videos' | 'articles' }) {
  const { navigateTo } = useNavigation();
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = kind === 'videos' ? 8 : 9;
  const { data, loading, error, reload } = useContentPage<EducationalVideo | Article>(kind, {
    page, pageSize, category, q: search,
  });
  const title = kind === 'videos' ? 'ویدیوهای آموزشی' : 'مجله خودرو آزادگذر';

  useEffect(() => {
    let active = true;
    fetchContentCategories(kind).then(
      (result) => { if (active) setCategories(result); },
      () => { if (active) setCategories([]); },
    );
    return () => { active = false; };
  }, [kind]);

  return (
    <main className="min-h-screen bg-background py-8" dir="rtl">
      <div className="container mx-auto max-w-7xl px-4">
        <button type="button" onClick={() => navigateTo('home')} className="mb-5 text-sm text-muted-foreground hover:text-foreground">خانه / {title}</button>
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">محتوای منتشرشدهٔ آزادگذر</p>
        <div className="mb-5 flex max-w-md items-center gap-2">
          <Search className="size-5 text-muted-foreground" />
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جستجو در محتوا" />
        </div>
        <div className="mb-7 flex flex-wrap gap-2">
          <Button size="sm" variant={category === 'all' ? 'default' : 'outline'} onClick={() => { setCategory('all'); setPage(1); }}>همه</Button>
          {categories.map((item) => (
            <Button key={item.value} size="sm" variant={category === item.value ? 'default' : 'outline'} onClick={() => { setCategory(item.value); setPage(1); }}>{item.label}</Button>
          ))}
        </div>
        {loading && <p role="status" className="py-10 text-sm">در حال دریافت محتوا...</p>}
        {error && <div className="py-10 text-sm text-destructive">{error} <button type="button" onClick={reload} className="underline">تلاش دوباره</button></div>}
        {!loading && !error && !data?.results.length && <p className="py-10 text-sm text-muted-foreground">محتوایی برای این جستجو منتشر نشده است.</p>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((item) => {
            const isVideo = kind === 'videos';
            const image = isVideo ? (item as EducationalVideo).thumbnail_url : (item as Article).cover_image_url;
            return (
              <button key={item.id} type="button" className="group overflow-hidden rounded-xl border bg-white text-right hover:shadow-lg" onClick={() => navigateTo(isVideo ? 'video-detail' : 'article-detail', isVideo ? { videoSlug: item.slug } : { articleSlug: item.slug })}>
                <div className="relative h-44 bg-slate-100">
                  {image ? <OptimizedImage src={contentImageUrl(image)} alt={item.title} fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">تصویر ثبت نشده است</div>}
                  {isVideo && <Play className="absolute bottom-3 right-3 size-9 rounded-full bg-white p-2 text-brand" />}
                </div>
                <div className="space-y-2 p-4">
                  <span className="text-xs text-gold-dark">{item.category_label}</span>
                  <h2 className="line-clamp-2 text-base font-semibold leading-7">{item.title}</h2>
                  {!isVideo && <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{(item as Article).summary}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{isVideo ? (item as EducationalVideo).duration : (item as Article).read_time}</span>
                    <span>{contentDate(item.published_at)}</span>
                    <ArrowLeft className="size-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!!data && data.count > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <Button variant="outline" disabled={!data.previous || loading} onClick={() => setPage((value) => value - 1)}><ChevronRight className="size-4" /> قبلی</Button>
            <span>صفحه {toPersianNumber(page)} از {toPersianNumber(Math.ceil(data.count / pageSize))}</span>
            <Button variant="outline" disabled={!data.next || loading} onClick={() => setPage((value) => value + 1)}>بعدی <ChevronLeft className="size-4" /></Button>
          </div>
        )}
      </div>
    </main>
  );
}
