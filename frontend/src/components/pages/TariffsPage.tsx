'use client';

import React, { useState } from 'react';
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  Building2,
  Phone,
  ChevronDown,
  Info,
  FileText,
  Shield,
  Truck,
  Eye,
  MessageSquare,
  BadgeCheck,
  Headphones,
  Briefcase,
  Gavel,
  ClipboardCheck,
} from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceNote: string;
  period: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: PlanFeature[];
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    title: 'رایگان',
    subtitle: 'برای شروع کار',
    price: 'رایگان',
    priceNote: 'بدون هزینه',
    period: '',
    icon: <Star className="size-6" />,
    features: [
      { label: 'حد ۳ پست آگهی فعال', included: true },
      { label: 'دسترسی به همه بخش‌های اصلی', included: true },
      { label: 'نمایش در نتایج جستجو', included: true },
      { label: 'دسترسی به سامانه چتینگ', included: true },
      { label: 'پشتیبانی دفتری', included: true },
      { label: 'امتیاز به اشتراک‌ها', included: true },
      { label: 'امتیاز آگهی ویژه (۱ روز)', included: true },
      { label: 'امتیاز آگهی ویژه (۷ روز)', included: false },
      { label: 'بسته‌بندی اختصاصی', included: false },
      { label: 'درج لوگو یا نام تجاری', included: false },
      { label: 'کنترل آمار بازدید', included: false },
    ],
  },
  {
    id: 'silver',
    title: 'نقره‌ای',
    subtitle: 'برای فروشندگان حرفه‌ای',
    price: '۹۹۰,۰۰۰',
    priceNote: 'تومان / ماهانه',
    period: '/ماهانه',
    icon: <BadgeCheck className="size-6" />,
    popular: false,
    features: [
      { label: 'حد ۱۰ پست آگهی فعال', included: true },
      { label: 'دسترسی به ۱۵ دسته‌بندی اصلی', included: true },
      { label: 'نمایش در نتایج جستجو', included: true },
      { label: 'دسترسی به سامانه چتینگ', included: true },
      { label: 'پشتیبانی دفتری', included: true },
      { label: 'امتیاز به اشتراک‌ها', included: true },
      { label: 'امتیاز آگهی ویژه (۱ روز)', included: true },
      { label: 'بسته‌بندی اختصاصی', included: true },
      { label: 'امتیاز آگهی ویژه (۷ روز)', included: false },
      { label: 'درج لوگو یا نام تجاری', included: false },
      { label: 'کنترل آمار بازدید', included: false },
    ],
  },
  {
    id: 'gold',
    title: 'طلایی',
    subtitle: 'برای کسب‌وکارها',
    price: '۱,۹۹۰,۰۰۰',
    priceNote: 'تومان / ماهانه',
    period: '/ماهانه',
    icon: <Crown className="size-6" />,
    popular: true,
    features: [
      { label: 'حد ۵۰ پست آگهی فعال', included: true },
      { label: 'دسترسی به تمام دسته‌بندی‌های اصلی', included: true },
      { label: 'نمایش برجسته در نتایج جستجو', included: true },
      { label: 'نمایش در نتایج جستجو', included: true },
      { label: 'دسترسی به سامانه چتینگ', included: true },
      { label: 'پشتیبانی دفتری', included: true },
      { label: 'امتیاز به اشتراک‌ها', included: true },
      { label: 'امتیاز آگهی ویژه (۱ روز)', included: true },
      { label: 'بسته‌بندی اختصاصی VIP', included: true },
      { label: 'درج لوگو یا نام تجاری', included: true },
      { label: 'کنترل آمار بازدید', included: false },
    ],
  },
  {
    id: 'platinum',
    title: 'پلاتین',
    subtitle: 'برای سازمان‌های بزرگ',
    price: '۴,۹۹۰,۰۰۰',
    priceNote: 'تومان / ماهانه',
    period: '/ماهانه',
    icon: <Building2 className="size-6" />,
    features: [
      { label: 'آگهی نامحدود فعال', included: true },
      { label: 'دسترسی کامل به همه بخش‌ها', included: true },
      { label: 'نمایش برجسته در نتایج جستجو', included: true },
      { label: 'دسترسی به سامانه چتینگ', included: true },
      { label: 'پشتیبانی دفتری', included: true },
      { label: 'امتیاز به اشتراک‌ها', included: true },
      { label: 'امتیاز آگهی ویژه (۷ روز)', included: true },
      { label: 'بسته‌بندی اختصاصی VIP', included: true },
      { label: 'درج لوگو یا نام تجاری', included: true },
      { label: 'کنترل آمار بازدید', included: true },
    ],
  },
];

