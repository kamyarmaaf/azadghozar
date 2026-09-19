'use client';

import { BusinessDirectoryPage } from '@/components/business/BusinessDirectoryPage';

export function DealershipsPage() {
  return (
    <BusinessDirectoryPage
      kind="agency"
      detailPage="dealership-detail"
      title="نمایندگی‌ها و شرکت‌های واردکننده تأییدشده"
      description="شرکت‌های واردکننده خودرو با اطلاعات حقوقی و مجوز واردات تأییدشده"
    />
  );
}
