'use client';

import React, { useEffect, useState } from 'react';
import { Heart, SlidersHorizontal, X, Search, ChevronRight, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import { brands, bodyTypes } from '@/lib/mock-data';
import { formatPrice, formatMileage, toPersianNumber } from '@/lib/utils';
import {
  fetchVehicleListings,
  listingImageUrl,
  type PublicListingSummary,
} from '@/lib/listing-api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { useFavorites } from '@/stores/favorites';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const plateTypes = [
  { value: 'free-zone', label: 'منطقه آزاد' },
  { value: 'temporary-import', label: 'واردات موقت' },
];

const colors = [
  'سفید', 'مشکی', 'نقره‌ای', 'خاکستری', 'قرمز', 'آبی',
  'سبز', 'کرم', 'قهوه‌ای', 'طلایی', 'نارنجی', 'بنفش',
];

const transmissions = ['اتوماتیک', 'دستی', 'سی‌وی‌تی', 'دوکلاچه'];
const fuelTypes = ['بنزینی', 'دیزلی', 'هیبریدی', 'برقی', 'هیبریدی پلاگین'];
const conditions = ['آکبند', 'در حد نو', 'کارکرده تمیز', 'سالم', 'نیاز به تعمیر'];
const sellerTypes = [
  { value: 'all', label: 'همه' },
  { value: 'gallery', label: 'نمایشگاه' },
  { value: 'dealership', label: 'نمایندگی' },
  { value: 'personal', label: 'شخصی' },
];

const VEHICLES_PER_PAGE = 12;

const sortOptions = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'cheapest', label: 'ارزان‌ترین' },
  { value: 'priciest', label: 'گران‌ترین' },
  { value: 'lowest-mileage', label: 'کم‌ترین کارکرد' },
];

const plateTypeApiMap: Record<string, string> = {
  'free-zone': 'free_zone',
  'temporary-import': 'temporary_import',
};
const transmissionApiMap: Record<string, string> = {
  'اتوماتیک': 'automatic', 'دستی': 'manual', 'سی‌وی‌تی': 'cvt', 'دوکلاچه': 'dct',
};
const fuelApiMap: Record<string, string> = {
  'بنزینی': 'gasoline', 'دیزلی': 'diesel', 'هیبریدی': 'hybrid', 'برقی': 'electric', 'هیبریدی پلاگین': 'phev',
};
const conditionApiMap: Record<string, string> = {
  'آکبند': 'new', 'در حد نو': 'like_new', 'کارکرده تمیز': 'clean_used', 'سالم': 'good', 'نیاز به تعمیر': 'needs_repair',
};

function optionalPositiveNumber(value: string, multiplier = 1): number | undefined {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed * multiplier : undefined;
}

interface FilterProps {
  plateType: string;
  brand: string;
  model: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  body: string;
  color: string;
  transmission: string;
  fuel: string;
  condition: string;
  sellerTypeFilter: string;
  instantSale: boolean;
  specialSale: boolean;
  inspected: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  setPlateType: (v: string) => void;
  setBrand: (v: string) => void;
  setModel: (v: string) => void;
  setYearMin: (v: string) => void;
  setYearMax: (v: string) => void;
  setPriceMin: (v: string) => void;
  setPriceMax: (v: string) => void;
  setMileageMin: (v: string) => void;
  setMileageMax: (v: string) => void;
  setBody: (v: string) => void;
  setColor: (v: string) => void;
  setTransmission: (v: string) => void;
  setFuel: (v: string) => void;
  setCondition: (v: string) => void;
  setSellerTypeFilter: (v: string) => void;
  setInstantSale: (v: boolean) => void;
  setSpecialSale: (v: boolean) => void;
  setInspected: (v: boolean) => void;
  onCloseSheet?: () => void;
}

