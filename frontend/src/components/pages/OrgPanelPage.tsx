'use client';

import { useState } from 'react';
import {
  Building2, BarChart3, FileText, Car, Store, AlertTriangle, Bell, Shield, ShieldCheck,
  Download, Eye, TrendingUp, TrendingDown, Users, ClipboardList, Search,
  ChevronDown, CheckCircle2, XCircle, Clock, ArrowUpDown, Calendar,
  MapPin, Star, Phone, ChevronLeft, CircleDot, Ban, MessageSquare,
  FileSpreadsheet, FileDown, Filter, ArrowUpRight, ArrowDownRight,
  Timer, UserCheck, ShieldAlert, Activity, PieChart, DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toPersianNumber, formatPrice, cn } from '@/lib/utils';

/* --- */
{/*  Mock Data                                                           */}
/* --- */

const statsData = {
  totalListings: 1247,
  activeListings: 892,
  pendingListings: 156,
  rejectedListings: 28,
  verifiedGalleries: 34,
  totalGalleries: 52,
  openComplaints: 12,
  resolvedComplaints: 89,
  totalRevenue: 485000000000,
  revenueChange: 12.5,
  avgPrice: 8500000000,
  priceChange: 3.2,
  transfersThisMonth: 67,
  transfersChange: 8.1,
};

const mockListings = [
  { id: '1', brand: 'تویوتا', model: 'کمری', year: 2023, price: 6200000000, gallery: 'رویال موتورز', status: 'active', plate: 'free-zone', zone: 'کیش', date: '۱۴۰۳/۰۹/۱۵' },
  { id: '2', brand: 'مرسدس بنز', model: 'کلاس E', year: 2023, price: 12500000000, gallery: 'لوکس موتور', status: 'active', plate: 'free-zone', zone: 'قشم', date: '۱۴۰۳/۰۹/۱۴' },
  { id: '3', brand: 'کیا', model: 'اسپورتیج', year: 2022, price: 4800000000, gallery: 'پارسیان خودرو', status: 'pending', plate: 'temporary-import', zone: '-', date: '۱۴۰۳/۰۹/۱۳' },
  { id: '4', brand: 'نیسان', model: 'پاترول', year: 2023, price: 22000000000, gallery: 'آریا موتور', status: 'reported', plate: 'free-zone', zone: 'چابهار', date: '۱۴۰۳/۰۹/۱۲' },
  { id: '5', brand: 'هیوندای', model: 'توسان', year: 2024, price: 5400000000, gallery: 'رویال موتورز', status: 'active', plate: 'free-zone', zone: 'ارسباران', date: '۱۴۰۳/۰۹/۱۱' },
  { id: '6', brand: 'پورشه', model: 'کاین', year: 2023, price: 28500000000, gallery: 'گالری پورشه پارس', status: 'active', plate: 'free-zone', zone: 'کیش', date: '۱۴۰۳/۰۹/۱۰' },
  { id: '7', brand: 'بی‌ام‌و', model: 'سری ۵', year: 2022, price: 9800000000, gallery: 'نمایندگی آلفا اتو', status: 'pending', plate: 'temporary-import', zone: '-', date: '۱۴۰۳/۰۹/۰۹' },
  { id: '8', brand: 'لکسوس', model: 'آر ایکس', year: 2023, price: 14800000000, gallery: 'لوکس موتور', status: 'rejected', plate: 'free-zone', zone: 'قشم', date: '۱۴۰۳/۰۹/۰۸' },
];

