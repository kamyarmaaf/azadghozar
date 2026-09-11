'use client';

import React from 'react';
import { Circle, Target, Eye, Heart, ShieldCheck, Award, Users, Building2, CheckCircle2 } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const stats = [
  { label: 'آگهی فعال', value: 2540, icon: CheckCircle2 },
  { label: 'نمایندگی‌ها', value: 160, icon: Building2 },
  { label: 'نمایشگاه‌ها', value: 95, icon: Award },
  { label: 'کاربران راضی', value: 18500, icon: Users },
];

const teamMembers = [
  { name: 'علی محمدی', role: 'مدیرعامل و بنیان‌گذار', color: 'from-blue-500 to-cyan-500' },
  { name: 'سارا رضایی', role: 'مدیر عملیات', color: 'from-violet-500 to-purple-500' },
  { name: 'مهدی کریمی', role: 'مدیر فنی', color: 'from-emerald-500 to-teal-500' },
  { name: 'نازنین احمدی', role: 'مدیر بازاریابی', color: 'from-orange-500 to-amber-500' },
];

const trustBadges = [
  { title: 'تایید رسمی', desc: 'دارای مجوز رسمی فعالیت از سازمان صنعت و معدن', icon: ShieldCheck },
  { title: 'پشتیبانی ۲۴/۷', desc: 'تیم پشتیبانی در تمام ساعات شبانه‌روز', icon: Users },
  { title: 'ضمانت معامله', desc: 'تضمین امنیت و صحت تمامی معاملات', icon: Award },
  { title: 'بازرسی تخصصی', desc: 'بازرسی خودرو توسط کارشناسان معتبر', icon: CheckCircle2 },
];

export function AboutPage() {
  const { navigateTo } = useNavigation();

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
              <BreadcrumbPage>درباره ما</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <section className="bg-gradient-brand rounded-2xl p-8 md:p-12 text-white mb-10 shadow-premium-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gold/10 rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">درباره آزاد گذر</h1>
            <p className="text-white/80 leading-8 text-sm md:text-base">
              آزاد گذر، اولین بازارگاه تخصصی خودروهای مناطق آزاد ایران است که با هدف شفاف‌سازی و تسهیل فرآیند خرید و فروش خودروهای وارداتی، از سال ۱۴۰۱ فعالیت خود را آغاز کرده است. ما با ایجاد پلی ارتباطی مطمئن بین خریداران و فروشندگان معتبر، تجربه‌ای امن و لذت‌بخش از معاملات خودرو فراهم می‌کنیم.
            </p>
          </div>
        </section>

        {/* Mission / Vision / Values */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-6 text-center">چرا آزاد گذر؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="py-0 hover-lift shadow-premium">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="size-7 text-blue-500" />
                </div>
                <h3 className="font-bold text-base mb-2">مأموریت ما</h3>
                <p className="text-sm text-muted-foreground leading-6">
                  ایجاد شفافیت و اعتماد در بازار خودروهای مناطق آزاد و ارائه بستری امن برای معاملات خودرو با تمرکز بر رضایت کاربران.
                </p>
              </div>
            </Card>
            <Card className="py-0 hover-lift shadow-premium">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="size-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-base mb-2">چشم‌انداز ما</h3>
                <p className="text-sm text-muted-foreground leading-6">
                  تبدیل شدن به بزرگ‌ترین و معتبرترین پلتفرم خرید و فروش خودرو در ایران با پوشش تمامی مناطق آزاد و مرزی.
                </p>
              </div>
            </Card>
            <Card className="py-0 hover-lift shadow-premium">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="size-7 text-pink-500" />
                </div>
                <h3 className="font-bold text-base mb-2">ارزش‌های ما</h3>
                <p className="text-sm text-muted-foreground leading-6">
                  صداقت، شفافیت، امنیت و احترام به حقوق کاربران. ما به رضایت شما افتخار می‌کنیم و همواره در تلاش برای بهبود هستیم.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="py-0 shadow-premium hover-lift">
                  <div className="p-5 text-center">
                    <Icon className="size-8 text-gold-dark mx-auto mb-3" />
                    <p className="text-2xl md:text-3xl font-bold text-brand">
                      {toPersianNumber(stat.value.toLocaleString())}+
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-6 text-center">تیم ما</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.name} className="py-0 hover-lift shadow-premium overflow-hidden">
                <div className={`h-24 bg-gradient-to-br ${member.color} flex items-center justify-center`}>
                  <Circle className="size-16 text-white/30" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-sm">{member.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust Badges */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-center">نشان‌های اعتماد</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card key={badge.title} className="py-0 hover-lift shadow-card">
                  <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                      <Icon className="size-5 text-gold-dark" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{badge.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-5">{badge.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
