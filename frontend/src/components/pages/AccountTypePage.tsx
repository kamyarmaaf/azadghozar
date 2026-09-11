'use client';

import { useNavigation } from '@/stores/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Store, Building2, ChevronLeft, Search, BarChart3, Users, Star } from 'lucide-react';

const accountTypes = [
  {
    id: 'buyer',
    icon: ShoppingBag,
    title: 'خریدار',
    subtitle: 'من می‌خواهم خودرو خریداری کنم',
    description: 'دسترسی به هزاران آگهی خودرو، ذخیره آگهی‌های مورد علاقه، مقایسه خودروها، درخواست بازرسی و مشاوره تخصصی خرید.',
    features: ['جستجوی پیشرفته خودرو', 'ذخیره و مقایسه آگهی‌ها', 'درخواست بازرسی', 'مشاوره خرید تخصصی'],
    target: 'buyer-dashboard' as const,
    color: 'from-powder/20 to-powder-light/10',
    iconColor: 'text-gold-dark',
    btnClass: 'bg-gold-dark hover:bg-gold-dark/90 text-white',
  },
  {
    id: 'seller',
    icon: Store,
    title: 'فروشنده',
    subtitle: 'من می‌خواهم خودرو بفروشم',
    description: 'ثبت و مدیریت آگهی‌ها، دسترسی به آمار بازدید، مدیریت تماس‌ها و درخواست‌های معاوضه.',
    features: ['ثبت آگهی نامحدود', 'آمار و گزارش بازدید', 'مدیریت تماس‌ها', 'درخواست معاوضه'],
    target: 'seller-dashboard' as const,
    color: 'from-emerald-500/20 to-emerald-400/10',
    iconColor: 'text-emerald-600',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    id: 'gallery',
    icon: Building2,
    title: 'نمایشگاه',
    subtitle: 'من مدیر نمایشگاه هستم',
    description: 'مدیریت حرفه‌ای خودروها، صفحه اختصاصی نمایشگاه، سیستم پیام‌رسانی، نظرات و امتیاز کاربران.',
    features: ['صفحه اختصاصی نمایشگاه', 'مدیریت حرفه‌ای خودروها', 'سیستم پیام‌رسانی', 'نظرات و امتیازدهی'],
    target: 'gallery-dashboard' as const,
    color: 'from-amber-500/20 to-amber-400/10',
    iconColor: 'text-amber-600',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
];

export function AccountTypePage() {
  const navigateTo = useNavigation((s) => s.navigateTo);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            نوع حساب کاربری خود را انتخاب کنید
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            برای دریافت خدمات مناسب، نوع فعالیت خود را مشخص کنید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="hover-lift shadow-premium cursor-pointer group border-2 hover:border-primary/20 transition-all"
                onClick={() => navigateTo(type.target)}
              >
                <CardHeader className="text-center pb-2">
                  <div className={cn('w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br', type.color)}>
                    <Icon className={cn('size-8', type.iconColor)} />
                  </div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {type.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground text-center leading-7">
                    {type.description}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {type.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <svg className="size-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className={cn('w-full h-11 mt-2', type.btnClass)}>
                    انتخاب {type.title}
                    <ChevronLeft className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
