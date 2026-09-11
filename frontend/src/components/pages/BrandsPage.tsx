'use client';

import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { brands } from '@/lib/mock-data';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const brandColors: Record<string, string> = {
  'مرسدس بنز': 'from-gray-800 to-gray-600',
  'بی‌ام‌و': 'from-blue-900 to-blue-700',
  'پورشه': 'from-red-700 to-red-500',
  'تویوتا': 'from-emerald-700 to-emerald-500',
  'لکسوس': 'from-slate-700 to-slate-500',
  'هیوندای': 'from-sky-700 to-sky-500',
  'کیا': 'from-gray-700 to-gray-500',
  'نیسان': 'from-amber-700 to-amber-500',
  'میتسوبیشی': 'from-red-800 to-red-600',
  'آئودی': 'from-zinc-800 to-zinc-600',
  'فولکس‌واگن': 'from-indigo-800 to-indigo-600',
  'ولوو': 'from-blue-800 to-blue-600',
  'فورد': 'from-blue-700 to-blue-500',
  'شورولت': 'from-yellow-700 to-yellow-500',
  'لندروور': 'from-green-800 to-green-600',
  'رنج‌روور': 'from-emerald-800 to-emerald-600',
  'جیپ': 'from-stone-700 to-stone-500',
  'مازراتی': 'from-red-900 to-red-700',
};

export function BrandsPage() {
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
              <BreadcrumbPage>برندها</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">برندهای خودرو</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            تمام برندهای موجود در آزاد گذر را مشاهده کنید
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="py-0 overflow-hidden hover-lift cursor-pointer group"
              onClick={() => navigateTo('brand-detail', { brandId: brand.id })}
            >
              <div className={`bg-gradient-to-br ${brandColors[brand.name] || 'from-gray-700 to-gray-500'} p-6 flex items-center justify-center`}>
                <span className="text-white font-bold text-xl text-center">
                  {brand.nameEn.split(' ').map((w) => w[0]).join('')}
                </span>
              </div>
              <div className="p-3 text-center space-y-1">
                <h3 className="font-bold text-sm">{brand.name}</h3>
                <p className="text-[11px] text-muted-foreground">{brand.nameEn}</p>
                <p className="text-xs text-muted-foreground">
                  {toPersianNumber(brand.vehicleCount)} خودرو
                </p>
                <Button variant="ghost" size="sm" className="w-full text-xs mt-2">
                  مشاهده خودروها
                  <ArrowLeft className="size-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
