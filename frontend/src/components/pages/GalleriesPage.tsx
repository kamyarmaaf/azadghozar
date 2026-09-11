'use client';

import { BusinessDirectoryPage } from '@/components/business/BusinessDirectoryPage';

export function GalleriesPage() {
  return (
    <BusinessDirectoryPage
      kind="gallery"
      detailPage="gallery-detail"
      title="نمایشگاه‌های تأییدشده آزادگذر"
      description="فهرست واقعی نمایشگاه‌ها با آگهی‌های فعال و اطلاعات به‌روز"
    />
  );
}
