'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Send,
  Shield,
  BadgeCheck,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigation, type PageId } from '@/stores/navigation';
import { OptimizedImage } from '@/components/ui/optimized-image';

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

const socialLinks = [
  { icon: Instagram, label: 'اینستاگرام', href: '#' },
  { icon: Twitter, label: 'توییتر', href: '#' },
  { icon: Linkedin, label: 'لینکدین', href: '#' },
  { icon: Youtube, label: 'یوتیوب', href: '#' },
];

const trustSymbols = [
  { icon: Shield, label: 'تضمین سلامت خودرو' },
  { icon: BadgeCheck, label: 'فروشندگان تایید شده' },
  { icon: Lock, label: 'پرداخت امن' },
];

export function Footer() {
  const { navigateTo } = useNavigation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gradient-brand text-white mt-auto">
      {/* Trust symbols bar */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-center gap-10 md:gap-20 flex-wrap">
            {trustSymbols.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-white/70"
              >
                <item.icon className="size-5 text-gold" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <p className="text-white/40 text-sm leading-7 mb-6">
              بزرگ‌ترین پلتفرم خرید و فروش خودروهای وارداتی و منطقه آزاد.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2.5 text-sm text-white/50">
              <a
                href="tel:02191009100"
                className="flex items-center gap-2 hover:text-gold transition-colors"
                dir="ltr"
              >
                <Phone className="size-4" />
                <span>۰۲۱-۹۱۰۰۹۱۰۰</span>
              </a>
              <a
                href="mailto:info@azadgozar.ir"
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <Mail className="size-4" />
                <span>info@azadgozar.ir</span>
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                <span>تهران، خیابان ولیعصر، بالاتر از میدان ونک</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5 mt-6">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center hover:bg-gold hover:text-brand transition-all"
                >
                  <item.icon className="size-4" />
                </a>
              ))}
            </div>
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
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-1 text-white/90">
                عضویت در خبرنامه
              </h4>
              <p className="text-white/40 text-xs">
                از آخرین خودروها و تخفیف‌های ویژه مطلع شوید
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex gap-2 w-full md:w-auto"
            >
              <Input
                type="email"
                placeholder="ایمیل خود را وارد کنید"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-white/8 border-white/10 text-white placeholder:text-white/30 rounded-lg text-sm flex-1 md:w-64 focus-visible:border-gold focus-visible:ring-gold/30"
                dir="ltr"
              />
              <Button
                type="submit"
                className="bg-gold hover:bg-gold-dark text-brand font-semibold h-10 px-5 rounded-lg flex-shrink-0"
              >
                <Send className="size-4" />
                <span>{subscribed ? 'ثبت شد!' : 'عضویت'}</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>تمامی حقوق مادی و معنوی این وب‌سایت متعلق به آزاد گذر می‌باشد.</p>
            <p>© ۱۴۰۳ آزاد گذر</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
