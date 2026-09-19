'use client';

import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Store, Building2, ChevronLeft, Crown } from 'lucide-react';
import type { RegistrationAccountType } from '@/lib/business-registration';

const accountTypes: Array<{
  id: RegistrationAccountType;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  iconColor: string;
  btnClass: string;
  buttonLabel: string;
}> = [
  {
    id: 'buyer',
    icon: ShoppingBag,
    title: 'خریدار',
    subtitle: 'من می‌خواهم خودرو خریداری کنم',
    description: 'جست‌وجوی آگهی‌های واقعی، ذخیره علاقه‌مندی‌ها، مقایسه و ثبت درخواست خدمات.',
    features: ['جستجوی پیشرفته خودرو', 'ذخیره و مقایسه آگهی‌ها', 'درخواست بازرسی', 'مشاوره خرید تخصصی'],
    color: 'from-powder/20 to-powder-light/10',
    iconColor: 'text-gold-dark',
    btnClass: 'bg-gold-dark hover:bg-gold-dark/90 text-white',
    buttonLabel: 'شروع ثبت‌نام خریدار',
  },
  {
    id: 'seller',
    icon: Store,
    title: 'فروشنده',
    subtitle: 'من می‌خواهم خودرو بفروشم',
    description: 'ثبت و مدیریت آگهی، مشاهده وضعیت تأیید و درخواست‌های خدمات مرتبط با حساب.',
    features: ['ثبت و مدیریت آگهی', 'نمایش وضعیت تأیید', 'ویرایش مشخصات آگهی', 'درخواست خدمات'],
    color: 'from-emerald-500/20 to-emerald-400/10',
    iconColor: 'text-emerald-600',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    buttonLabel: 'شروع ثبت‌نام فروشنده',
  },
  {
    id: 'gallery',
    icon: Building2,
    title: 'نمایشگاه‌دار',
    subtitle: 'من مدیر نمایشگاه هستم',
    description: 'مدیریت آگهی‌های نمایشگاه، پروفایل کسب‌وکار و دسترسی کارمندان. پیام‌رسانی و امتیازدهی هنوز فعال نیست.',
    features: ['صفحه نمایشگاه', 'مدیریت آگهی‌ها', 'ثبت اعضای تیم', 'احراز پروانه کسب'],
    color: 'from-amber-500/20 to-amber-400/10',
    iconColor: 'text-amber-600',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    buttonLabel: 'ثبت نمایشگاه',
  },
  {
    id: 'agency',
    icon: Crown,
    title: 'نمایندگی',
    subtitle: 'شرکت واردکننده خودرو هستم',
    description: 'ویژه شرکت‌های حقوقی واردکننده خودرو؛ پرونده نمایندگی از ابتدا مستقل از نمایشگاه ثبت و بررسی می‌شود.',
    features: ['ثبت اطلاعات حقوقی شرکت', 'ثبت مجوز واردات', 'اعلام برندهای وارداتی', 'احراز مستقل نمایندگی'],
    color: 'from-indigo-500/20 to-violet-400/10',
    iconColor: 'text-indigo-600',
    btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    buttonLabel: 'درخواست ثبت نمایندگی',
  },
];

export function AccountTypePage() {
  const navigateTo = useNavigation((s) => s.navigateTo);
  const currentUser = useAuth((s) => s.currentUser);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            نوع حساب کاربری خود را انتخاب کنید
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            نوع فعالیت را انتخاب کنید تا فرم ثبت‌نام متناسب با همان حساب نمایش داده شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="hover-lift shadow-premium cursor-pointer group border-2 hover:border-primary/20 transition-all"
                onClick={() => navigateTo(
                  currentUser ? currentUser.dashboardPage : 'register',
                  currentUser ? undefined : { registrationType: type.id },
                )}
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
                    {currentUser ? 'رفتن به پنل حساب فعلی' : type.buttonLabel}
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
