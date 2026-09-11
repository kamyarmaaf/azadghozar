'use client';

import React, { useState } from 'react';
import {
  FileText, ShieldCheck, Users, Car, Scale, CreditCard, AlertTriangle,
  ChevronDown, Ban, Clock, MessageSquare, CheckCircle2,
} from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

interface TermSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

function TermArticle({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <h4 className="font-semibold text-sm text-brand mb-2 flex items-start gap-2">
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5">{number}</span>
        {title}
      </h4>
      <div className="text-sm text-muted-foreground leading-7 mr-1">{children}</div>
    </div>
  );
}

export function TermsPage() {
  const { navigateTo } = useNavigation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'general': true,
    'accounts': false,
    'listings': false,
    'transactions': false,
    'prohibited': false,
    'privacy': false,
    'liability': false,
    'changes': false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sections: TermSection[] = [
    {
      id: 'general',
      title: 'مقررات عمومی',
      icon: FileText,
      content: (
        <>
          <TermArticle number="۱" title="پذیرش قوانین">
            <p>با ثبت‌نام و استفاده از وب‌سایت آزاد گذر، شما تمامی قوانین و مقررات مندرج در این صفحه را مطالعه کرده و به آن‌ها مفهوماً و قانوناً متعهد می‌شوید. در صورت عدم موافقت با هر یک از بندهای این قوانین، لطفاً از استفاده از خدمات سایت خودداری نمایید.</p>
          </TermArticle>
          <TermArticle number="۲" title="تعاریف">
            <ul className="list-disc list-inside space-y-1">
              <li><strong>آزاد گذر:</strong> پلتفرم آنلاین خرید و فروش خودروهای مناطق آزاد و وارداتی</li>
              <li><strong>کاربر:</strong> هر شخص حقیقی یا حقوقی که از خدمات سایت استفاده می‌کند</li>
              <li><strong>خریدار:</strong> کاربری که قصد خرید خودرو از طریق پلتفرم را دارد</li>
              <li><strong>فروشنده:</strong> کاربری که آگهی فروش خودرو ثبت می‌کند</li>
              <li><strong>نمایشگاه‌دار:</strong> کاربری که به نمایندگی از یک نمایشگاه خودرو فعالیت می‌کند</li>
              <li><strong>آگهی:</strong> هرگونه محتوای ثبت‌شده برای معرفی خودرو جهت فروش</li>
            </ul>
          </TermArticle>
          <TermArticle number="۳" title="شمول قوانین">
            <p>این قوانین شامل تمامی کاربران، بازدیدکنندگان و استفاده‌کنندگان از خدمات آزاد گذر می‌شود. قوانین جمهوری اسلامی ایران و مقررات سازمان صنعت، معدن و تجارت بر تمامی فعالیت‌های سایت حاکم است.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'accounts',
      title: 'حساب کاربری و احراز هویت',
      icon: Users,
      content: (
        <>
          <TermArticle number="۴" title="ثبت‌نام و اطلاعات">
            <p>هر کاربر موظف است اطلاعات صحیح و واقعی خود را در زمان ثبت‌نام وارد نماید. اطلاعات خواسته‌شده شامل نام و نام خانوادگی، شماره موبایل معتبر و اطلاعات هویتی مورد نیاز است. مسئولیت صحت اطلاعات بر عهده کاربر است.</p>
          </TermArticle>
          <TermArticle number="۵" title="حریم خصوصی حساب">
            <p>کاربر موظف است رمز عبور خود را محرمانه نگه‌داری کرده و از انتقال یا به اشتراک‌گذاری آن با اشخاص ثالث خودداری نماید. در صورت مظنون شدن به دسترسی غیرمجاز، باید فوراً رمز عبور را تغییر داده و به پشتیبانی اطلاع دهد.</p>
          </TermArticle>
          <TermArticle number="۶" title="احراز هویت">
            <p>برای فعالیت به عنوان فروشنده یا نمایشگاه‌دار، احراز هویت الزامی است. مدارک مورد نیاز شامل کارت ملی معتبر، مجوز فعالیت تجاری (برای نمایشگاه‌داران) و تایید شماره موبایل می‌باشد. آزاد گذر حق درخواست مدارک تکمیلی را دارد.</p>
          </TermArticle>
          <TermArticle number="۷" title="تغییر نقش کاربری">
            <p>درخواست تغییر نقش کاربری (مثلاً از خریدار به فروشنده) نیازمند بررسی و تایید مدیر سیستم می‌باشد. آزاد گذر حق رد یا تایید درخواست تغییر نقش را بدون ارائه دلیل دارد.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'listings',
      title: 'آگهی‌ها و محتوای ثبت‌شده',
      icon: Car,
      content: (
        <>
          <TermArticle number="۸" title="محتوای آگهی">
            <p>فروشنده موظف است اطلاعات دقیق و واقعی درباره خودرو شامل مدل، سال ساخت، کارکرد، وضعیت رنگ، وضعیت فنی و قیمت را در آگهی درج نماید. هرگونه اطلاعات غلط یا گمراه‌کننده موجب حذف آگهی و可能的 تعلیق حساب کاربری خواهد شد.</p>
          </TermArticle>
          <TermArticle number="۹" title="تصاویر آگهی">
            <p>تصاویر ارسالی باید از خود خودرو واقعی گرفته شده باشند. استفاده از تصاویر اینترنتی، فتوشاپ شده یا متعلق به خودروی دیگر ممنوع است. هر آگهی باید حداقل ۵ تصویر با کیفیت قابل قبول داشته باشد.</p>
          </TermArticle>
          <TermArticle number="۱۰" title="مدت اعتبار آگهی">
            <p>آگهی‌ها بر اساس طرح اشتراک کاربر، مدت اعتبار مشخصی دارند. پس از انقضای اعتبار، آگهی به صورت خودکار غیرفعال شده و در صورت تمایل کاربر قابل تمدید خواهد بود.</p>
          </TermArticle>
          <TermArticle number="۱۱" title="حق حذف و ویرایش آگهی">
            <p>آزاد گذر حق حذف یا ویرایش آگهی‌هایی که مغایر با قوانین سایت باشند را در هر زمان بدون اطلاع قبلی برای خود محفوظ می‌دارد. دلایل احتمالی شامل: اطلاعات نادرست، تصاویر نامربوط، تکراری بودن و تخلف از قوانین.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'transactions',
      title: 'معاملات و پرداخت‌ها',
      icon: CreditCard,
      content: (
        <>
          <TermArticle number="۱۲" title="نقش واسطه‌ای">
            <p>آزاد گذر صرفاً به عنوان بستر ارتباطی و اطلاع‌رسانی بین خریدار و فروشنده عمل می‌کند و مستقیماً در فرآیند خرید و فروش، انتقال وجه یا تحویل خودرو دخالتی ندارد. مسئولیت نهایی معامله بر عهده طرفین قرارداد است.</p>
          </TermArticle>
          <TermArticle number="۱۳" title="پرداخت‌های اشتراکی">
            <p>پرداخت‌های مربوط به اشتراک پلتفرم و خدمات اضافی (مانند ویژه‌سازی آگهی) از طریق درگاه‌های پرداخت امن انجام می‌شود. اشتراک‌های خریداری‌شده غیرقابل استرداد می‌باشند مگر در مواردی که قانوناً حق بازگشت وجه وجود داشته باشد.</p>
          </TermArticle>
          <TermArticle number="۱۴" title="خدمات جانبی">
            <p>خدماتی نظیر بازرسی تخصصی، حمل و نقل، و مشاوره حقوقی توسط اشخاص ثالث ارائه می‌شوند و شرایط و قوانین جداگانه‌ای دارند. آزاد گذر مسئولیتی در قبال کیفیت این خدمات ندارد.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'prohibited',
      title: 'فعالیت‌های ممنوعه',
      icon: Ban,
      content: (
        <>
          <TermArticle number="۱۵" title="فعالیت‌های غیرمجاز">
            <p>کاربران از انجام فعالیت‌های زیر منع هستند:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>ثبت آگهی‌های جعلی، تکراری یا گمراه‌کننده</li>
              <li>ارائه اطلاعات هویتی جعلی یا متعلق به شخص دیگر</li>
              <li>هرگونه تلاش برای هک، نفوذ یا اختلال در عملکرد سایت</li>
              <li>استخراج خودکار اطلاعات سایت (Scraping) بدون مجوز</li>
              <li>ارسال پیام‌های هرز یا تبلیغات غیرمجاز از طریق سیستم پیام‌رسانی سایت</li>
              <li>ثبت قیمت‌های غیر واقعی یا دستکاری بازار</li>
              <li>ایجاد حساب‌های کاربری متعدد برای سوءاستفاده</li>
              <li>هرگونه فعالیت مخالف قوانین جمهوری اسلامی ایران</li>
            </ul>
          </TermArticle>
          <TermArticle number="۱۶" title="مجازات تخلف">
            <p>در صورت تخلف از قوانین، آزاد گذر حق اعمال اقدامات زیر را دارد: اخطار کتبی، محدودیت دسترسی، حذف آگهی‌ها، تعلیق موقت یا دائم حساب کاربری و در موارد تخلف قانونی، گزارش به مراجع ذی‌صلاح.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'privacy-terms',
      title: 'حریم خصوصی و داده‌ها',
      icon: ShieldCheck,
      content: (
        <>
          <TermArticle number="۱۷" title="جمع‌آوری اطلاعات">
            <p>آزاد گذر اطلاعات شخصی کاربران را تنها برای ارائه خدمات بهتر جمع‌آوری می‌کند. این اطلاعات شامل: نام، شماره تماس، ایمیل، اطلاعات هویتی و تاریخچه فعالیت‌ها در پلتفرم می‌باشد.</p>
          </TermArticle>
          <TermArticle number="۱۸" title="حفاظت از داده‌ها">
            <p>تمامی اطلاعات شخصی کاربران طبق قوانین حفاظت از داده‌ها نگهداری و محافظت می‌شوند. آزاد گذر اطلاعات شخصی کاربران را بدون رضایت آن‌ها به اشخاص ثالث فروش یا انتقال نمی‌دهد، مگر در مواردی که قانوناً الزامی باشد.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'liability',
      title: 'مسئولیت‌ها و معافیت',
      icon: Scale,
      content: (
        <>
          <TermArticle number="۱۹" title="محدودیت مسئولیت">
            <p>آزاد گذر تلاش می‌کند تا اطلاعات موجود در پلتفرم را دقیق و به‌روز نگه‌دارد، اما تضمینی در خصوص صحت کامل اطلاعات ارائه‌شده توسط کاربران نمی‌دهد. کاربران موظفند قبل از هرگونه معامله، اطلاعات را شخصاً بررسی و تایید نمایند.</p>
          </TermArticle>
          <TermArticle number="۲۰" title="خسارات غیرمستقیم">
            <p>آزاد گذر مسئولیتی در قبال خسارات غیرمستقیم، از دست رفتن سود، یا هرگونه زیان ناشی از استفاده یا عدم استفاده از خدمات سایت ندارد. حداکثر مسئولیت آزاد گذر محدود به مبالغ پرداختی کاربر بابت خدمات اشتراکی خواهد بود.</p>
          </TermArticle>
        </>
      ),
    },
    {
      id: 'changes',
      title: 'تغییرات قوانین',
      icon: Clock,
      content: (
        <>
          <TermArticle number="۲۱" title="حق تغییر قوانین">
            <p>آزاد گذر حق تغییر، اصلاح یا به‌روزرسانی این قوانین را در هر زمان برای خود محفوظ می‌دارد. تغییرات از طریق اعلان در سایت اطلاع‌رسانی شده و ادامه استفاده از سایت پس از اعمال تغییرات، به منزله پذیرش آن‌هاست.</p>
          </TermArticle>
          <TermArticle number="۲۲" title="اعلام تغییرات">
            <p>تغییرات مهم از طریق پیامک، ایمیل یا اعلان داخل پلتفرم به اطلاع کاربران خواهد رسید. کاربران موظفند به‌طور دوره‌ای قوانین را مرور نمایند.</p>
          </TermArticle>
          <TermArticle number="۲۳" title="بند حل اختلاف">
            <p>در صورت بروز هرگونه اختلاف بین کاربر و آزاد گذر، طرفین ابتدا تلاش خواهند کرد موضوع را از طریق مذاکره و مکاتبه حل و فصل نمایند. در صورت عدم حصول توافق، مرجع صالح برای رسیدگی به اختلافات، دادگاه‌های واقع در حوزه قضایی تهران خواهند بود.</p>
          </TermArticle>
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
              <BreadcrumbPage>قوانین و مقررات</BreadcrumbPage>
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
                <Scale className="size-7 text-gold" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">قوانین و مقررات استفاده</h1>
            </div>
            <p className="text-white/70 leading-7 text-sm md:text-base">
              لطفاً پیش از استفاده از خدمات آزاد گذر، قوانین و مقررات زیر را با دقت مطالعه فرمایید. استفاده از این پلتفرم به منزله پذیرش کامل این شرایط است.
            </p>
            <div className="flex items-center gap-2 mt-4 text-white/50 text-xs">
              <Clock className="size-3.5" />
              <span>آخرین بروزرسانی: {lastUpdated}</span>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <Card className="shadow-premium mb-8 border-gold/20">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="size-5 text-green-500" />
              <h3 className="font-semibold text-sm">خلاصه نکات کلیدی</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'اطلاعات واقعی و دقیق در آگهی‌ها الزامی است',
                'آزاد گذر واسطه معامله نیست',
                'حریم خصوصی کاربران رعایت می‌شود',
                'تغییرات قوانین اطلاع‌رسانی خواهد شد',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
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
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="size-5 text-primary" />
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

        {/* Contact for questions */}
        <Card className="shadow-premium mt-8 border-amber-200">
          <div className="p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <MessageSquare className="size-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">سوال درباره قوانین دارید؟</h3>
              <p className="text-xs text-muted-foreground leading-6">
                در صورت داشتن هرگونه سوال یا ابهام درباره قوانین و مقررات، می‌توانید از طریق{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className="text-gold-dark hover:underline font-medium"
                >
                  صفحه تماس با ما
                </button>{' '}
                یا بخش سوالات متداول، با تیم پشتیبانی آزاد گذر در ارتباط باشید.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
