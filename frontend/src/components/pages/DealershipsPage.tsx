'use client';

import { BusinessDirectoryPage } from '@/components/business/BusinessDirectoryPage';

export function DealershipsPage() {
  return (
    <BusinessDirectoryPage
      kind="agency"
      detailPage="dealership-detail"
      title="نمایندگی‌های تأییدشده آزادگذر"
      description="نمایندگی‌های معتبر دارای اشتراک فعال و اطلاعات تأییدشده"
    />
  );
}
