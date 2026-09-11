'use client';

import React, { useState, useMemo } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { faqs } from '@/lib/mock-data';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function FAQPage() {
  const { navigateTo } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.trim().toLowerCase();
    return faqs.filter((f) => f.question.toLowerCase().includes(query));
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>سوالات متداول</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gold/10">
              <HelpCircle className="size-7 text-gold-dark" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">سوالات متداول</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-2">
            پاسخ سوالات رایج درباره خدمات و خرید خودرو در آزاد گذر
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در سوالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="size-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">نتیجه‌ای یافت نشد</h3>
            <p className="text-muted-foreground text-sm">عبارت جستجو را تغییر دهید</p>
          </div>
        ) : (
          <Card className="shadow-premium py-0 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="px-6 text-right font-semibold hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 text-gold-dark text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="leading-7">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground leading-7">
                    <div className="pr-10">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Card className="py-0 bg-gradient-brand text-white shadow-premium-lg overflow-hidden">
            <div className="p-8">
              <h3 className="text-lg font-bold mb-2">سوال دیگری دارید؟</h3>
              <p className="text-white/70 text-sm mb-4">
                تیم پشتیبانی آزاد گذر آماده پاسخگویی به سوالات شماست
              </p>
              <button
                onClick={() => navigateTo('contact')}
                className="inline-flex items-center gap-2 bg-gradient-powder text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                تماس با ما
              </button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
