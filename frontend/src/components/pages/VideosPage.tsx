'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Loader2, Play, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { fetchEducationalVideos, fetchVideoCategories, type EducationalVideo, type VideoCategory } from '@/lib/video-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const VIDEOS_PER_PAGE = 8;
const categoryColors: Record<string, string> = {
  rules: 'bg-red-100 text-red-700 border-red-200',
  education: 'bg-blue-100 text-blue-700 border-blue-200',
  comparison: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  guide: 'bg-amber-100 text-amber-700 border-amber-200',
  review: 'bg-violet-100 text-violet-700 border-violet-200',
};

export function VideosPage() {
  const { navigateTo } = useNavigation();
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void fetchVideoCategories(controller.signal).then(setCategories).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchEducationalVideos({ page: currentPage, pageSize: VIDEOS_PER_PAGE, category: activeCategory, signal: controller.signal })
      .then((page) => {
        setVideos(page.results);
        setTotalCount(page.count);
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت ویدیوها انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCategory, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / VIDEOS_PER_PAGE));
  const visiblePages = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) pages.push(page);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) pages.push(page);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb className="mb-6"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>ویدیوها</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">ویدیوهای آموزشی</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">آموزش‌های کاربردی خرید، فروش، کارشناسی و قوانین خودرو</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={activeCategory === '' ? 'default' : 'outline'} size="sm" onClick={() => selectCategory('')}>همه</Button>
          {categories.map((category) => <Button key={category.value} variant={activeCategory === category.value ? 'default' : 'outline'} size="sm" onClick={() => selectCategory(category.value)}>{category.label}</Button>)}
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> در حال دریافت ویدیوها...</div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-4 size-16 text-muted-foreground/30" />
            <h2 className="mb-2 text-lg font-semibold">ویدیویی یافت نشد</h2>
            <p className="text-sm text-muted-foreground">هنوز ویدیوی منتشرشده‌ای در این دسته وجود ندارد.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">{toPersianNumber(totalCount)} ویدیو · صفحه {toPersianNumber(currentPage)} از {toPersianNumber(totalPages)}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => (
                <Card key={video.id} className="group cursor-pointer overflow-hidden py-0 hover-lift" onClick={() => navigateTo('video-detail', { videoId: video.slug })}>
                  <div className="relative aspect-video bg-slate-900">
                    {video.thumbnail_url && <OptimizedImage src={video.thumbnail_url} alt={video.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />}
                    <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110"><Play className="size-6 text-brand" /></div></div>
                    {video.duration && <Badge className="absolute bottom-3 left-3 border-0 bg-black/70 text-xs text-white">{video.duration}</Badge>}
                    <Badge className={`absolute right-3 top-3 border text-xs ${categoryColors[video.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{video.category_label}</Badge>
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="line-clamp-2 text-sm font-medium leading-6">{video.title}</h2>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3" />{toPersianNumber(video.view_count)} بازدید</div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && <div className="mb-4 mt-8"><Pagination dir="rtl"><PaginationContent>
              <PaginationItem><PaginationLink onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}><ChevronRight className="size-4" /> قبلی</PaginationLink></PaginationItem>
              {visiblePages.map((page, index) => page === 'ellipsis' ? <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)} className="cursor-pointer">{toPersianNumber(page)}</PaginationLink></PaginationItem>)}
              <PaginationItem><PaginationLink onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}>بعدی <ChevronLeft className="size-4" /></PaginationLink></PaginationItem>
            </PaginationContent></Pagination></div>}
          </>
        )}
      </div>
    </main>
  );
}