const mockGalleries = [
  { id: 'g1', name: 'رویال موتورز', city: 'تهران', vehicles: 35, rating: 4.8, isVerified: true, listedAt: '۱۴۰۲/۰۳/۱۵', transfers: 142, phone: '۰۲۱-۸۸۷۷۶۶۵۵' },
  { id: 'g2', name: 'لوکس موتور', city: 'تهران', vehicles: 28, rating: 4.9, isVerified: true, listedAt: '۱۴۰۲/۰۵/۲۰', transfers: 98, phone: '۰۲۱-۹۱۰۰۱۲۳۴' },
  { id: 'g3', name: 'پارسیان خودرو', city: 'اصفهان', vehicles: 22, rating: 4.5, isVerified: true, listedAt: '۱۴۰۲/۰۷/۱۰', transfers: 67, phone: '۰۳۱-۳۳۴۴۵۵۶۶' },
  { id: 'g4', name: 'آریا موتور', city: 'تبریز', vehicles: 18, rating: 4.2, isVerified: false, listedAt: '۱۴۰۳/۰۱/۰۵', transfers: 34, phone: '۰۴۱-۳۳۴۴۷۷۸۸' },
  { id: 'g5', name: 'گالری پورشه پارس', city: 'تهران', vehicles: 12, rating: 5.0, isVerified: true, listedAt: '۱۴۰۲/۰۸/۱۸', transfers: 45, phone: '۰۲۱-۲۶۱۵۱۲۳۴' },
  { id: 'g6', name: 'نمایندگی آلفا اتو', city: 'تهران', vehicles: 45, rating: 4.7, isVerified: true, listedAt: '۱۴۰۱/۱۲/۰۱', transfers: 210, phone: '۰۲۱-۸۸۶۶۷۷۸۸' },
];

const mockComplaints = [
  { id: 'c1', title: 'مغایرت قیمت آگهی با معامله نهایی', plaintiff: 'محمد رضایی', respondent: 'رویال موتورز', priority: 'high', status: 'open', date: '۱۴۰۳/۰۹/۱۴', type: 'price_mismatch' },
  { id: 'c2', title: 'عدم شفافیت در وضعیت بدنه خودرو', plaintiff: 'سارا محمدی', respondent: 'آریا موتور', priority: 'high', status: 'investigating', date: '۱۴۰۳/۰۹/۱۲', type: 'body_condition' },
  { id: 'c3', title: 'تاخیر در انتقال مالکیت', plaintiff: 'علی حسینی', respondent: 'پارسیان خودرو', priority: 'medium', status: 'open', date: '۱۴۰۳/۰۹/۱۰', type: 'transfer_delay' },
  { id: 'c4', title: 'خودرو تصادفی فروخته شده', plaintiff: 'حسین کریمی', respondent: 'لوکس موتور', priority: 'high', status: 'investigating', date: '۱۴۰۳/۰۹/۰۸', type: 'accident_history' },
  { id: 'c5', title: 'عدم تطابق کیلومتر', plaintiff: 'فاطمه احمدی', respondent: 'نمایندگی آلفا اتو', priority: 'medium', status: 'resolved', date: '۱۴۰۳/۰۹/۰۵', type: 'odometer_fraud' },
];

const mockActivities = [
  { id: 'a1', text: 'آگهی جدید تویوتا کمری ۲۰۲۴ توسط رویال موتورز ثبت شد', time: '۱۰ دقیقه پیش', type: 'new_listing' as const },
  { id: 'a2', text: 'شکایت جدید: مغایرت قیمت — گزارش شده توسط محمد رضایی', time: '۳۰ دقیقه پیش', type: 'complaint' as const },
  { id: 'a3', text: 'نمایشگاه آریا موتور تاییدیه نظارتی دریافت کرد', time: '۱ ساعت پیش', type: 'verification' as const },
  { id: 'a4', text: 'انتقال مالکیت خودرو مرسدس بنز کلاس E تکمیل شد', time: '۲ ساعت پیش', type: 'transfer' as const },
  { id: 'a5', text: 'آگهی لکسوس RX به دلیل مغایرت اطلاعات رد شد', time: '۳ ساعت پیش', type: 'rejection' as const },
  { id: 'a6', text: 'گزارش ماهانه شهریور ۱۴۰۳ آماده دانلود است', time: '۵ ساعت پیش', type: 'report' as const },
];

