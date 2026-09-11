'use client';

import React, { useState, useMemo } from 'react';
import { Play, Eye, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { videos } from '@/lib/mock-data';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const VIDEOS_PER_PAGE = 8;

const categoryColors: Record<string, string> = {
  'قوانین': 'bg-red-100 text-red-700 border-red-200',
  'آموزش': 'bg-blue-100 text-blue-700 border-blue-200',
  'مقایسه': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'راهنما': 'bg-amber-100 text-amber-700 border-amber-200',
  'نقد و بررسی': 'bg-violet-100 text-violet-700 border-violet-200',
};

export function VideosPage() {
  const { navigateTo } = useNavigation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    const cats = [...new Set(videos.map((v) => v.category))];
    return ['all', ...cats];
  }, []);

  const categoryLabels: Record<string, string> = {
    'all': 'همه',
    'قوانین': 'قوانین',
    'آموزش': 'آموزش',
    'مقایسه': 'مقایسه',
    'راهنما': 'راهنما',
    'نقد و بررسی': 'نقد و بررسی',
  };

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'all') return videos;
    return videos.filter((v) => v.category === activeCategory);
  }, [activeCategory]);

  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);

  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * VIDEOS_PER_PAGE;
    return filteredVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [filteredVideos, currentPage]);

  // Reset to page 1 when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first, last, current, and neighbors
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ویدیوها</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">ویدیوهای آموزشی</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            ویدیوهای آموزشی و مفید درباره خرید، فروش و قوانین خودرو
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat)}
            >
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="size-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">ویدیویی یافت نشد</h3>
            <p className="text-muted-foreground text-sm">دسته‌بندی دیگری را انتخاب کنید</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              <span>{toPersianNumber(filteredVideos.length)} ویدیو</span>
              {totalPages > 1 && (
                <span> · صفحه {currentPage} از {toPersianNumber(totalPages)}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedVideos.map((video) => (
                <Card key={video.id} className="py-0 overflow-hidden hover-lift cursor-pointer group"
                  onClick={() => navigateTo('video-detail', { videoId: video.id })}>
                  <div className="relative aspect-video bg-cover bg-center">
                    <OptimizedImage src={video.thumbnail} alt={video.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="size-6 text-brand mr-[-2px]" />
                      </div>
                    </div>
                    <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0 text-xs">
                      {video.duration}
                    </Badge>
                    <Badge className={`absolute top-3 right-3 text-xs border ${categoryColors[video.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {video.category}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2 leading-6">{video.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3" />
                      <span>{video.views} بازدید</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 mb-4">
                <Pagination dir="rtl">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        aria-label="صفحه قبلی"
                        className={`gap-1 px-2.5 sm:pr-2.5 ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}`}
                      >
                        <ChevronRight className="size-4" />
                        <span className="hidden sm:inline">قبلی</span>
                      </PaginationLink>
                    </PaginationItem>

                    {getPageNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {toPersianNumber(page)}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="صفحه بعدی"
                        className={`gap-1 px-2.5 sm:pl-2.5 ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}`}
                      >
                        <span className="hidden sm:inline">بعدی</span>
                        <ChevronLeft className="size-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