const serviceTariffs = [
  {
    icon: <FileText className="size-6" />,
    title: 'انتقال مالکیت',
    description: 'هزینه انتقال مالکیت خودرو مناطق آزاد',
    items: [
      { label: 'انتقال مالکیت عادی (تخفیف ویژه)', price: '۴۵۰,۰۰۰ تومان' },
      { label: 'انتقال مالکیت و تنظیم قرارداد (رسمی)', price: '۶۵۰,۰۰۰ تومان' },
      { label: 'انتقال فوری و تسویه حساب', price: '۸۰۰,۰۰۰ تومان' },
      { label: 'پیگیری در شورا حل اختلاف', price: '۱,۲۰۰,۰۰۰ تومان' },
    ],
  },
  {
    icon: <Truck className="size-6" />,
    title: 'حمل و نقل خودرو',
    description: 'انتقال خودرو به سراسر کشور با کفی‌های مجهز',
    items: [
      { label: 'حمل باربری (فوری)', price: '۸۰۰,۰۰۰ تومان' },
      { label: 'حمل باربری (هوشمند)', price: '۱,۰۰۰,۰۰۰ تومان' },
      { label: 'بکس‌کشی داخل شهری', price: '۱,۳۰۰,۰۰۰ تومان' },
      { label: 'بکس‌کشی بین شهری', price: '۲,۴۰۰,۰۰۰ تومان' },
      { label: 'بکس‌کشی مسیر دور', price: '۴,۸۰۰,۰۰۰ تومان' },
    ],
  },
  {
    icon: <Gavel className="size-6" />,
    title: 'مشاوره حقوقی',
    description: 'دریافت مشاوره حقوقی حضوری و غیرحضوری',
    items: [
      { label: 'مشاوره تلفنی (۱۵ دقیقه)', price: '۲۵۰,۰۰۰ تومان' },
      { label: 'مشاوره آنلاین (چت/سامانه)', price: '۴۵۰,۰۰۰ تومان' },
      { label: 'مشاوره حضوری کوتاه (مقدماتی)', price: '۷۵۰,۰۰۰ تومان' },
      { label: 'مشاوره ساعته تخصصی حقوقی', price: '۱,۸۰۰,۰۰۰ تومان' },
    ],
  },
  {
    icon: <ClipboardCheck className="size-6" />,
    title: 'پذیرش و کارگزاری',
    description: 'ثبت آگهی تخصصی همراه با پشتیبانی',
    items: [
      { label: 'کارشناسی اولیه (سریع ۱۰ دقیقه)', price: '۳۵۰,۰۰۰ تومان' },
      { label: 'کارشناسی کامل با پشتیبانی', price: '۷۵۰,۰۰۰ تومان' },
      { label: 'پذیرش سریع اختصاصی', price: '۹۵۰,۰۰۰ تومان' },
      { label: 'ارزیابی دقیق خودرو', price: '۱,۵۰۰,۰۰۰ تومان' },
    ],
  },
];

const faqItems = [
  {
    q: 'آیا می‌توانم بعد از خرید اشتراک خود را لغو کنم؟',
    a: 'بله، شما می‌توانید در هر زمانی اشتراک خود را لغو کنید. پس از لغو، تا پایان دوره اشتراک فعلی به خدمات دسترسی خواهید داشت و پس از آن حساب شما به پلن رایگان تبدیل می‌شود.',
  },
  {
    q: 'آیا پرداخت‌های امن این سایت قابل اعتماد هستند؟',
    a: 'بله، تمامی پرداخت‌ها از طریق درگاه‌های بانکی معتبر و امن انجام می‌شود. اطلاعات مالی شما به هیچ‌وجه ذخیره نمی‌شود و تمام تراکنش‌ها رمزنگاری شده‌اند.',
  },
  {
    q: 'آیا امکان برگرداندن وجه پس از خرید وجود دارد؟',
    a: 'بله، تا ۷ روز پس از خرید اشتراک در صورت عدم رضایت، وجه شما به طور کامل بازگشت داده می‌شود. بدون هیچ‌گونه سوال اضافه.',
  },
  {
    q: 'مزایای خریداری پلن‌های گوناگون چیست؟',
    a: 'هر پلن امکانات متنوعی ارائه می‌دهد. پلن‌های بالاتر شامل آگهی‌های ویژه بیشتر، بسته‌بندی اختصاصی، درج لوگوی تجاری، کنترل آماری و پشتیبانی پیشرفته‌تر هستند.',
  },
  {
    q: 'آیا فضای اضافی نیاز به هزینه جدا دارد؟',
    a: 'خیر، در پلن پلاتین تمامی امکانات بدون محدودیت و بدون هزینه اضافی در دسترس هستند. برای پلن‌های دیگر، ارتقا به پلن بالاتر مقرون‌به‌صرفه‌تر از خرید فضای اضافی است.',
  },
];