const reportTemplates = [
  { id: 'r1', title: 'گزارش عملکرد ماهانه', desc: 'خلاصه آماری آگهی‌ها، انتقال مالکیت و درآمد', icon: <BarChart3 className="size-5" />, format: 'PDF', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'r2', title: 'گزارش شکایات و رسیدگی', desc: 'لیست شکایات، وضعیت رسیدگی و زمان حل', icon: <FileText className="size-5" />, format: 'PDF', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'r3', title: 'لیست نمایشگاه‌های فعال', desc: 'اطلاعات کامل نمایشگاه‌ها، امتیاز و تعداد آگهی', icon: <Store className="size-5" />, format: 'Excel', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'r4', title: 'گزارش انتقال مالکیت', desc: 'جزئیات تمام انتقال‌های مالکیت انجام شده', icon: <ClipboardList className="size-5" />, format: 'Excel', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'r5', title: 'گزارش درآمد و تراکنش‌ها', desc: 'خلاصه مالی شامل کارمزد و تراکنش‌ها', icon: <DollarSign className="size-5" />, format: 'PDF', date: '۱۴۰۳/۰۸/۰۱' },
  { id: 'r6', title: 'آمار خودروهای وارداتی', desc: 'توزیع برند، مدل، سال و منطقه آزاد', icon: <Car className="size-5" />, format: 'Excel', date: '۱۴۰۳/۰۸/۰۱' },
];

