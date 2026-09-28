'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { useContentPage } from '@/hooks/use-content-page';
import { fetchContentCategories, type ContentCategory, type FrequentlyAskedQuestion } from '@/lib/content-api';
import { toPersianNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PAGE_SIZE = 20;

export function FAQPage() {
  const { navigateTo } = useNavigation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useContentPage<FrequentlyAskedQuestion>('faqs', {
    page, pageSize: PAGE_SIZE, q: search, category,
  });

  useEffect(() => {
    let active = true;
    fetchContentCategories('faqs').then(
      (result) => { if (active) setCategories(result); },
      () => { if (active) setCategories([]); },
    );
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-background py-8" dir="rtl">
      <div className="container mx-auto max-w-4xl px-4">
        <button type="button" onClick={() => navigateTo('home')} className="mb-5 text-sm text-muted-foreground">خانه / سؤالات متداول</button>
        <h1 className="mb-2 text-2xl font-bold">سؤالات متداول</h1>
        <p className="mb-6 text-sm text-muted-foreground">پاسخ سؤال‌های منتشرشده درباره خدمات آزادگذر</p>
        <div className="mb-4 flex items-center gap-2"><Search className="size-5 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جستجو در سؤال‌ها" /></div>
        <div className="mb-6 flex flex-wrap gap-2">
          <Button size="sm" variant={category === 'all' ? 'default' : 'outline'} onClick={() => { setCategory('all'); setPage(1); }}>همه</Button>
          {categories.map((item) => <Button key={item.value} size="sm" variant={category === item.value ? 'default' : 'outline'} onClick={() => { setCategory(item.value); setPage(1); }}>{item.label}</Button>)}
        </div>
        {loading && <p role="status" className="py-10 text-sm">در حال دریافت سؤال‌ها...</p>}
        {error && <p className="py-10 text-sm text-destructive">{error} <button type="button" onClick={reload} className="underline">تلاش دوباره</button></p>}
        {!loading && !error && !data?.results.length && <p className="py-10 text-sm text-muted-foreground">سؤالی برای این جستجو منتشر نشده است.</p>}
        <Accordion type="single" collapsible className="space-y-2">
          {data?.results.map((faq) => (
            <AccordionItem key={faq.id} value={String(faq.id)} className="rounded-xl border bg-white px-5">
              <AccordionTrigger className="text-right text-sm font-semibold">{faq.question}</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-sm leading-8 text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {!!data && data.count > PAGE_SIZE && <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <Button variant="outline" disabled={!data.previous || loading} onClick={() => setPage((value) => value - 1)}><ChevronRight className="size-4" /> قبلی</Button>
          <span>صفحه {toPersianNumber(page)} از {toPersianNumber(Math.ceil(data.count / PAGE_SIZE))}</span>
          <Button variant="outline" disabled={!data.next || loading} onClick={() => setPage((value) => value + 1)}>بعدی <ChevronLeft className="size-4" /></Button>
        </div>}
      </div>
    </main>
  );
}
