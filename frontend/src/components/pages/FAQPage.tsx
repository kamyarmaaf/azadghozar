'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, Loader2, Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchFAQCategories, fetchFrequentlyAskedQuestions, type FAQCategory, type FrequentlyAskedQuestion } from '@/lib/faq-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const FAQS_PER_PAGE = 20;

export function FAQPage() {
  const { navigateTo } = useNavigation();
  const [faqs, setFaqs] = useState<FrequentlyAskedQuestion[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
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
    void fetchFAQCategories(controller.signal).then(setCategories).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchFrequentlyAskedQuestions({
      page: currentPage,
      pageSize: FAQS_PER_PAGE,
      category: activeCategory,
      query: debouncedQuery,
      signal: controller.signal,
    })
      .then((page) => {
        setFaqs(page.results);
        setTotalCount(page.count);
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت سؤالات انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeCategory, currentPage, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / FAQS_PER_PAGE));
  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };
  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Breadcrumb className="mb-6"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>سؤالات متداول</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center"><div className="rounded-xl bg-gold/10 p-2.5"><HelpCircle className="size-7 text-gold-dark" /></div></div>
          <h1 className="text-2xl font-bold md:text-3xl">سؤالات متداول</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">پاسخ سؤال‌های رایج درباره خدمات و خرید و فروش خودرو در آزادگذر</p>
        </div>

        <div className="relative mb-5">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="جست‌وجو در سؤال‌ها و پاسخ‌ها..." value={searchQuery} onChange={(event) => changeSearch(event.target.value)} className="pr-10" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={activeCategory === '' ? 'default' : 'outline'} size="sm" onClick={() => selectCategory('')}>همه</Button>
          {categories.map((category) => <Button key={category.value} variant={activeCategory === category.value ? 'default' : 'outline'} size="sm" onClick={() => selectCategory(category.value)}>{category.label}</Button>)}
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> در حال دریافت سؤالات...</div>
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 size-16 text-muted-foreground/30" />
            <h2 className="mb-2 text-lg font-semibold">نتیجه‌ای یافت نشد</h2>
            <p className="text-sm text-muted-foreground">عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">{toPersianNumber(totalCount)} سؤال</p>
            <Card className="overflow-hidden py-0 shadow-premium">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={String(faq.id)}>
                    <AccordionTrigger className="px-6 text-right font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs font-bold text-gold-dark">{toPersianNumber((currentPage - 1) * FAQS_PER_PAGE + index + 1)}</span>
                        <span className="leading-7">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 leading-7 text-muted-foreground"><div className="space-y-3 pr-10"><Badge variant="secondary">{faq.category_label}</Badge><p className="whitespace-pre-line">{faq.answer}</p></div></AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </>
        )}

        {totalPages > 1 && !loading && <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ChevronRight className="size-4" /> قبلی</Button>
          <span className="text-sm text-muted-foreground">صفحه {toPersianNumber(currentPage)} از {toPersianNumber(totalPages)}</span>
          <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>بعدی <ChevronLeft className="size-4" /></Button>
        </div>}

        <div className="mt-8 text-center"><Card className="overflow-hidden bg-gradient-brand py-0 text-white shadow-premium-lg"><div className="p-8"><h2 className="mb-2 text-lg font-bold">سؤال دیگری دارید؟</h2><p className="mb-4 text-sm text-white/70">تیم پشتیبانی آزادگذر آماده پاسخ‌گویی است.</p><button onClick={() => navigateTo('contact')} className="inline-flex items-center rounded-lg bg-gradient-powder px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90">تماس با ما</button></div></Card></div>
      </div>
    </main>
  );
}