export function TariffsPage() {
  const { navigateTo } = useNavigation();
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="relative bg-gradient-brand text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold blur-[100px]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-gold/50 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer text-white/60 hover:text-white">
                  خانه
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">تعرفه‌ها</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 mb-5">
              <Shield className="size-8 text-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">تعرفه و پلن‌ها</h1>
            <p className="text-white/70 text-sm md:text-base leading-7">
              با انتخاب پلن مناسب، خدمات حرفه‌ای آزاد گذر را تجربه کنید. همه پلن‌ها شامل ضمانت بازگشت وجه تا ۷ روز هستند.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={cn('text-sm font-medium transition-colors', !annual ? 'text-foreground' : 'text-muted-foreground')}>
            ماهانه
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              'relative w-14 h-7 rounded-full transition-colors duration-300',
              annual ? 'bg-gold' : 'bg-gray-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300',
                annual ? 'right-0.5' : 'right-7'
              )}
            />
          </button>
          <span className={cn('text-sm font-medium transition-colors', annual ? 'text-foreground' : 'text-muted-foreground')}>
            سالانه
          </span>
          {annual && (
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
              ۲۰٪ تخفیف
            </span>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
          {plans.map((plan) => {
            const displayPrice = plan.id === 'free'
              ? plan.price
              : annual
                ? plan.price.replace(/,/g, (match, offset, str) => {
                    return ',';
                  })
                : plan.price;
            const annualNote = annual && plan.id !== 'free' ? 'تومان / ماهانه (با تخفیف)' : plan.priceNote;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col shadow-premium overflow-hidden transition-all hover:shadow-premium-lg',
                  plan.popular && 'ring-2 ring-gold scale-[1.02]'
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-powder text-white text-center text-xs font-bold py-1.5">
                    پرطرفدارترین پلن
                  </div>
                )}
                <div className={cn('p-6', plan.popular && 'pt-10')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'p-2.5 rounded-xl',
                      plan.popular ? 'bg-gold/10 text-gold-dark' : 'bg-muted text-muted-foreground'
                    )}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.title}</h3>
                      <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={cn('text-3xl font-extrabold', plan.popular && 'text-gold-dark')}>
                        {displayPrice}
                      </span>
                      {plan.id !== 'free' && (
                        <span className="text-xs text-muted-foreground">تومان</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{annualNote}</p>
                  </div>
                </div>
                <div className="flex-1 px-6">
                  <div className="space-y-3">
                    {plan.features.map((f) => (
                      <div key={f.label} className="flex items-start gap-2.5">
                        {f.included ? (
                          <Check className="size-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <X className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        )}
                        <span className={cn('text-sm leading-6', f.included ? 'text-foreground' : 'text-muted-foreground/50')}>
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 mt-auto">
                  <button
                    onClick={() => navigateTo('register')}
                    className={cn(
                      'w-full h-11 rounded-lg font-semibold text-sm transition-all',
                      plan.popular
                        ? 'bg-gradient-powder text-white hover:opacity-90'
                        : plan.id === 'free'
                          ? 'bg-muted text-foreground hover:bg-muted/80'
                          : 'bg-brand text-white hover:bg-brand-light'
                    )}
                  >
                    {plan.id === 'free' ? 'شروع رایگان' : 'انتخاب پلن'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Service Tariffs */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/10 mb-4">
              <Zap className="size-6 text-gold-dark" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">تعرفه خدمات</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              هزینه خدمات جانبی آزاد گذر شامل انتقال مالکیت، حمل و نقل، مشاوره حقوقی و کارگزاری
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {serviceTariffs.map((service) => (
              <Card key={service.title} className="shadow-premium overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gold/10 text-gold-dark">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{service.title}</h3>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="divide-y">
                    {service.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gold-dark whitespace-nowrap mr-4">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">سوالات متداول تعرفه‌ها</h2>
          <p className="text-muted-foreground text-sm">پاسخ سوالات رایج درباره قیمت‌گذاری و اشتراک</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-premium py-0 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="px-6 text-right font-semibold hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 text-muted-foreground leading-7">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="bg-gradient-brand text-white shadow-premium-lg overflow-hidden">
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gold/20">
                <Headphones className="size-8 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">چرا باید مشترک آزاد گذر شوید؟</h3>
                <p className="text-white/70 text-sm">
                  تحویل فوری آگهی، افشای قیمتی، افزایش بازدید، پشتیبانی تخصصی و دسترسی به سامانه
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigateTo('contact')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-powder text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Phone className="size-4" />
                تماس با ما
              </button>
              <button
                onClick={() => navigateTo('consultation')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors whitespace-nowrap"
              >
                <MessageSquare className="size-4" />
                مشاوره رایگان
              </button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}