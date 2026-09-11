'use client';

import React, { useState, useMemo } from 'react';
import { User, Clock, ArrowLeft, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { blogArticles } from '@/lib/mock-data';
import { useNavigation } from '@/stores/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
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

const ARTICLES_PER_PAGE = 9; // 1 featured + 8 in grid

export function BlogPage() {
  const { navigateTo } = useNavigation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    const cats = [...new Set(blogArticles.map((a) => a.category))];
    return ['all', ...cats];
  }, []);

  const categoryLabels: Record<string, string> = {
    'all': 'همه',
    'راهنمای خرید': 'راهنمای خرید',
    'مقایسه خودرو': 'مقایسه خودرو',
    'قوانین واردات موقت': 'قوانین واردات موقت',
    'نقد و بررسی خودرو': 'نقد و بررسی',
    'قوانین منطقه آزاد': 'قوانین منطقه آزاد',
  };

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return blogArticles;
    return blogArticles.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const featuredArticle = paginatedArticles[0];
  const remainingArticles = paginatedArticles.slice(1);

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
              <BreadcrumbPage>وبلاگ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">وبلاگ آزاد گذر</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            آخرین مقالات و راهنماهای تخصصی درباره خودرو
          </p>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-56 shrink-0">
            <Card className="sticky top-24 py-0">
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm mb-3">دسته‌بندی‌ها</h3>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {categoryLabels[cat] || cat}
                    {cat !== 'all' && (
                      <span className="mr-2 text-xs opacity-70">
                        {blogArticles.filter((a) => a.category === cat).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="md:hidden flex flex-wrap gap-2 mb-4">
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

            {filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">مقاله‌ای یافت نشد</h3>
                <p className="text-muted-foreground text-sm">دسته‌بندی دیگری را انتخاب کنید</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  <span>{toPersianNum(filteredArticles.length)} مقاله</span>
                  {totalPages > 1 && (
                    <span> · صفحه {toPersianNum(currentPage)} از {toPersianNum(totalPages)}</span>
                  )}
                </div>

                {featuredArticle && (
                  <Card className="py-0 overflow-hidden hover-lift cursor-pointer group shadow-premium-lg" onClick={() => navigateTo('article-detail', { articleId: featuredArticle.id })}>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-auto">
                        <OptimizedImage src={featuredArticle.image} alt={featuredArticle.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                      </div>
                      <div className="p-6 flex flex-col justify-center space-y-3">
                        <Badge variant="secondary">{featuredArticle.category}</Badge>
                        <h2 className="text-xl font-bold leading-8 group-hover:text-gold-dark transition-colors">
                          {featuredArticle.title}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-6">
                          {featuredArticle.summary}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {featuredArticle.author}
                          </span>
                          <span>{featuredArticle.date}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {featuredArticle.readTime}
                          </span>
                        </div>
                        <Button variant="outline" className="w-fit">
                          مطالعه مقاله
                          <ArrowLeft className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {remainingArticles.map((article) => (
                    <Card key={article.id} className="py-0 overflow-hidden hover-lift group cursor-pointer" onClick={() => navigateTo('article-detail', { articleId: article.id })}>
                      <div className="relative aspect-[16/10]">
                        <OptimizedImage src={article.image} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                        <Badge variant="secondary" className="absolute top-3 right-3">
                          {article.category}
                        </Badge>
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="font-bold text-sm line-clamp-2 leading-6 group-hover:text-gold-dark transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-5">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <User className="size-3" />
                              {article.author}
                            </span>
                            <span>&middot;</span>
                            <span>{article.readTime}</span>
                          </div>
                          <span>{article.date}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          مطالعه مقاله
                          <ArrowLeft className="size-3" />
                        </Button>
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
                                {toPersianNum(page)}
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
        </div>
      </div>
    </main>
  );
}

function toPersianNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}