const listingStatusMap: Record<string, { label: string; className: string }> = {
  active: { label: 'فعال', className: 'bg-green-50 text-green-600 border-green-200' },
  pending: { label: 'در انتظار تایید', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  reported: { label: 'گزارش شده', className: 'bg-red-50 text-red-500 border-red-200' },
  rejected: { label: 'رد شده', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const complaintPriorityMap: Record<string, { label: string; className: string }> = {
  high: { label: 'فوری', className: 'bg-red-50 text-red-600' },
  medium: { label: 'متوسط', className: 'bg-yellow-50 text-yellow-700' },
  low: { label: 'کم اهمیت', className: 'bg-blue-50 text-blue-600' },
};

const complaintStatusMap: Record<string, { label: string; className: string }> = {
  open: { label: 'باز', className: 'bg-red-50 text-red-600 border-red-200' },
  investigating: { label: 'در حال بررسی', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  resolved: { label: 'حل شده', className: 'bg-green-50 text-green-600 border-green-200' },
};

const activityTypeMap: Record<string, { icon: React.ReactNode; color: string }> = {
  new_listing: { icon: <Car className="size-4" />, color: 'bg-blue-50 text-blue-500' },
  complaint: { icon: <AlertTriangle className="size-4" />, color: 'bg-red-50 text-red-500' },
  verification: { icon: <Shield className="size-4" />, color: 'bg-green-50 text-green-500' },
  transfer: { icon: <CheckCircle2 className="size-4" />, color: 'bg-purple-50 text-purple-500' },
  rejection: { icon: <XCircle className="size-4" />, color: 'bg-orange-50 text-orange-500' },
  report: { icon: <FileText className="size-4" />, color: 'bg-slate-100 text-slate-500' },
};

const plateTypeMap: Record<string, { label: string; className: string }> = {
  'free-zone': { label: 'منطقه آزاد', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  'temporary-import': { label: 'واردات موقت', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

/* --- */
{/*  Mini Sparkline (pure CSS)                                            */}
/* --- */
function MiniSparkline({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70" viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/* --- */
/*  Main Component                                                      */
/* --- */
export function OrgPanelPage() {
  const [tab, setTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [listingFilter, setListingFilter] = useState('all');

  return (
    <div className="min-h-screen bg-cool-gray">
      <div className="bg-gradient-brand py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <Building2 className="size-7 text-gold" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-white">پنل نظارت منطقه آزاد</h1>
              <p className="text-xs sm:text-sm text-white/60 mt-0.5">نظارت بر عملکرد پلتفرم آزاد گذر</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white/80 border-white/20 text-[11px]">فقط خواندنی</Badge>
              <button className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80">
                <Bell className="size-5" />
                <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{toPersianNumber(statsData.openComplaints)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start bg-white border border-border-light rounded-xl p-1 h-auto flex-wrap gap-1 mb-6">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2 gap-1.5">
              <BarChart3 className="size-3.5" /> داشبورد
            </TabsTrigger>
            <TabsTrigger value="listings" className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2 gap-1.5">
              <Car className="size-3.5" /> آگهی‌ها
            </TabsTrigger>
            <TabsTrigger value="galleries" className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2 gap-1.5">
              <Store className="size-3.5" /> نمایشگاه‌ها
            </TabsTrigger>
            <TabsTrigger value="complaints" className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2 gap-1.5 relative">
              <AlertTriangle className="size-3.5" /> شکایات
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{toPersianNumber(statsData.openComplaints)}</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2 gap-1.5">
              <FileText className="size-3.5" /> گزارش‌ها
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[
                { label: 'کل آگهی‌ها', value: toPersianNumber(statsData.totalListings), icon: <Car className="size-5" />, color: 'bg-blue-50 text-blue-500', change: '+۸.۳٪', up: true, spark: [40, 55, 45, 60, 52, 70, 65, 80] },
                { label: 'آگهی فعال', value: toPersianNumber(statsData.activeListings), icon: <CheckCircle2 className="size-5" />, color: 'bg-green-50 text-green-500', change: '+۵.۱٪', up: true, spark: [30, 38, 35, 42, 40, 48, 45, 52] },
                { label: 'نمایشگاه تایید شده', value: toPersianNumber(statsData.verifiedGalleries), icon: <Store className="size-5" />, color: 'bg-purple-50 text-purple-500', change: '+۲ مورد', up: true, spark: [20, 22, 24, 25, 26, 28, 30, 34] },
                { label: 'شکایات باز', value: toPersianNumber(statsData.openComplaints), icon: <AlertTriangle className="size-5" />, color: 'bg-red-50 text-red-500', change: '-۳ مورد', up: false, spark: [20, 18, 16, 15, 14, 13, 12, 12] },
              ].map((s) => (
                <Card key={s.label} className="border-border-light hover:shadow-card transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn('p-2 rounded-lg', s.color)}>{s.icon}</div>
                      <MiniSparkline data={s.spark} color={s.up ? '#22c55e' : '#ef4444'} />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-text-muted">{s.label}</p>
                      <span className={cn('text-[11px] font-medium flex items-center gap-0.5', s.up ? 'text-green-600' : 'text-red-500')}>
                        {s.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {s.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* Revenue Card */}
              <Card className="border-border-light">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <DollarSign className="size-4 text-gold" />
                    درآمد و تراکنش‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-warm-gray">
                    <p className="text-[11px] text-text-muted mb-1">کل درآمد ماه جاری</p>
                    <p className="text-lg font-bold text-text-primary">{formatPrice(statsData.totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="size-3.5 text-green-500" />
                      <span className="text-[11px] text-green-600 font-medium">{toPersianNumber(statsData.revenueChange)}٪ نسبت به ماه قبل</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-warm-gray">
                    <p className="text-[11px] text-text-muted mb-1">انتقال مالکیت این ماه</p>
                    <p className="text-lg font-bold text-text-primary">{toPersianNumber(statsData.transfersThisMonth)} مورد</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="size-3.5 text-green-500" />
                      <span className="text-[11px] text-green-600 font-medium">{toPersianNumber(statsData.transfersChange)}٪ رشد</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avg Price Card */}
              <Card className="border-border-light">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Activity className="size-4 text-gold" />
                    میانگین قیمت بازار
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-warm-gray">
                    <p className="text-[11px] text-text-muted mb-1">میانگین قیمت فعلی</p>
                    <p className="text-lg font-bold text-text-primary">{formatPrice(statsData.avgPrice)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="size-3.5 text-green-500" />
                      <span className="text-[11px] text-green-600 font-medium">{toPersianNumber(statsData.priceChange)}٪ نسبت به ماه قبل</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-text-muted">نرخ تایید آگهی‌ها</span>
                        <span className="text-[11px] font-medium text-text-primary">{toPersianNumber(Math.round((statsData.activeListings / statsData.totalListings) * 100))}٪</span>
                      </div>
                      <Progress value={(statsData.activeListings / statsData.totalListings) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-text-muted">نرخ حل شکایات</span>
                        <span className="text-[11px] font-medium text-text-primary">{toPersianNumber(Math.round((statsData.resolvedComplaints / (statsData.resolvedComplaints + statsData.openComplaints)) * 100))}٪</span>
                      </div>
                      <Progress value={(statsData.resolvedComplaints / (statsData.resolvedComplaints + statsData.openComplaints)) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border-light">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Clock className="size-4 text-gold" />
                    فعالیت‌های اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0 max-h-72 overflow-y-auto">
                    {mockActivities.map((a, i) => {
                      const t = activityTypeMap[a.type];
                      return (
                        <div key={a.id} className={cn('flex gap-3 py-2.5', i < mockActivities.length - 1 && 'border-b border-border-light/60')}>
                          <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', t.color)}>{t.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-primary leading-5 line-clamp-2">{a.text}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{a.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings">
            <Card className="border-border-light">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-sm font-semibold">نظارت آگهی‌ها</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative w-52">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                      <Input placeholder="جستجوی خودرو..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm border-border-light" />
                    </div>
                    <div className="flex gap-1">
                      {(['all', 'active', 'pending', 'reported', 'rejected'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setListingFilter(f)}
                          className={cn(
                            'h-9 px-3 text-[11px] rounded-lg transition-colors',
                            listingFilter === f
                              ? 'bg-brand text-white font-medium'
                              : 'bg-muted/50 text-text-secondary hover:bg-muted'
                          )}
                        >
                          {f === 'all' ? 'همه' : listingStatusMap[f]?.label || f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">خودرو</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">قیمت</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">نمایشگاه</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">نوع پلاک</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">منطقه</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">وضعیت</th>
                        <th className="text-right py-3 px-3 text-[11px] font-medium text-text-muted">تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockListings
                        .filter((l) => listingFilter === 'all' || l.status === listingFilter)
                        .filter((l) => !searchQuery || (l.brand + ' ' + l.model).includes(searchQuery))
                        .map((l) => {
                          const st = listingStatusMap[l.status];
                          const pl = plateTypeMap[l.plate];
                          return (
                            <tr key={l.id} className="border-b border-border-light/40 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-3 text-right font-medium text-text-primary whitespace-nowrap">{l.brand} {l.model} <span className="text-text-muted">{toPersianNumber(l.year)}</span></td>
                              <td className="py-3 px-3 text-right text-text-primary whitespace-nowrap">{formatPrice(l.price)}</td>
                              <td className="py-3 px-3 text-right text-text-secondary whitespace-nowrap">{l.gallery}</td>
                              <td className="py-3 px-3"><Badge variant="outline" className={cn('text-[10px] font-medium', pl.className)}>{pl.label}</Badge></td>
                              <td className="py-3 px-3 text-right text-text-secondary text-xs">{l.zone}</td>
                              <td className="py-3 px-3"><Badge variant="outline" className={cn('text-[10px] font-medium', st.className)}>{st.label}</Badge></td>
                              <td className="py-3 px-3 text-right text-text-muted text-xs whitespace-nowrap">{l.date}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-3 border-t border-border-light/40 flex items-center justify-between">
                  <p className="text-[11px] text-text-muted">
                    نمایش {toPersianNumber(mockListings.length)} از {toPersianNumber(statsData.totalListings)} آگهی
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="text-[11px] h-8 border-border-light text-text-secondary">
                      <Download className="size-3 ml-1" />
                      خروجی Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="galleries">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-text-primary">{toPersianNumber(statsData.totalGalleries)}</p>
                  <p className="text-[11px] text-text-muted">کل نمایشگاه‌ها</p>
                </CardContent>
              </Card>
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-green-600">{toPersianNumber(statsData.verifiedGalleries)}</p>
                  <p className="text-[11px] text-text-muted">تایید شده</p>
                </CardContent>
              </Card>
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-yellow-600">{toPersianNumber(statsData.totalGalleries - statsData.verifiedGalleries)}</p>
                  <p className="text-[11px] text-text-muted">در انتظار تایید</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockGalleries.map((g) => (
                <Card key={g.id} className="border-border-light hover:shadow-card transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-brand/5 flex items-center justify-center">
                          <Store className="size-5 text-brand" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{g.name}</h3>
                          <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3" /> {g.city}
                          </p>
                        </div>
                      </div>
                      {g.isVerified ? (
                        <Badge className="bg-green-50 text-green-600 text-[10px] font-medium border-0 gap-1">
                          <ShieldCheck className="size-3" /> تایید شده
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-50 text-yellow-700 text-[10px] font-medium border-0 gap-1">
                          <Clock className="size-3" /> در انتظار
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/30 mb-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">{toPersianNumber(g.vehicles)}</p>
                        <p className="text-[10px] text-text-muted">خودرو</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">{toPersianNumber(g.transfers)}</p>
                        <p className="text-[10px] text-text-muted">انتقال</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Star className="size-3 fill-gold text-gold" />
                          <p className="text-sm font-bold text-text-primary">{toPersianNumber(g.rating)}</p>
                        </div>
                        <p className="text-[10px] text-text-muted">امتیاز</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="flex items-center gap-1"><Phone className="size-3" /> {g.phone}</span>
                      <span>عضویت: {g.listedAt}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="complaints">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-red-500">{toPersianNumber(statsData.openComplaints)}</p>
                  <p className="text-[11px] text-text-muted">باز</p>
                </CardContent>
              </Card>
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-yellow-600">{toPersianNumber(5)}</p>
                  <p className="text-[11px] text-text-muted">در حال بررسی</p>
                </CardContent>
              </Card>
              <Card className="border-border-light">
                <CardContent className="p-3.5 text-right">
                  <p className="text-xl font-bold text-green-600">{toPersianNumber(statsData.resolvedComplaints)}</p>
                  <p className="text-[11px] text-text-muted">حل شده</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {mockComplaints.map((c) => {
                const pr = complaintPriorityMap[c.priority];
                const st = complaintStatusMap[c.status];
                return (
                  <Card key={c.id} className="border-border-light hover:shadow-card transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-red-50 shrink-0">
                          <MessageSquare className="size-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold text-text-primary">{c.title}</h3>
                            <Badge className={cn('text-[10px] font-medium border-0', pr.className)}>{pr.label}</Badge>
                            <Badge variant="outline" className={cn('text-[10px] font-medium', st.className)}>{st.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                            <span>شاکی: <span className="text-text-secondary font-medium">{c.plaintiff}</span></span>
                            <span>متشاکی: <span className="text-text-secondary font-medium">{c.respondent}</span></span>
                            <span className="flex items-center gap-1"><Calendar className="size-3" /> {c.date}</span>
                          </div>
                        </div>
                        <button className="shrink-0 text-[11px] text-brand font-medium hover:text-brand-light flex items-center gap-1 transition-colors">
                          جزئیات
                          <ChevronLeft className="size-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((r) => (
                <Card key={r.id} className="border-border-light hover:shadow-card transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-brand/5 text-brand group-hover:bg-brand/10 transition-colors">
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-text-primary">{r.title}</h3>
                        <p className="text-[11px] text-text-muted mt-0.5 leading-4">{r.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border-light/60">
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        <Calendar className="size-3" />
                        <span>آخرین بروزرسانی: {r.date}</span>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5 border-border-light text-text-secondary hover:text-brand hover:border-brand/30">
                        <Download className="size-3" />
                        {r.format}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
