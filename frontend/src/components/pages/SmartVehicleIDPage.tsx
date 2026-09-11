'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Car, PlusCircle, FileText, Shield, Star, TrendingUp, TrendingDown, Bell, Upload,
  CheckCircle2, Lock, Zap, Award, Warehouse, ArrowLeft, Eye, BarChart3,
  AlertTriangle, CircleDollarSign, CalendarDays, Gauge, Palette, Cog, BadgeCheck,
  ClipboardCheck, FileCheck, Tag, ChevronLeft, Sparkles, Crown, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/stores/auth';
import { useNavigation } from '@/stores/navigation';
import { toPersianNumber, formatPrice, cn } from '@/lib/utils';

interface Vehicle {
  id: string; brand: string; model: string; year: number; mileage: number;
  color: string; fuelType: string; transmission: string; bodyType: string;
  vin?: string; plateStatus?: string; premium: boolean; createdAt: string;
  priceEstimate?: { min: number; max: number; confidence: number };
  healthScore?: number; priceHistory?: { month: string; price: number }[];
  alertsEnabled?: boolean;
}

const mockVehicles: Vehicle[] = [
  { id: '1', brand: 'تویوتا', model: 'کمری LE', year: 2021, mileage: 35000, color: 'سفید', fuelType: 'بنزینی', transmission: 'اتوماتیک', bodyType: 'شاسی‌بلند', vin: '4T1B11HK5MU123456', plateStatus: 'پلاک منطقه آزاد', premium: true, createdAt: '۱۴۰۳/۰۱/۱۵', priceEstimate: { min: 2800000000, max: 3000000000, confidence: 85 }, healthScore: 85, alertsEnabled: true, priceHistory: [
    { month: 'فروردین', price: 3000000000 }, { month: 'اردیبهشت', price: 3050000000 }, { month: 'خرداد', price: 3300000000 }, { month: 'تیر', price: 3200000000 }, { month: 'مرداد', price: 3600000000 }, { month: 'شهریور', price: 3500000000 },
  ] },
  { id: '2', brand: 'هیوندای', model: 'توسان ۲.۰', year: 2022, mileage: 18000, color: 'مشکی', fuelType: 'بنزینی', transmission: 'اتوماتیک', bodyType: 'شاسی‌بلند', premium: false, createdAt: '۱۴۰۳/۰۶/۲۰' },
];

const brands = ['تویوتا', 'هیوندای', 'کیا', 'نیسان', 'مزدا', 'هوندا', 'بی‌ام‌و', 'مرسدس بنز', 'لیکساس', 'سوزوکی', 'پژو', 'رنو', 'سایپا', 'ایران‌خودرو'];
const colors = ['سفید', 'مشکی', 'نقره‌ای', 'خاکستری', 'قرمز', 'آبی', 'سبز', 'بژ', 'قهوه‌ای'];
const years = Array.from({ length: 25 }, (_, i) => 1403 - i);

function PremiumLock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="blur-[3px] pointer-events-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-brand/80 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 text-white">
          <Crown className="size-4 text-yellow-400" />
          <span className="text-sm font-medium">نسخه پریمیوم</span>
        </div>
      </div>
    </div>
  );
}

