import type { PageId } from '@/stores/navigation';

// Keep this list aligned with the actual backend integrations. Unfinished routes
// must not show mock people, prices, activity or successful transactions.
export const upcomingPages = {
  brands: { title: 'صفحه برندها', detail: 'فهرست برند و مدل هنوز به داده‌های واقعی متصل نشده است.' },
  'brand-detail': { title: 'صفحه برند', detail: 'صفحه اختصاصی برند هنوز به داده‌های واقعی متصل نشده است.' },
  videos: { title: 'ویدیوهای آموزشی', detail: 'انتشار ویدیو و آمار بازدید هنوز راه‌اندازی نشده است.' },
  'video-detail': { title: 'پخش ویدیو', detail: 'ویدیوها و پخش‌کننده هنوز به محتوای واقعی متصل نیستند.' },
  blog: { title: 'مجله خودرو', detail: 'سامانه انتشار مقاله هنوز راه‌اندازی نشده است.' },
  'article-detail': { title: 'مقاله', detail: 'مقالات هنوز به سامانه انتشار واقعی متصل نیستند.' },
  faq: { title: 'سؤالات متداول', detail: 'متن پرسش‌ها باید نهایی و تأیید شود.' },
  about: { title: 'درباره ما', detail: 'اطلاعات تیم و آمار این صفحه هنوز نهایی و تأیید نشده است.' },
  contact: { title: 'تماس با ما', detail: 'فرم تماس و اطلاعات ارتباطی هنوز به پشتیبانی واقعی متصل و تأیید نشده‌اند.' },
  tariffs: { title: 'تعرفه‌ها و پرداخت', detail: 'قیمت‌ها، درگاه پرداخت و شرایط اشتراک هنوز نهایی نشده‌اند. هیچ پرداختی در این بخش انجام نمی‌شود.' },
  'org-panel': { title: 'پنل سازمان منطقه آزاد', detail: 'اتصال داده‌ها، مجوزها، شکایات و گزارش‌های سازمانی هنوز پیاده‌سازی نشده است.' },
  'smart-id': { title: 'شناسنامه هوشمند', detail: 'ثبت خودرو، ارزش‌گذاری، پریمیوم و مدارک هنوز به سرویس واقعی متصل نشده‌اند.' },
} satisfies Partial<Record<PageId, { title: string; detail: string }>>;

export function isUpcomingPage(page: PageId): boolean {
  return page in upcomingPages;
}
