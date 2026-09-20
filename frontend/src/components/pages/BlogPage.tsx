'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Loader2, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { fetchArticleCategories, fetchArticles, type Article, type ArticleCategory } from '@/lib/article-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const ARTICLES_PER_PAGE = 9;

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

export function BlogPage() {
  const { navigateTo } = useNavigation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchArticleCategories(controller.signal).then(setCategories).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchArticles({ page: currentPage, pageSize: ARTICLES_PER_PAGE, category: activeCategory, query: debouncedQuery, signal: controller.signal })
      .then((page) => {
        setArticles(page.results);
        setTotalCount(page.count);
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت مقاله‌ها انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCategory, currentPage, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ARTICLES_PER_PAGE));
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);
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
          <BreadcrumbItem><BreadcrumbPage>مجله خودرو</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="mb-7">
          <h1 className="text-2xl font-bold md:text-3xl">مجله خودرو آزادگذر</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">مقاله‌ها، راهنماها، قوانین و بررسی‌های تخصصی خودرو</p>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} placeholder="جست‌وجو در مجله خودرو..." className="pr-10" />
        </div>

        <div className="flex gap-6">
          <aside className="hidden w-56 shrink-0 md:block">
            <Card className="sticky top-24 py-0"><div className="space-y-2 p-4">
              <h2 className="mb-3 text-sm font-semibold">دسته‌بندی‌ها</h2>
              <button onClick={() => selectCategory('')} className={`w-full rounded-lg px-3 py-2 text-right text-sm ${activeCategory === '' ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>همه مقاله‌ها</button>
              {categories.map((category) => <button key={category.value} onClick={() => selectCategory(category.value)} className={`w-full rounded-lg px-3 py-2 text-right text-sm ${activeCategory === category.value ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{category.label}</button>)}
            </div></Card>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-wrap gap-2 md:hidden">
              <Button size="sm" variant={activeCategory === '' ? 'default' : 'outline'} onClick={() => selectCategory('')}>همه</Button>
              {categories.map((category) => <Button key={category.value} size="sm" variant={activeCategory === category.value ? 'default' : 'outline'} onClick={() => selectCategory(category.value)}>{category.label}</Button>)}
            </div>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {loading ? (
              <div className="flex min-h-72 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> در حال دریافت مقاله‌ها...</div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center"><Search className="mb-4 size-16 text-muted-foreground/30" /><h2 className="mb-2 text-lg font-semibold">مقاله‌ای یافت نشد</h2><p className="text-sm text-muted-foreground">عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p></div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">{toPersianNumber(totalCount)} مقاله · صفحه {toPersianNumber(currentPage)} از {toPersianNumber(totalPages)}</div>

                {featuredArticle && <Card className="group cursor-pointer overflow-hidden py-0 shadow-premium-lg hover-lift" onClick={() => navigateTo('article-detail', { articleId: featuredArticle.slug })}>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative aspect-video md:aspect-auto">{featuredArticle.cover_image_url && <OptimizedImage src={featuredArticle.cover_image_url} alt={featuredArticle.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />}</div>
                    <div className="flex flex-col justify-center space-y-3 p-6">
                      <Badge variant="secondary" className="w-fit">{featuredArticle.category_label}</Badge>
                      <h2 className="text-xl font-bold leading-8 transition-colors group-hover:text-gold-dark">{featuredArticle.title}</h2>
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{featuredArticle.summary}</p>
                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><User className="size-3" />{featuredArticle.author}</span>{featuredArticle.read_time && <span className="flex items-center gap-1"><Clock className="size-3" />{featuredArticle.read_time}</span>}<span>{formatDate(featuredArticle.published_at)}</span></div>
                      <Button variant="outline" className="w-fit">مطالعه مقاله <ArrowLeft className="size-4" /></Button>
                    </div>
                  </div>
                </Card>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((article) => <Card key={article.id} className="group cursor-pointer overflow-hidden py-0 hover-lift" onClick={() => navigateTo('article-detail', { articleId: article.slug })}>
                    <div className="relative aspect-[16/10] bg-muted">{article.cover_image_url && <OptimizedImage src={article.cover_image_url} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />}<Badge variant="secondary" className="absolute right-3 top-3">{article.category_label}</Badge></div>
                    <div className="space-y-3 p-4"><h2 className="line-clamp-2 text-sm font-bold leading-6 transition-colors group-hover:text-gold-dark">{article.title}</h2><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{article.summary}</p><div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground"><span>{article.author}</span><span>{article.read_time || formatDate(article.published_at)}</span></div><Button variant="ghost" size="sm" className="w-full text-xs">مطالعه مقاله <ArrowLeft className="size-3" /></Button></div>
                  </Card>)}
                </div>

                {totalPages > 1 && <div className="mb-4 mt-8"><Pagination dir="rtl"><PaginationContent>
                  <PaginationItem><PaginationLink onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}><ChevronRight className="size-4" /> قبلی</PaginationLink></PaginationItem>
                  {visiblePages.map((page, index) => page === 'ellipsis' ? <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page)} className="cursor-pointer">{toPersianNumber(page)}</PaginationLink></PaginationItem>)}
                  <PaginationItem><PaginationLink onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}>بعدی <ChevronLeft className="size-4" /></PaginationLink></PaginationItem>
                </PaginationContent></Pagination></div>}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