export function SmartVehicleIDPage() {
  const { isAuthenticated } = useAuth();
  const { navigateTo } = useNavigation();
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [vehicleTab, setVehicleTab] = useState('info');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState(1400);
  const [formMileage, setFormMileage] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formFuel, setFormFuel] = useState('');
  const [formTransmission, setFormTransmission] = useState('');
  const [formBody, setFormBody] = useState('');
  const nextVehicleId = useRef(mockVehicles.length + 1);

  const handleAddVehicle = () => {
    if (!formBrand || !formModel || !formColor) return;
    const v: Vehicle = { id: `vehicle-${nextVehicleId.current++}`, brand: formBrand, model: formModel, year: formYear, mileage: parseInt(formMileage) || 0, color: formColor, fuelType: formFuel, transmission: formTransmission, bodyType: formBody, premium: false, createdAt: new Intl.DateTimeFormat('fa-IR').format(new Date()) };
    setVehicles((p) => [...p, v]); setShowAddDialog(false); resetForm(); setSelectedVehicle(v);
  };
  const resetForm = () => { setFormBrand(''); setFormModel(''); setFormYear(1400); setFormMileage(''); setFormColor(''); setFormFuel(''); setFormTransmission(''); setFormBody(''); };

  const goToPremium = (v: Vehicle) => {
    setVehicles((prev) => prev.map((x) => x.id === v.id ? { ...x, premium: true, vin: x.vin || '4T1B11HK5MU' + Math.random().toString(36).slice(2, 8).toUpperCase(), plateStatus: 'پلاک منطقه آزاد', priceEstimate: { min: 2500000000 + Math.floor(Math.random() * 1000000000), max: 2800000000 + Math.floor(Math.random() * 1200000000), confidence: 80 + Math.floor(Math.random() * 15) }, healthScore: 75 + Math.floor(Math.random() * 20), priceHistory: [
      { month: 'فروردین', price: 2800000000 + Math.floor(Math.random() * 500000000) }, { month: 'اردیبهشت', price: 2900000000 + Math.floor(Math.random() * 500000000) }, { month: 'خرداد', price: 3000000000 + Math.floor(Math.random() * 600000000) }, { month: 'تیر', price: 3100000000 + Math.floor(Math.random() * 500000000) }, { month: 'مرداد', price: 3200000000 + Math.floor(Math.random() * 600000000) }, { month: 'شهریور', price: 3300000000 + Math.floor(Math.random() * 500000000) },
    ], alertsEnabled: false } : x));
    setSelectedVehicle({ ...v, premium: true }); setShowPremiumDialog(false);
  };

  const currentVehicle = useMemo(() => selectedVehicle ? vehicles.find((v) => v.id === selectedVehicle.id) || selectedVehicle : null, [selectedVehicle, vehicles]);

  if (currentVehicle) {
    return <VehicleProfile vehicle={currentVehicle} onBack={() => { setSelectedVehicle(null); setVehicleTab('info'); }} onGoPremium={() => setShowPremiumDialog(true)} tab={vehicleTab} onTabChange={setVehicleTab} onConvertToListing={() => navigateTo('sell')} />;
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-brand py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="size-4 text-yellow-400" /><span className="text-sm text-white/80">پرونده دیجیتال هوشمند خودرو</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">شناسنامه هوشمند <span className="text-gradient">آزادگذر</span></h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">پرونده دیجیتال و هوشمند خودرو شامل اطلاعات فنی، مدارک، سوابق کارشناسی، ارزش‌گذاری و رصد تغییرات بازار</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => isAuthenticated ? setShowAddDialog(true) : navigateTo('login')} className="h-12 px-8 text-base font-semibold rounded-xl" style={{ backgroundColor: '#7eb8da', color: '#0a1628' }}><PlusCircle className="size-5 ml-2" />ثبت خودرو جدید</Button>
            <Button variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl border-white/30 text-white hover:bg-white/10" onClick={() => setShowPremiumDialog(true)}><Crown className="size-5 ml-2 text-yellow-400" />ارتقا به پریمیوم</Button>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Car className="size-6" />, label: 'خودرو ثبت شده', value: toPersianNumber(vehicles.length), color: 'text-gold' },
              { icon: <Crown className="size-6" />, label: 'پریمیوم فعال', value: toPersianNumber(vehicles.filter(v => v.premium).length), color: 'text-yellow-500' },
              { icon: <FileText className="size-6" />, label: 'مدارک ذخیره شده', value: toPersianNumber(4 * vehicles.length), color: 'text-green-500' },
              { icon: <BarChart3 className="size-6" />, label: 'رصد قیمت فعال', value: toPersianNumber(vehicles.filter(v => v.alertsEnabled).length), color: 'text-orange-500' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                <div className={cn('p-2.5 rounded-lg bg-white shadow-sm', s.color)}>{s.icon}</div>
                <div><p className="text-2xl font-bold text-brand">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-brand mb-3">انتخاب نسخه مناسب شما</h2>
            <p className="text-muted-foreground">نسخه رایگان یا پریمیوم</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 border-border hover:border-gold/50 transition-colors">
              <CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-slate-100"><Eye className="size-5 text-brand" /></div><CardTitle className="text-lg">نسخه رایگان</CardTitle></div><Badge variant="secondary" className="text-xs">رایگان</Badge></div></CardHeader>
              <CardContent className="space-y-3">
                {['ثبت اطلاعات پایه خودرو', 'ایجاد پروفایل خودرو', 'ذخیره اطلاعات اولیه', 'مشاهده اطلاعات در حساب کاربری', 'امکان تبدیل به آگهی فروش'].map((i) => (
                  <div key={i} className="flex items-start gap-2"><CheckCircle2 className="size-4 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-foreground/80">{i}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-2 border-yellow-400/60 relative overflow-hidden shadow-premium-lg">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
              <CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-yellow-50"><Crown className="size-5 text-yellow-500" /></div><CardTitle className="text-lg">نسخه پریمیوم</CardTitle></div><Badge className="bg-yellow-500 text-white text-xs border-0">۲۵۰,۰۰۰ تومان</Badge></div></CardHeader>
              <CardContent className="space-y-3">
                {['تمام امکانات رایگان', 'ورود VIN و مشخصات کامل', 'مدارک و کارشناسی', 'تخمین قیمت هوشمند', 'رصد قیمت و هشدار بازار', 'نمودار تغییر ارزش', 'پیشنهاد فروش', 'گاراژ دیجیتال', 'Azadgozar Car Score'].map((i) => (
                  <div key={i} className="flex items-start gap-2"><Star className="size-4 text-yellow-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-foreground/80">{i}</span></div>
                ))}
                <Button className="w-full mt-2 h-11 rounded-lg" style={{ backgroundColor: '#f59e0b', color: '#fff' }} onClick={() => setShowPremiumDialog(true)}><Crown className="size-4 ml-2" />ارتقا به پریمیوم</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-2xl md:text-3xl font-bold text-brand flex items-center gap-2"><Warehouse className="size-7 text-gold" />گاراژ دیجیتال من</h2><p className="text-muted-foreground mt-1">خودروهای ثبت شده شما</p></div>
            <Button onClick={() => isAuthenticated ? setShowAddDialog(true) : navigateTo('login')} className="h-10 px-4 rounded-lg" style={{ backgroundColor: '#7eb8da', color: '#0a1628' }}><PlusCircle className="size-4 ml-2" />افزودن خودرو</Button>
          </div>
          {vehicles.length === 0 ? (
            <Card className="border-dashed border-2"><CardContent className="py-16 text-center"><Car className="size-8 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">هنوز خودرویی ثبت نکرده‌اید</h3><Button variant="outline" onClick={() => setShowAddDialog(true)}><PlusCircle className="size-4 ml-2" />ثبت خودرو</Button></CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{vehicles.map((v) => (
              <Card key={v.id} className="cursor-pointer hover-lift" onClick={() => setSelectedVehicle(v)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-brand"><Car className="size-6 text-gold" /></div>
                    <div className="flex items-center gap-2">{v.premium && <Badge className="bg-yellow-500 text-white border-0 text-[10px] px-2"><Crown className="size-3 ml-1" />پریمیوم</Badge>}</div>
                  </div>
                  <h3 className="font-bold text-brand text-base mb-1">{v.brand} {v.model}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{toPersianNumber(v.year)} — {toPersianNumber(v.mileage)} کیلومتر</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">{[
                    { icon: <Palette className="size-3" />, v: v.color }, { icon: <Gauge className="size-3" />, v: v.fuelType || '—' },
                    { icon: <Cog className="size-3" />, v: v.transmission || '—' }, { icon: <Car className="size-3" />, v: v.bodyType || '—' },
                  ].map((item, i) => (<div key={i} className="flex items-center gap-1.5 text-muted-foreground">{item.icon}<span>{item.v}</span></div>))}</div>
                  {v.premium && v.priceEstimate && (<><Separator className="my-3" /><p className="text-xs text-muted-foreground">ارزش تقریبی</p><p className="text-sm font-bold text-brand">{formatPrice(v.priceEstimate.min)}</p></>)}
                </CardContent>
              </Card>
            ))}</div>
          )}
        </div>
      </section>

      <section className="py-12 bg-gradient-brand">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">همین الان شروع کنید</h2>
          <Button onClick={() => isAuthenticated ? setShowAddDialog(true) : navigateTo('login')} className="h-12 px-8 text-base font-semibold rounded-xl" style={{ backgroundColor: '#7eb8da', color: '#0a1628' }}><PlusCircle className="size-5 ml-2" />ثبت خودرو رایگان</Button>
        </div>
      </section>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-right">ثبت خودرو جدید</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">برند *</Label><select value={formBrand} onChange={(e) => setFormBrand(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">انتخاب</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
              <div className="space-y-1.5"><Label className="text-sm">مدل *</Label><Input placeholder="مثلاً: کمری LE" value={formModel} onChange={(e) => setFormModel(e.target.value)} className="h-10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">سال ساخت</Label><select value={formYear} onChange={(e) => setFormYear(parseInt(e.target.value))} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">{years.map((y) => <option key={y} value={y}>{toPersianNumber(y)}</option>)}</select></div>
              <div className="space-y-1.5"><Label className="text-sm">کارکرد</Label><Input type="number" placeholder="کیلومتر" value={formMileage} onChange={(e) => setFormMileage(e.target.value)} className="h-10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">رنگ *</Label><select value={formColor} onChange={(e) => setFormColor(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">انتخاب</option>{colors.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="space-y-1.5"><Label className="text-sm">نوع سوخت</Label><select value={formFuel} onChange={(e) => setFormFuel(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">انتخاب</option>{['بنزینی', 'دیزلی', 'هیبریدی', 'برقی', 'گازسوز'].map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <Button onClick={handleAddVehicle} className="w-full h-11 rounded-lg" style={{ backgroundColor: '#7eb8da', color: '#0a1628' }} disabled={!formBrand || !formModel || !formColor}><CheckCircle2 className="size-4 ml-2" />ثبت خودرو</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-right">ارتقا به پریمیوم</DialogTitle></DialogHeader>
          <div className="py-4">
            <div className="text-center mb-6"><div className="mx-auto w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center mb-3"><Crown className="size-8 text-yellow-500" /></div><p className="text-2xl font-bold text-brand">۲۵۰,۰۰۰ <span className="text-sm font-normal text-muted-foreground">تومان / سالانه</span></p></div>
            <Button className="w-full h-11 rounded-lg" style={{ backgroundColor: '#f59e0b', color: '#fff' }} onClick={() => { if (currentVehicle) goToPremium(currentVehicle); else { const u = vehicles[0]; if (u) goToPremium(u); } }}><Crown className="size-4 ml-2" />فعال‌سازی پریمیوم</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleProfile({ vehicle, onBack, onGoPremium, tab, onTabChange, onConvertToListing }: { vehicle: Vehicle; onBack: () => void; onGoPremium: () => void; tab: string; onTabChange: (t: string) => void; onConvertToListing: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="size-5" /></Button>
            <div><h1 className="font-bold text-brand text-base md:text-lg">{vehicle.brand} {vehicle.model}</h1><p className="text-xs text-muted-foreground">{toPersianNumber(vehicle.year)} — شناسنامه هوشمند {vehicle.premium && <Crown className="inline size-3 text-yellow-500 mr-1" />}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {!vehicle.premium && <Button size="sm" className="h-8 text-xs rounded-lg" style={{ backgroundColor: '#f59e0b', color: '#fff' }} onClick={onGoPremium}><Crown className="size-3 ml-1" />ارتقا</Button>}
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={onConvertToListing}><Tag className="size-3 ml-1" />تبدیل به آگهی</Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card><CardContent className="p-5 text-center"><div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4"><Car className="size-10 text-gold" /></div><h2 className="font-bold text-brand text-lg">{vehicle.brand} {vehicle.model}</h2><p className="text-sm text-muted-foreground mt-1">{toPersianNumber(vehicle.year)}</p>{vehicle.premium && <Badge className="bg-yellow-500 text-white border-0 mt-2"><Crown className="size-3 ml-1" />پریمیوم</Badge>}</CardContent></Card>
            {vehicle.premium && vehicle.healthScore ? (
              <Card><CardContent className="p-5"><div className="flex items-center gap-2 mb-3"><Award className="size-5 text-gold" /><h3 className="font-bold text-sm text-brand">Azadgozar Car Score</h3></div><div className="text-center py-2"><div className="relative inline-block"><svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="#e2e6eb" strokeWidth="8" fill="none" /><circle cx="50" cy="50" r="40" stroke="#22c55e" strokeWidth="8" fill="none" strokeDasharray={`${vehicle.healthScore * 2.51} 251`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-brand">{toPersianNumber(vehicle.healthScore)}</span></div></div><p className="text-xs text-muted-foreground mt-1">از ۱۰۰</p></div></CardContent></Card>
            ) : (
              <Card><CardContent className="p-5"><div className="flex items-center gap-2 mb-3"><Award className="size-5 text-gold" /><h3 className="font-bold text-sm text-brand">Azadgozar Car Score</h3></div><PremiumLock><div className="text-center py-6"><Lock className="size-8 text-slate-300 mx-auto mb-2" /><p className="text-sm text-muted-foreground">پریمیوم شوید</p></div></PremiumLock></CardContent></Card>
            )}
            <Card><CardContent className="p-4 space-y-2.5"><h3 className="font-bold text-sm text-brand mb-2">اطلاعات سریع</h3>{[
              { icon: <CalendarDays className="size-3.5" />, label: 'سال ساخت', value: toPersianNumber(vehicle.year) },
              { icon: <Gauge className="size-3.5" />, label: 'کارکرد', value: `${toPersianNumber(vehicle.mileage)} km` },
              { icon: <Palette className="size-3.5" />, label: 'رنگ', value: vehicle.color },
              { icon: <Cog className="size-3.5" />, label: 'سوخت', value: vehicle.fuelType || '—' },
            ].map((i) => (<div key={i.label} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2 text-muted-foreground">{i.icon}<span className="text-xs">{i.label}</span></div><span className="text-xs font-medium text-brand">{i.value}</span></div>))}</CardContent></Card>
          </div>
          <div className="lg:col-span-3">
            <Tabs value={tab} onValueChange={onTabChange}>
              <TabsList className="w-full justify-start bg-white border border-border rounded-xl p-1 h-auto flex-wrap gap-1 mb-6">
                {[{ v: 'info', l: 'اطلاعات', i: <FileText className="size-3.5 ml-1" /> }, { v: 'vin', l: 'VIN و پلاک', i: <Shield className="size-3.5 ml-1" /> }, { v: 'documents', l: 'مدارک', i: <Upload className="size-3.5 ml-1" /> }, { v: 'inspection', l: 'کارشناسی', i: <ClipboardCheck className="size-3.5 ml-1" /> }, { v: 'price', l: 'ارزش‌گذاری', i: <CircleDollarSign className="size-3.5 ml-1" /> }, { v: 'chart', l: 'نمودار', i: <BarChart3 className="size-3.5 ml-1" /> }, { v: 'alerts', l: 'هشدارها', i: <Bell className="size-3.5 ml-1" /> }, { v: 'sell', l: 'فروش', i: <Tag className="size-3.5 ml-1" /> }].map((t) => (
                  <TabsTrigger key={t.v} value={t.v} className="rounded-lg data-[state=active]:bg-brand data-[state=active]:text-white text-xs px-3 py-2">{t.i}{t.l}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="info"><Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="size-5 text-gold" />اطلاعات پایه</CardTitle></CardHeader><CardContent><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[
                { label: 'برند', value: vehicle.brand }, { label: 'مدل', value: vehicle.model }, { label: 'سال ساخت', value: toPersianNumber(vehicle.year) }, { label: 'کارکرد', value: `${toPersianNumber(vehicle.mileage)} km` }, { label: 'رنگ', value: vehicle.color }, { label: 'سوخت', value: vehicle.fuelType || '—' }, { label: 'گیربکس', value: vehicle.transmission || '—' }, { label: 'بدنه', value: vehicle.bodyType || '—' }, { label: 'تاریخ ثبت', value: vehicle.createdAt },
              ].map((i) => (<div key={i.label} className="p-3 rounded-lg bg-slate-50"><p className="text-[11px] text-muted-foreground mb-1">{i.label}</p><p className="text-sm font-semibold text-brand">{i.value}</p></div>))}</div></CardContent></Card></TabsContent>

              {['vin', 'documents', 'inspection', 'price', 'chart', 'alerts', 'sell'].map((t) => (
                <TabsContent key={t} value={t}>
                  {vehicle.premium ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {t === 'vin' && 'اطلاعات VIN و پلاک'}
                          {t === 'documents' && 'مدارک خودرو'}
                          {t === 'inspection' && 'گزارش کارشناسی'}
                          {t === 'price' && 'تخمین قیمت هوشمند'}
                          {t === 'chart' && 'نمودار تغییر ارزش'}
                          {t === 'alerts' && 'رصد قیمت و هشدارها'}
                          {t === 'sell' && 'پیشنهاد فروش'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {t === 'price' && vehicle.priceEstimate && (
                          <div className="text-center p-6 rounded-xl bg-gradient-brand text-white">
                            <p className="text-sm text-white/70 mb-2">ارزش فعلی خودرو</p>
                            <p className="text-2xl font-extrabold text-gradient">{formatPrice(vehicle.priceEstimate.min)}</p>
                            <p className="text-white/60 text-sm mt-1">تا {formatPrice(vehicle.priceEstimate.max)}</p>
                            <p className="mt-3 text-xs text-white/80">میزان اطمینان: {toPersianNumber(vehicle.priceEstimate.confidence)}٪</p>
                          </div>
                        )}
                        {t === 'vin' && (
                          <div className="space-y-4">
                            <div>
                              <Label>شماره VIN</Label>
                              <div className="mt-1.5 p-3 rounded-lg bg-slate-50 font-mono text-sm text-brand" dir="ltr">{vehicle.vin || '—'}</div>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                              <BadgeCheck className="size-5 text-green-600" />
                              <p className="text-sm font-semibold text-green-700">تطابق اطلاعات تایید شد</p>
                            </div>
                          </div>
                        )}
                        {t === 'inspection' && vehicle.healthScore && (
                          <div className="flex items-center gap-6 p-5 rounded-xl bg-gradient-brand text-white">
                            <div className="relative flex-shrink-0">
                              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
                                <circle cx="50" cy="50" r="40" stroke="#7eb8da" strokeWidth="8" fill="none" strokeDasharray={`${vehicle.healthScore * 2.51} 251`} strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Star className="size-4 text-yellow-400 mb-0.5" />
                                <span className="text-2xl font-bold">{toPersianNumber(vehicle.healthScore)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">امتیاز سلامت</p>
                              <p className="text-xs text-white/70 mt-1">خودرو در وضعیت مطلوب</p>
                            </div>
                          </div>
                        )}
                        {t === 'sell' && (
                          <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="size-5 text-green-600 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-green-700 mb-1">زمان مناسب فروش</h4>
                                <p className="text-sm text-green-600">خودرو شما در محدوده مناسب فروش قرار دارد.</p>
                              </div>
                            </div>
                            <Button className="w-full mt-4 h-11 rounded-lg" style={{ backgroundColor: '#7eb8da', color: '#0a1628' }} onClick={onConvertToListing}>
                              <Tag className="size-4 ml-2" />تبدیل به آگهی فروش
                            </Button>
                          </div>
                        )}
                        {t === 'alerts' && (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                            <div className="flex items-center gap-3">
                              <Bell className="size-5 text-gold" />
                              <div>
                                <p className="font-semibold text-sm text-brand">رصد قیمت</p>
                                <p className="text-xs text-muted-foreground">اطلاع‌رسانی تغییرات</p>
                              </div>
                            </div>
                            <Switch />
                          </div>
                        )}
                        {t === 'chart' && vehicle.priceHistory && (
                          <div className="p-4 rounded-xl bg-slate-50">
                            <div className="flex items-end gap-2 h-40">
                              {vehicle.priceHistory.map((p, idx) => {
                                const maxP = Math.max(...vehicle.priceHistory!.map((x) => x.price));
                                return (
                                  <div key={p.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">{formatPrice(p.price).replace(' تومان', '')}</span>
                                    <div className={cn('w-full rounded-t-lg', idx === vehicle.priceHistory!.length - 1 ? 'bg-gold' : 'bg-brand/20')} style={{ height: `${(p.price / maxP) * 120}px` }} />
                                    <span className="text-[10px] text-muted-foreground">{p.month}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {t === 'documents' && (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {["کارت خودرو", "سند خودرو", "مدارک آزاد", "بیمه‌نامه", "معاینه فنی"].map((d, i) => (
                              <div key={d} className={cn('p-4 rounded-xl border-2 border-dashed', i < 3 ? 'border-green-300 bg-green-50/50' : 'border-slate-300')}>
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', i < 3 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400')}>
                                  <FileCheck className="size-4" />
                                </div>
                                <h4 className="font-semibold text-sm text-brand">{d}</h4>
                                <p className={cn('text-xs mt-1', i < 3 ? 'text-green-600' : 'text-muted-foreground')}>{i < 3 ? 'آپلود شده' : 'بارگذاری نشده'}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-16 text-center">
                        <PremiumLock>
                          <div className="space-y-4">
                            <Lock className="size-8 text-slate-300 mx-auto" />
                            <h3 className="font-bold text-brand">نسخه پریمیوم</h3>
                            <p className="text-sm text-muted-foreground">برای مشاهده، پریمیوم شوید</p>
                          </div>
                        </PremiumLock>
                        <Button className="mt-6 rounded-lg" style={{ backgroundColor: '#f59e0b', color: '#fff' }} onClick={onGoPremium}>
                          <Crown className="size-4 ml-2" />ارتقا به پریمیوم
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
