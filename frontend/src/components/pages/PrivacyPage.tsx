'use client';

import React, { useState } from 'react';
import {
  ShieldCheck, Eye, Database, Lock, Globe, Bell, UserX,
  ChevronDown, Clock, MessageSquare, CheckCircle2, Cookie,
} from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

function PrivacyArticle({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <h4 className="font-semibold text-sm text-brand mb-2 flex items-start gap-2">
        <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5">{number}</span>
        {title}
      </h4>
      <div className="text-sm text-muted-foreground leading-7 mr-1">{children}</div>
    </div>
  );
}

interface PrivacySection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function PrivacyPage() {
  const { navigateTo } = useNavigation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'data-collection': true,
    'data-usage': false,
    'data-protection': false,
    'cookies': false,
    'user-rights': false,
    'third-party': false,
    'children': false,
    'changes': false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sections: PrivacySection[] = [
    {
      id: 'data-collection',
      title: 'جمع‌آوری اطلاعات',
      icon: Database,
      content: (
        <>
          <PrivacyArticle number="۱" title="اطلاعات ارائه‌شده توسط کاربر">
            <p>برای استفاده از خدمات آزاد گذر، اطلاعاتی نظیر نام و نام خانوادگی، شماره موبایل، ایمیل (اختیاری) و اطلاعات هویتی (برای فروشندگان و نمایشگاه‌داران) جمع‌آوری می‌شود. این اطلاعات صرفاً برای ارائه خدمات، احراز هویت و ارتباط با شما استفاده خواهند شد.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۲" title="اطلاعات جمع‌آوری‌شده به صورت خودکار">
            <p>در هنگام استفاده از پلتفرم، اطلاعاتی نظیر آدرس IP، نوع مرورگر، سیستم‌عامل، صفحات بازدیدشده، زمان و مدت بازدید و اطلاعات دستگاه شما به صورت خودکار جمع‌آوری می‌شود. این اطلاعات برای بهبود عملکرد و تجربه کاربری استفاده می‌شوند.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۳" title="اطلاعات ارتباطی">
            <p>پیام‌های ارسالی بین کاربران در سیستم چت داخلی پلتفرم، جهت حفظ امنیت و بررسی تخلفات احتمالی، به صورت موقت ذخیره می‌شوند. محتوای پیام‌ها بدون رضایت کاربران به اشخاص ثالث ارائه نخواهد شد.</p>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'data-usage',
      title: 'نحوه استفاده از اطلاعات',
      icon: Eye,
      content: (
        <>
          <PrivacyArticle number="۴" title="اهداف پردازش اطلاعات">
            <ul className="list-disc list-inside space-y-1">
              <li>ارائه و بهبود خدمات پلتفرم</li>
              <li>احراز هویت و تایید هویت کاربران</li>
              <li>ارسال اعلان‌ها و نوتیفیکیشن‌های مرتبط با خدمات</li>
              <li>پیشگیری از تقلب و تخلفات</li>
              <li>ارائه پشتیبانی و پاسخ به سوالات کاربران</li>
              <li>تحلیل آماری برای بهبود تجربه کاربری</li>
            </ul>
          </PrivacyArticle>
          <PrivacyArticle number="۵" title="عدم استفاده تبلیغاتی">
            <p>آزاد گذر اطلاعات تماس کاربران را برای ارسال پیام‌های تبلیغاتی غیرمرتبط به اشخاص ثالث فروش نمی‌رساند. در صورت تمایل به دریافت اخبار و تخفیف‌ها، کاربر می‌تواند عضو خبرنامه سایت شود و هر زمان که خواست لغو عضویت نماید.</p>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'data-protection',
      title: 'حفاظت از داده‌ها',
      icon: Lock,
      content: (
        <>
          <PrivacyArticle number="۶" title="امنیت اطلاعات">
            <p>آزاد گذر از پروتکل‌های رمزنگاری SSL/TLS برای انتقال امن اطلاعات استفاده می‌کند. داده‌های حساس کاربران به صورت رمزنگاری‌شده در پایگاه داده ذخیره می‌شوند و دسترسی به آن‌ها محدود به پرسنل مجاز است.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۷" title="بکاپ‌گیری و بازیابی">
            <p>از اطلاعات کاربران به صورت منظم نسخه پشتیبان گرفته می‌شود تا در صورت بروز هرگونه مشکل فنی، امکان بازیابی اطلاعات وجود داشته باشد. نسخه‌های پشتیبان در سرورهای امن و محافظت‌شده نگهداری می‌شوند.</p>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'cookies',
      title: 'کوکی‌ها و فناوری‌های مشابه',
      icon: Cookie,
      content: (
        <>
          <PrivacyArticle number="۸" title="استفاده از کوکی‌ها">
            <p>آزاد گذر از کوکی‌ها و فناوری‌های مشابه برای ذخیره تنظیمات کاربر، حفظ جلسه ورود و ارائه تجربه شخصی‌سازی‌شده استفاده می‌کند. کوکی‌های ضروری برای عملکرد سایت الزامی هستند و نمی‌توان آن‌ها را غیرفعال کرد.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۹" title="انواع کوکی‌ها">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>کوکی‌های ضروری:</strong> برای عملکرد پایه سایت و ورود کاربر</li>
              <li><strong>کوکی‌های عملکردی:</strong> برای ذخیره ترجیحات و تنظیمات</li>
              <li><strong>کوکی‌های تحلیلی:</strong> برای بررسی نحوه استفاده از سایت و بهبود آن</li>
            </ul>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'user-rights',
      title: 'حقوق کاربران',
      icon: ShieldCheck,
      content: (
        <>
          <PrivacyArticle number="۱۰" title="دسترسی و ویرایش">
            <p>کاربران حق دسترسی به اطلاعات شخصی ذخیره‌شده خود و درخواست ویرایش یا اصلاح آن‌ها را دارند. این کار از طریق تنظیمات پروفایل کاربری یا ارسال درخواست به پشتیبانی قابل انجام است.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۱۱" title="حذف حساب و اطلاعات">
            <p>کاربران حق درخواست حذف حساب کاربری و اطلاعات شخصی خود را دارند. پس از درخواست حذف، حساب کاربری و اطلاعات مرتبط ظرف مدت ۳۰ روز کاری حذف خواهند شد، مگر اینکه نگهداری اطلاعات به موجب قانون الزامی باشد.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۱۲" title="انتقال اطلاعات">
            <p>کاربران حق درخواست دریافت نسخه‌ای از اطلاعات شخصی خود در قالب قابل خواندن توسط ماشین (مانند JSON یا CSV) را دارند.</p>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'third-party',
      title: 'اشخاص ثالث',
      icon: Globe,
      content: (
        <>
          <PrivacyArticle number="۱۳" title="افشای اطلاعات به اشخاص ثالث">
            <p>آزاد گذر اطلاعات شخصی کاربران را بدون رضایت آن‌ها به اشخاص ثالث انتقال نمی‌دهد، به جز در موارد زیر:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>در صورت درخواست مراجع قانونی و قضایی ذی‌صلاح</li>
              <li>برای جلوگیری از تقلب، کلاهبرداری یا نقض قانون</li>
              <li>به پیمانکاران خدماتی که تحت قرارداد محرمانگی با آزاد گذر هستند</li>
            </ul>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'children',
      title: 'حریم کودکان',
      icon: UserX,
      content: (
        <>
          <PrivacyArticle number="۱۴" title="سنین مجاز">
            <p>استفاده از خدمات آزاد گذر برای افراد زیر ۱۸ سال مجاز نیست. در صورت اطلاع از ثبت‌نام فرد زیر سن قانونی، حساب کاربری مربوطه فوراً غیرفعال خواهد شد.</p>
          </PrivacyArticle>
        </>
      ),
    },
    {
      id: 'changes',
      title: 'تغییرات و تماس',
      icon: Bell,
      content: (
        <>
          <PrivacyArticle number="۱۵" title="تغییرات سیاست حریم خصوصی">
            <p>آزاد گذر حق تغییر این سیاست را در هر زمان محفوظ می‌دارد. تغییرات مهم از طریق اعلان در سایت اطلاع‌رسانی خواهد شد.</p>
          </PrivacyArticle>
          <PrivacyArticle number="۱۶" title="تماس با ما">
            <p>برای هرگونه سوال درباره سیاست حریم خصوصی یا درخواست مرتبط با اطلاعات شخصی خود، از طریق{' '}
              <button
                type="button"
                onClick={() => navigateTo('contact')}
                className="text-gold-dark hover:underline font-medium"
              >
                صفحه تماس با ما
              </button>{' '}
              با تیم پشتیبانی ارتباط برقرار کنید.
            </p>
          </PrivacyArticle>
        </>
      ),
    },
  ];

  const lastUpdated = '۱۴۰۳/۰۹/۱۵';

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
              <BreadcrumbPage>حریم خصوصی</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero */}
        <section className="bg-gradient-brand rounded-2xl p-8 md:p-12 text-white mb-8 shadow-premium-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gold/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gold/10 rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-white/10">
                <ShieldCheck className="size-7 text-gold" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">سیاست حریم خصوصی</h1>
            </div>
            <p className="text-white/70 leading-7 text-sm md:text-base">
              حفظ امنیت و حریم خصوصی اطلاعات شما برای ما اهمیت ویژه‌ای دارد. این صفحه توضیح می‌دهد که چه اطلاعاتی جمع‌آوری می‌شود و چگونه از آن‌ها محافظت می‌کنیم.
            </p>
            <div className="flex items-center gap-2 mt-4 text-white/50 text-xs">
              <Clock className="size-3.5" />
              <span>آخرین بروزرسانی: {lastUpdated}</span>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <Card className="shadow-premium mb-8 border-emerald-200">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <h3 className="font-semibold text-sm">تعهدات ما</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'فروش اطلاعات شخصی به اشخاص ثالث ممنوع است',
                'رمزنگاری SSL برای تمامی ارتباطات',
                'دسترسی شما به اطلاعات خودتان تضمین شده است',
                'حذف حساب در هر زمان امکان‌پذیر است',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections[section.id];
            return (
              <Card key={section.id} className="shadow-premium overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 p-4 md:p-5 text-right hover:bg-slate-50/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                    <Icon className="size-5 text-emerald-600" />
                  </div>
                  <h2 className="flex-1 font-semibold text-sm md:text-base">{section.title}</h2>
                  <ChevronDown className={cn(
                    'size-5 text-muted-foreground transition-transform duration-200 shrink-0',
                    isOpen && 'rotate-180'
                  )} />
                </button>
                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 border-t border-slate-100">
                    {section.content}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Contact */}
        <Card className="shadow-premium mt-8 border-amber-200">
          <div className="p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <MessageSquare className="size-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">سوال درباره حریم خصوصی دارید؟</h3>
              <p className="text-xs text-muted-foreground leading-6">
                در صورت داشتن هرگونه سوال یا نگرانی درباره نحوه جمع‌آوری و استفاده از اطلاعات شخصی‌تان، از طریق{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className="text-gold-dark hover:underline font-medium"
                >
                  صفحه تماس با ما
                </button>{' '}
                با ما در ارتباط باشید.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
