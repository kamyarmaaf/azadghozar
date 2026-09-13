'use client';

import {
  ChevronLeft,
} from 'lucide-react';
import { useNavigation, type PageId } from '@/stores/navigation';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { isUpcomingPage } from '@/lib/feature-status';

interface FooterLink {
  label: string;
  pageId?: PageId;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const navigationSections: FooterSection[] = [
  {
    title: 'خدمات ما',
    links: [
      { label: 'فروش خودرو', pageId: 'sell' },
      { label: 'خرید خودرو', pageId: 'buy' },
      { label: 'شناسنامه هوشمند', pageId: 'smart-id' },
      { label: 'بازرسی تخصصی', pageId: 'inspection' },
      { label: 'انتقال مالکیت', pageId: 'ownership-transfer' },
      { label: 'حمل و نقل', pageId: 'transportation' },
    ],
  },
  {
    title: 'دسترسی سریع',
    links: [
      { label: 'نمایندگی‌ها', pageId: 'dealerships' },
      { label: 'نمایشگاه‌ها', pageId: 'galleries' },
      { label: 'تعرفه‌ها', pageId: 'tariffs' },
      { label: 'وبلاگ', pageId: 'blog' },
      { label: 'سوالات متداول', pageId: 'faq' },
    ],
  },
  {
    title: 'آزاد گذر',
    links: [
      { label: 'درباره ما', pageId: 'about' },
      { label: 'تماس با ما', pageId: 'contact' },
      { label: 'قوانین و مقررات', pageId: 'terms' },
      { label: 'حریم خصوصی', pageId: 'privacy' },
    ],
  },
];

export function Footer() {
  const { navigateTo } = useNavigation();

  return (
    <footer className="bg-gradient-brand text-white mt-auto">

      {/* Main footer content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* About section - spans 2 cols on lg */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <OptimizedImage src="/logo.png" alt="آزاد گذر" width={160} height={52} sizes="120px" className="h-10 w-auto object-contain" />
              <h3 className="text-xl font-bold">
                <span className="text-gradient">آزاد گذر</span>
              </h3>
            </div>
            <p className="text-white/50 text-sm leading-7 mb-2">
              معامله‌ای بر پایه شفافیت و اعتماد
            </p>
            <p className="text-white/50 text-sm leading-7 mb-6">راه‌های تماس و شبکه‌های اجتماعی پس از تأیید اطلاعات رسمی منتشر می‌شوند.</p>
          </div>

          {/* Navigation columns */}
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm mb-4 text-white/90">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() =>
                        link.pageId && navigateTo(link.pageId)
                      }
                      className="text-sm text-white/40 hover:text-gold transition-colors flex items-center gap-1.5 group"
                    >
                      <ChevronLeft className="size-3 opacity-0 -mr-3.5 group-hover:opacity-100 group-hover:mr-0 transition-all" />
                      <span>{link.label}</span>
                      {link.pageId && isUpcomingPage(link.pageId) && <span className="text-[10px] text-amber-200">به‌زودی</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter: collecting email without saving is intentionally disabled. */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-white/70">خبرنامه: به‌زودی — ثبت ایمیل تا زمان راه‌اندازی سرویس غیرفعال است.</p>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>تمامی حقوق مادی و معنوی این وب‌سایت متعلق به آزاد گذر می‌باشد.</p>
            <p>آزاد گذر</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
