'use client';

import React, { useState } from 'react';
import { FileText, Truck, ClipboardCheck, MessageSquare, FileSearch, Search, Handshake, Send, Loader2 } from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { createServiceRequest, serviceTypeFromPageId } from '@/lib/service-request-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const services = [
  {
    id: 'transfer',
    title: 'انتقال مالکیت',
    icon: FileText,
    description: 'درخواست بررسی خدمات انتقال مالکیت را ثبت کنید. انجام خدمت پس از بررسی و هماهنگی جداگانه مشخص می‌شود.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'transport',
    title: 'حمل و نقل',
    icon: Truck,
    description: 'درخواست حمل خودرو را ثبت کنید. هزینه، بیمه و زمان‌بندی هنوز در سامانه تعیین یا رزرو نمی‌شوند.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'inspection',
    title: 'درخواست بازرسی',
    icon: ClipboardCheck,
    description: 'درخواست بازرسی خودرو را ثبت کنید تا در صف بررسی قرار بگیرد؛ نوبت و نتیجه بعداً توسط مسئول مربوط بررسی می‌شوند.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'consultation',
    title: 'مشاوره تخصصی',
    icon: MessageSquare,
    description: 'درخواست مشاوره را در سامانه ثبت کنید؛ قیمت و زمان پاسخگویی هنوز نهایی نشده‌اند.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    id: 'document-check',
    title: 'استعلام مدارک',
    icon: FileSearch,
    description: 'درخواست بررسی مدارک ثبت می‌شود؛ استعلام خودکار اصالت مدارک هنوز به سرویس‌های بیرونی متصل نیست.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'status-check',
    title: 'استعلام وضعیت',
    icon: Search,
    description: 'درخواست استعلام وضعیت ثبت می‌شود؛ استعلام آنی خلافی و وضعیت پلاک هنوز فعال نیست.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'buy-assist',
    title: 'همراهی در خرید',
    icon: Handshake,
    description: 'درخواست همراهی در خرید را ثبت کنید؛ فرایند ارائه خدمت پس از بررسی و هماهنگی مشخص می‌شود.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'sell-assist',
    title: 'همراهی در فروش',
    icon: Send,
    description: 'درخواست همراهی در فروش را ثبت کنید؛ قیمت‌گذاری و عکاسی خودکار هنوز متصل نیستند.',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
];

const vehicleTypes = ['سواری', 'شاسی‌بلند', 'کراس‌اوور', 'کوپه', 'پیکاپ', 'وانت'];

function ServiceForm({ serviceId }: { serviceId: string }) {
  const currentUser = useAuth((state) => state.currentUser);
  const [name, setName] = useState(() => currentUser?.name || '');
  const [phone, setPhone] = useState(() => currentUser?.phoneNumber || '');
  const [vehicleType, setVehicleType] = useState('');
  const [details, setDetails] = useState('');
  const [submittedId, setSubmittedId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const request = await createServiceRequest({
        serviceType: serviceTypeFromPageId(serviceId),
        contactName: name,
        contactPhone: phone,
        vehicleType,
        details,
      });
      setSubmittedId(request.id);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ثبت درخواست انجام نشد.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-premium">
      <div className="p-6">
        <h3 className="font-bold text-base mb-1">درخواست {services.find((s) => s.id === serviceId)?.title}</h3>
        <p className="text-sm text-muted-foreground mb-5">
          فرم زیر درخواست را واقعاً در صف بررسی ثبت می‌کند؛ زمان ارائه خدمت هنوز رزرو نمی‌شود.
        </p>

        {submittedId ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <svg className="size-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h4 className="font-bold text-lg mb-1">درخواست شما ثبت شد</h4>
            <p className="text-sm text-muted-foreground">درخواست در سامانه ثبت شد؛ وضعیت آن را می‌توانید در پنل کاربری بررسی کنید.</p>
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs">کد پیگیری: <span dir="ltr">{submittedId.slice(0, 8)}</span></p>
            <Button variant="outline" className="mt-4" onClick={() => { setSubmittedId(''); setVehicleType(''); setDetails(''); }}>ثبت درخواست دیگر</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${serviceId}-name`}>نام و نام خانوادگی</Label>
                <Input
                  id={`${serviceId}-name`}
                  placeholder="نام خود را وارد کنید"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${serviceId}-phone`}>شماره تماس</Label>
                <Input
                  id={`${serviceId}-phone`}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${serviceId}-vehicle`}>نوع خودرو</Label>
              <select
                id={`${serviceId}-vehicle`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
              >
                <option value="">انتخاب کنید</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${serviceId}-details`}>جزئیات درخواست</Label>
              <Textarea
                id={`${serviceId}-details`}
                placeholder="توضیحات بیشتر درباره درخواست خود بنویسید..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'در حال ثبت...' : 'ثبت درخواست'}
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}

export function ServicesPage() {
  const { navigateTo, currentPage } = useNavigation();
  const routeTabs: Record<string, string> = {
    'ownership-transfer': 'transfer',
    transportation: 'transport',
    inspection: 'inspection',
    consultation: 'consultation',
  };
  const defaultTab = routeTabs[currentPage] || 'transfer';

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
              <BreadcrumbPage>خدمات</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">خدمات تخصصی آزاد گذر</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            مجموعه کاملی از خدمات تخصصی برای خرید و فروش خودرو
          </p>
        </div>

        <p role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">ثبت درخواست خدمات فعال است؛ رزرو قطعی نوبت، انجام خدمت، استعلام آنی، بیمه و پرداخت هنوز به سامانه‌های اجرایی متصل نشده‌اند.</p>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-secondary">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <TabsTrigger
                  key={service.id}
                  value={service.id}
                  className="data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Icon className={service.color} />
                  <span className="hidden sm:inline">{service.title}</span>
                  <span className="sm:hidden">{service.title.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {services.map((service) => {
            const Icon = service.icon;
            return (
              <TabsContent key={service.id} value={service.id} className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${service.bgColor}`}>
                        <Icon className={`size-6 ${service.color}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{service.title}</h2>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-7">{service.description}</p>
                  </div>
                  <ServiceForm serviceId={service.id} />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </main>
  );
}
