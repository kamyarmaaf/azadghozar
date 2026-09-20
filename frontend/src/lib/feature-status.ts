import type { PageId } from '@/stores/navigation';

// Keep this list aligned with the actual backend integrations. Unfinished routes
// must not show mock people, prices, activity or successful transactions.
export const upcomingPages = {
  tariffs: { title: 'تعرفه‌ها و پرداخت', detail: 'قیمت‌ها، درگاه پرداخت و شرایط اشتراک هنوز نهایی نشده‌اند. هیچ پرداختی در این بخش انجام نمی‌شود.' },
  'org-panel': { title: 'پنل سازمان منطقه آزاد', detail: 'اتصال داده‌ها، مجوزها، شکایات و گزارش‌های سازمانی هنوز پیاده‌سازی نشده است.' },
  'smart-id': { title: 'شناسنامه هوشمند', detail: 'ثبت خودرو، ارزش‌گذاری، پریمیوم و مدارک هنوز به سرویس واقعی متصل نشده‌اند.' },
} satisfies Partial<Record<PageId, { title: string; detail: string }>>;

export function isUpcomingPage(page: PageId): boolean {
  return page in upcomingPages;
}
