'use client';

import { Construction } from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { upcomingPages } from '@/lib/feature-status';
import { Button } from '@/components/ui/button';

export function ComingSoonNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <div role="status" className="rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-5 text-right text-amber-950">
      <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold"><Construction className="size-4" />به‌زودی</span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-7">{detail}</p>
    </div>
  );
}

export function ComingSoonPage() {
  const { currentPage, navigateTo } = useNavigation();
  const feature = upcomingPages[currentPage as keyof typeof upcomingPages];

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col justify-center gap-5 px-5 py-12">
      <ComingSoonNotice
        title={feature?.title || 'این بخش هنوز آماده نیست'}
        detail={feature?.detail || 'تا زمان اتصال به سرویس واقعی، امکانات این بخش غیرفعال هستند.'}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigateTo('home')}>بازگشت به خانه</Button>
        <Button onClick={() => navigateTo('buy')}>مشاهده آگهی‌های واقعی</Button>
      </div>
    </div>
  );
}