function FilterSidebar({
  plateType, brand, model, yearMin, yearMax, priceMin, priceMax,
  mileageMin, mileageMax, body, color, transmission, fuel, condition,
  sellerTypeFilter, instantSale, specialSale, inspected,
  activeFilterCount, onClearFilters, onCloseSheet,
  setPlateType, setBrand, setModel, setYearMin, setYearMax,
  setPriceMin, setPriceMax, setMileageMin, setMileageMax,
  setBody, setColor, setTransmission, setFuel, setCondition,
  setSellerTypeFilter, setInstantSale, setSpecialSale, setInspected,
}: FilterProps) {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">فیلترها</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs text-destructive hover:text-destructive">
            <X className="size-3" />
            پاک کردن ({toPersianNumber(activeFilterCount)})
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">نوع پلاک</Label>
        <Select value={plateType} onValueChange={setPlateType}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {plateTypes.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">برند</Label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه برندها" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه برندها</SelectItem>
            {brands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">مدل</Label>
        <Input placeholder="مثلا: کلاس E" value={model} onChange={(e) => setModel(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">محدوده سال ساخت</Label>
        <div className="flex gap-2">
          <Input placeholder="از" value={yearMin} onChange={(e) => setYearMin(e.target.value)} />
          <Input placeholder="تا" value={yearMax} onChange={(e) => setYearMax(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">محدوده قیمت (میلیون تومان)</Label>
        <div className="flex gap-2">
          <Input placeholder="از" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          <Input placeholder="تا" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">کارکرد (هزار کیلومتر)</Label>
        <div className="flex gap-2">
          <Input placeholder="از" value={mileageMin} onChange={(e) => setMileageMin(e.target.value)} />
          <Input placeholder="تا" value={mileageMax} onChange={(e) => setMileageMax(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">نوع بدنه</Label>
        <Select value={body} onValueChange={setBody}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">رنگ</Label>
        <Select value={color} onValueChange={setColor}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">گیربکس</Label>
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {transmissions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">نوع سوخت</Label>
        <Select value={fuel} onValueChange={setFuel}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">وضعیت</Label>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            {conditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">نوع فروشنده</Label>
        <Select value={sellerTypeFilter} onValueChange={setSellerTypeFilter}>
          <SelectTrigger className="w-full"><SelectValue placeholder="همه" /></SelectTrigger>
          <SelectContent>
            {sellerTypes.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="f-instant" checked={instantSale} onCheckedChange={(v) => setInstantSale(v === true)} />
          <Label htmlFor="f-instant" className="font-normal cursor-pointer">فروش فوری</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="f-special" checked={specialSale} onCheckedChange={(v) => setSpecialSale(v === true)} />
          <Label htmlFor="f-special" className="font-normal cursor-pointer">فروش ویژه</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="f-inspected" checked={inspected} onCheckedChange={(v) => setInspected(v === true)} />
          <Label htmlFor="f-inspected" className="font-normal cursor-pointer">بازرسی شده</Label>
        </div>
      </div>

      <Separator />

      {onCloseSheet && (
        <Button className="w-full" onClick={onCloseSheet}>
          <Search className="size-4" />
          اعمال فیلترها
        </Button>
      )}
    </div>
  );
}

export function BuyPage() {
  const { navigateTo } = useNavigation();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const favoriteIds = useFavorites((state) => state.favoriteIds);
  const mutatingFavoriteIds = useFavorites((state) => state.mutatingIds);
  const loadFavorites = useFavorites((state) => state.loadFavorites);
  const toggleListingFavorite = useFavorites((state) => state.toggleFavorite);
  const [listings, setListings] = useState<PublicListingSummary[]>([]);
  const [totalListings, setTotalListings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [plateType, setPlateType] = useState('all');
  const [brand, setBrand] = useState('all');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [mileageMin, setMileageMin] = useState('');
  const [mileageMax, setMileageMax] = useState('');
  const [body, setBody] = useState('all');
  const [color, setColor] = useState('all');
  const [transmission, setTransmission] = useState('all');
  const [fuel, setFuel] = useState('all');
  const [condition, setCondition] = useState('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('all');
  const [instantSale, setInstantSale] = useState(false);
  const [specialSale, setSpecialSale] = useState(false);
  const [inspected, setInspected] = useState(false);
  const updateFilter = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T,
  ) => {
    setCurrentPage(1);
    setter(value);
  };
  const filteredVehicles = listings;
  const totalPages = Math.ceil(totalListings / VEHICLES_PER_PAGE);
  const paginatedVehicles = listings;

  const filterVersion = [plateType, brand, model, yearMin, yearMax, priceMin, priceMax, mileageMin, mileageMax, body, color, transmission, fuel, condition, sellerTypeFilter, instantSale, specialSale, inspected, sortBy].join(',');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void fetchVehicleListings({
        page: currentPage,
        pageSize: VEHICLES_PER_PAGE,
        plateType: plateType === 'all' ? undefined : plateTypeApiMap[plateType],
        brand: brand === 'all' ? undefined : brand,
        model: model.trim() || undefined,
        yearMin: optionalPositiveNumber(yearMin),
        yearMax: optionalPositiveNumber(yearMax),
        priceMin: optionalPositiveNumber(priceMin, 1_000_000),
        priceMax: optionalPositiveNumber(priceMax, 1_000_000),
        mileageMin: optionalPositiveNumber(mileageMin, 1_000),
        mileageMax: optionalPositiveNumber(mileageMax, 1_000),
        bodyType: body === 'all' ? undefined : body,
        color: color === 'all' ? undefined : color,
        transmission: transmission === 'all' ? undefined : transmissionApiMap[transmission],
        fuelType: fuel === 'all' ? undefined : fuelApiMap[fuel],
        condition: condition === 'all' ? undefined : conditionApiMap[condition],
        sellerType: sellerTypeFilter === 'dealership' ? 'agency' : sellerTypeFilter === 'all' ? undefined : sellerTypeFilter,
        instantSale,
        specialSale,
        inspected,
        ordering: sortBy as 'newest' | 'cheapest' | 'priciest' | 'lowest-mileage',
        summary: true,
      }).then((response) => {
        if (cancelled) return;
        setListings(response.results);
        setTotalListings(response.count);
        setLoadError('');
      }).catch((error) => {
        if (cancelled) return;
        setListings([]);
        setTotalListings(0);
        setLoadError(error instanceof Error ? error.message : 'دریافت آگهی‌ها انجام نشد.');
      }).finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    body, brand, color, condition, currentPage, filterVersion, fuel,
    inspected, instantSale, mileageMax, mileageMin, model, plateType,
    priceMax, priceMin, reloadVersion, sellerTypeFilter, sortBy,
    specialSale, transmission, yearMax, yearMin,
  ]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [hasHydrated, isAuthenticated, loadFavorites]);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const handleFavorite = async (listing: PublicListingSummary) => {
    if (!isAuthenticated) {
      toast({
        title: 'ابتدا وارد حساب شوید',
        description: 'برای ذخیره آگهی باید وارد حساب کاربری شوید.',
      });
      navigateTo('login');
      return;
    }
    try {
      const saved = await toggleListingFavorite(listing);
      toast({
        title: saved ? 'آگهی ذخیره شد' : 'از علاقه‌مندی‌ها حذف شد',
      });
    } catch (error) {
      toast({
        title: 'ذخیره آگهی انجام نشد',
        description: error instanceof Error ? error.message : 'دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setPlateType('all'); setBrand('all'); setModel('');
    setYearMin(''); setYearMax(''); setPriceMin(''); setPriceMax('');
    setMileageMin(''); setMileageMax(''); setBody('all'); setColor('all');
    setTransmission('all'); setFuel('all'); setCondition('all');
    setSellerTypeFilter('all'); setInstantSale(false); setSpecialSale(false);
    setInspected(false);
  };

  const activeFilterCount = [plateType !== 'all', brand !== 'all', model !== '', yearMin !== '', yearMax !== '', priceMin !== '', priceMax !== '', mileageMin !== '', mileageMax !== '', body !== 'all', color !== 'all', transmission !== 'all', fuel !== 'all', condition !== 'all', sellerTypeFilter !== 'all', instantSale, specialSale, inspected].filter(Boolean).length;

  const filterProps: FilterProps = {
    plateType, brand, model, yearMin, yearMax, priceMin, priceMax,
    mileageMin, mileageMax, body, color, transmission, fuel, condition,
    sellerTypeFilter, instantSale, specialSale, inspected,
    activeFilterCount, onClearFilters: clearFilters,
    setPlateType: (value) => updateFilter(setPlateType, value),
    setBrand: (value) => updateFilter(setBrand, value),
    setModel: (value) => updateFilter(setModel, value),
    setYearMin: (value) => updateFilter(setYearMin, value),
    setYearMax: (value) => updateFilter(setYearMax, value),
    setPriceMin: (value) => updateFilter(setPriceMin, value),
    setPriceMax: (value) => updateFilter(setPriceMax, value),
    setMileageMin: (value) => updateFilter(setMileageMin, value),
    setMileageMax: (value) => updateFilter(setMileageMax, value),
    setBody: (value) => updateFilter(setBody, value),
    setColor: (value) => updateFilter(setColor, value),
    setTransmission: (value) => updateFilter(setTransmission, value),
    setFuel: (value) => updateFilter(setFuel, value),
    setCondition: (value) => updateFilter(setCondition, value),
    setSellerTypeFilter: (value) => updateFilter(setSellerTypeFilter, value),
    setInstantSale: (value) => updateFilter(setInstantSale, value),
    setSpecialSale: (value) => updateFilter(setSpecialSale, value),
    setInspected: (value) => updateFilter(setInspected, value),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>خرید خودرو</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">خرید خودرو</h1>
            <p className="text-muted-foreground text-sm mt-1">
              <span>{toPersianNumber(totalListings)} خودرو</span>
              {totalPages > 1 && (
                <span> · صفحه {toPersianNum(currentPage)} از {toPersianNum(totalPages)}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2">
                  <SlidersHorizontal className="size-4" />
                  فیلتر
                  {activeFilterCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">{toPersianNumber(activeFilterCount)}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>فیلتر خودرو</SheetTitle>
                  <SheetDescription>مشخصات مورد نظر خود را انتخاب کنید</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)]">
                  <FilterSidebar {...filterProps} onCloseSheet={() => setSheetOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={(value) => updateFilter(setSortBy, value)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 shrink-0">
            <Card className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin py-0">
              <ScrollArea className="max-h-[calc(100vh-140px)]">
                <FilterSidebar {...filterProps} />
              </ScrollArea>
            </Card>
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="size-10 animate-spin text-gold-dark mb-4" />
                <p className="text-sm text-muted-foreground">در حال دریافت آگهی‌های واقعی...</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <RefreshCw className="size-12 text-destructive/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">دریافت آگهی‌ها ناموفق بود</h3>
                <p className="text-muted-foreground text-sm mb-4">{loadError}</p>
                <Button variant="outline" onClick={() => setReloadVersion((value) => value + 1)}>تلاش دوباره</Button>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">خودرویی یافت نشد</h3>
                <p className="text-muted-foreground text-sm mb-4">فیلترهای خود را تغییر دهید یا محدودیت‌ها را کمتر کنید</p>
                <Button variant="outline" onClick={clearFilters}>پاک کردن فیلترها</Button>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="py-0 overflow-hidden hover-lift group">
                    <div className="relative">
                      <OptimizedImage
                        src={listingImageUrl(vehicle)}
                        alt={`${vehicle.brand_name} ${vehicle.model_name}`}
                        width={640}
                        height={400}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="aspect-[16/10] w-full object-cover cursor-pointer"
                        onClick={() => navigateTo('vehicle-details', { vehicleId: vehicle.id })}
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        {(vehicle.is_instant_sale || vehicle.is_special_sale) && (
                          <Badge className={`${vehicle.is_instant_sale ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-gold hover:bg-gold-dark text-white'}`}>
                            {vehicle.is_instant_sale ? 'فروش فوری' : 'فروش ویژه'}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-white/90 text-foreground">
                          {vehicle.plate_type_label}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        disabled={mutatingFavoriteIds.includes(vehicle.id)}
                        aria-label={favoriteIds.includes(vehicle.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                        onClick={() => void handleFavorite(vehicle)}
                        className="absolute top-3 left-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
                      >
                        {mutatingFavoriteIds.includes(vehicle.id) ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Heart className={`size-4 ${favoriteIds.includes(vehicle.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                        )}
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-sm line-clamp-1">{vehicle.brand_name} {vehicle.model_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{vehicle.trim_name || 'تیپ پایه'} &middot; {toPersianNumber(vehicle.production_year)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-muted-foreground" />
                          {formatMileage(vehicle.mileage)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-muted-foreground" />
                          {vehicle.transmission_label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">قیمت</p>
                          <p className="font-bold text-sm text-brand">{vehicle.price === null ? 'تماس بگیرید' : formatPrice(vehicle.price)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigateTo('vehicle-details', { vehicleId: vehicle.id })}
                        >
                          جزئیات
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 mb-4">
                  <Pagination dir="rtl">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          aria-label="صفحه قبلی"
                          className={`gap-1 px-2.5 sm:pr-2.5 ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}`}
                        >
                          <ChevronRight className="size-4" />
                          <span className="hidden sm:inline">قبلی</span>
                        </PaginationLink>
                      </PaginationItem>

                      {getPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {toPersianNum(page)}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          aria-label="صفحه بعدی"
                          className={`gap-1 px-2.5 sm:pl-2.5 ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}`}
                        >
                          <span className="hidden sm:inline">بعدی</span>
                          <ChevronLeft className="size-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function toPersianNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}
