'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Play,
  Clock,
  MapPin,
  Search,
  Car,
  Building2,
  Zap,
  Award,
  Eye,
  ArrowLeft,
  Filter,
  X,
  Store,
  TrendingUp,
  MessageCircle,
  Phone,
  Share2,
  BookmarkPlus,
  Sparkles,
  Users,
  BarChart3,
  Gem,
  ChevronDown,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  toPersianNumber,
  cn,
} from '@/lib/utils';
import {
  heroImages,
  brands,
  blogArticles,
  videos,
  faqs,
  bodyTypes,
  bodyTypeImages,
  budgetImages,
  cities,
} from '@/lib/mock-data';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { useFavorites } from '@/stores/favorites';
import {
  fetchVehicleListings,
  type PublicListingSummary,
} from '@/lib/listing-api';
import { PublicListingCard } from '@/components/vehicle/PublicListingCard';
import { ComingSoonNotice } from '@/components/ui/coming-soon';
import {
  fetchBusinesses,
  type BusinessKind,
  type BusinessProfile,
} from '@/lib/business-api';

// Editorial sections still use sample fixtures. Never show them as live data.
const editorialContentReady = false;

/* ------------------------------------------------------------------ */
/*  Horizontal Scroll Hook                                             */
/* ------------------------------------------------------------------ */
function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = 300;
    ref.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };
  return { ref, scroll };
}

/* ------------------------------------------------------------------ */
/*  Live listings                                                      */
/* ------------------------------------------------------------------ */
function useHomeListings(kind: 'instant' | 'special' | 'latest') {
  const [listings, setListings] = useState<PublicListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchVehicleListings({
      pageSize: kind === 'latest' ? 6 : 8,
      instantSale: kind === 'latest' ? false : kind === 'instant' ? true : undefined,
      specialSale: kind === 'latest' ? false : kind === 'special' ? true : undefined,
      ordering: 'newest',
      summary: true,
    })
      .then((response) => {
        if (cancelled) return;
        setListings(response.results);
      })
      .catch(() => {
        if (!cancelled) setListings([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { listings, isLoading };
}

function useHomeBusinesses(kind: BusinessKind) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  useEffect(() => {
    let active = true;
    void fetchBusinesses({ kind, pageSize: 8 })
      .then((page) => { if (active) setBusinesses(page.results); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [kind]);
  return businesses;
}

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`container mx-auto px-6 py-14 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary">{children}</h2>
      {subtitle && <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                           */
/* ------------------------------------------------------------------ */
export function HomePage() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const hasHydrated = useAuth((state) => state._hasHydrated);
  const loadFavorites = useFavorites((state) => state.loadFavorites);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      void loadFavorites().catch(() => undefined);
    }
  }, [hasHydrated, isAuthenticated, loadFavorites]);

  return (
    <div className="bg-white">
      <HeroSlider />
      <SmartSearch />
      <BrandsSection />
      <TrustedDealerships />
      <BudgetSection />
      <InstantSaleSection />
      <TrustedGalleries />
      <SpecialOffersSection />
      <BodyStylesSection />
      <LatestListingsSection />
      <EducationalVideos />
      <FAQSection />
      <BlogSection />
    </div>
  );
}

/* ================================================================== */
/*  1. Hero Slider                                                     */
/* ================================================================== */
function HeroSlider() {
  const { navigateTo } = useNavigation();
  const [current, setCurrent] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="relative h-[420px] md:h-[520px] lg:h-[580px] overflow-hidden bg-brand">
        {/* Slides */}
        {heroImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <OptimizedImage
              src={img}
              alt=""
              width={1920}
              height={900}
              priority={i === 0}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-brand/80 via-brand/50 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1.5 rounded-full text-xs font-medium mb-5">
                <Sparkles className="size-3.5" />
                <span>پلتفرم معتبر خودروهای منطقه آزاد</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                معامله‌ای بر پایه
                <br />
                <span className="text-gradient">شفافیت و اعتماد</span>
              </h1>
              <p className="text-white/60 text-sm md:text-base leading-7 mb-8 max-w-md">
                آگهی‌های واقعی خودروهای وارداتی و منطقه آزاد را جست‌وجو و بررسی کنید
              </p>

              <Button onClick={() => navigateTo('buy')} className="bg-gold text-brand hover:bg-gold/90">
                مشاهده همه آگهی‌ها
                <ArrowLeft className="size-4" />
              </Button>

              <p className="mt-8 text-xs text-white/70">آمار سامانه بعد از اتصال گزارش‌گیری واقعی نمایش داده می‌شود.</p>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-gold' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Sell Type Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm bg-white border-border-light p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-bold text-text-primary">نوع فروش خود را انتخاب کنید</DialogTitle>
            <DialogDescription className="text-sm text-text-muted">
              برای ثبت آگهی، ابتدا نوع حساب خود را مشخص کنید
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 flex flex-col gap-3">
            <button
              onClick={() => { setShowDialog(false); navigateTo('account-type', { type: 'personal' }); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border-light hover:border-gold/50 hover:bg-gold/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center">
                <Users className="size-6 text-brand" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">فروشنده شخصی</p>
                <p className="text-xs text-text-muted mt-0.5">ثبت آگهی خودرو شخصی</p>
              </div>
              <ArrowLeft className="size-4 text-text-muted mr-auto group-hover:text-brand transition-colors" />
            </button>
            <button
              onClick={() => { setShowDialog(false); navigateTo('account-type', { type: 'gallery' }); }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border-light hover:border-gold/50 hover:bg-gold/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Store className="size-6 text-gold-dark" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">نمایشگاه خودرو</p>
                <p className="text-xs text-text-muted mt-0.5">ثبت آگهی به عنوان نمایشگاه</p>
              </div>
              <ArrowLeft className="size-4 text-text-muted mr-auto group-hover:text-brand transition-colors" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ================================================================== */
/* ---- reusable single-select option row ---- */
function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(label)}
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
        selected
          ? 'bg-brand/5 text-brand font-medium'
          : 'text-text-secondary hover:text-text-primary hover:bg-muted'
      )}
    >
      <span>{label}</span>
      {selected && <Check className="size-4 text-brand" />}
    </button>
  );
}
/* ---- reusable multi-select option row ---- */
function MultiOptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: (v: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(label)}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer',
        selected
          ? 'bg-brand/5 text-brand font-medium'
          : 'text-text-secondary hover:text-text-primary hover:bg-muted'
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-brand border-brand' : 'border-border-light'
        )}
      >
        {selected && <Check className="size-3 text-white" />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}
/* ---- filter trigger button ---- */
function FilterTrigger({ label, count, children }: { label: string; count?: number; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'h-9 px-3 text-xs rounded-lg transition-colors border flex items-center gap-1.5 whitespace-nowrap',
            count && count > 0
              ? 'bg-brand/5 text-brand border-brand/20 font-medium'
              : 'bg-muted/50 text-text-secondary border-border-light hover:bg-muted hover:text-text-primary'
          )}
        >
          <span>{label}</span>
          {count && count > 0 && (
            <span className="bg-brand text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
              {toPersianNumber(count)}
            </span>
          )}
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="bg-white border-border-light shadow-premium-lg rounded-xl p-2 min-w-[200px] max-h-64 overflow-y-auto"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/* ================================================================== */
/*  2. Smart Search                                                     */
/* ================================================================== */
function SmartSearch() {
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState('');

  /* ---- filter state ---- */
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMileage, setSelectedMileage] = useState<string | null>(null);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const toggleBrand = (name: string) =>
    setSelectedBrands((p) => (p.includes(name) ? p.filter((b) => b !== name) : [...p, name]));
  const toggleBodyType = (name: string) =>
    setSelectedBodyTypes((p) => (p.includes(name) ? p.filter((b) => b !== name) : [...p, name]));

  const clearAll = () => {
    setSelectedBrands([]);
    setSelectedPrice(null);
    setSelectedYear(null);
    setSelectedMileage(null);
    setSelectedBodyTypes([]);
    setSelectedCity(null);
  };

  const activeCount =
    selectedBrands.length +
    (selectedPrice ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (selectedMileage ? 1 : 0) +
    selectedBodyTypes.length +
    (selectedCity ? 1 : 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('buy', {
      search: query.trim() || undefined,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      priceRange: selectedPrice || undefined,
      yearRange: selectedYear || undefined,
      mileageRange: selectedMileage || undefined,
      bodyTypes: selectedBodyTypes.length > 0 ? selectedBodyTypes : undefined,
      city: selectedCity || undefined,
    });
  };

  const priceOptions = [
    'تا ۵ میلیارد',
    '۵ تا ۱۰ میلیارد',
    '۱۰ تا ۲۰ میلیارد',
    '۲۰ تا ۳۰ میلیارد',
    'بالای ۳۰ میلیارد',
  ];
  const yearOptions = [
    '۲۰۲۴ و بالاتر',
    '۲۰۲۲ تا ۲۰۲۳',
    '۲۰۲۰ تا ۲۰۲۱',
    '۲۰۱۸ تا ۲۰۱۹',
    '۲۰۱۵ تا ۲۰۱۷',
    'قبل از ۲۰۱۵',
  ];
  const mileageOptions = [
    'صفر کیلومتر',
    'تا ۱۰,۰۰۰ کیلومتر',
    '۱۰,۰۰۰ تا ۵۰,۰۰۰ کیلومتر',
    '۵۰,۰۰۰ تا ۱۰۰,۰۰۰ کیلومتر',
    'بالای ۱۰۰,۰۰۰ کیلومتر',
  ];

  return (
    <div className="relative -mt-8 z-20 container mx-auto px-4 sm:px-6">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-premium-lg border border-border-light p-3 sm:p-4"
      >
        {/* Row 1: Search input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-5 text-text-muted" />
            <Input
              type="text"
              placeholder="نام خودرو، برند یا مدل را جستجو کنید..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pr-10 border-transparent bg-muted/50 text-sm placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-6 bg-brand hover:bg-brand-light text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">جستجو</span>
          </button>
        </div>

        {/* Row 2: Filter dropdowns */}
        <div className="mt-3 pt-3 border-t border-border-light flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted flex items-center gap-1 ml-1">
            <Filter className="size-3.5" />
            فیلترها:
          </span>

          <FilterTrigger label="برند" count={selectedBrands.length}>
            <div className="space-y-0.5">
              {brands.map((b) => (
                <MultiOptionRow key={b.id} label={b.name} selected={selectedBrands.includes(b.name)} onClick={toggleBrand} />
              ))}
            </div>
          </FilterTrigger>

          <FilterTrigger label="قیمت" count={selectedPrice ? 1 : 0}>
            <div className="space-y-0.5">
              {priceOptions.map((p) => (
                <OptionRow key={p} label={p} selected={selectedPrice === p} onClick={(v) => setSelectedPrice(selectedPrice === v ? null : v)} />
              ))}
            </div>
          </FilterTrigger>

          <FilterTrigger label="سال" count={selectedYear ? 1 : 0}>
            <div className="space-y-0.5">
              {yearOptions.map((y) => (
                <OptionRow key={y} label={y} selected={selectedYear === y} onClick={(v) => setSelectedYear(selectedYear === v ? null : v)} />
              ))}
            </div>
          </FilterTrigger>

          <FilterTrigger label="کارکرد" count={selectedMileage ? 1 : 0}>
            <div className="space-y-0.5">
              {mileageOptions.map((m) => (
                <OptionRow key={m} label={m} selected={selectedMileage === m} onClick={(v) => setSelectedMileage(selectedMileage === v ? null : v)} />
              ))}
            </div>
          </FilterTrigger>

          <FilterTrigger label="نوع بدنه" count={selectedBodyTypes.length}>
            <div className="space-y-0.5">
              {bodyTypes.slice(0, 7).map((bt) => (
                <MultiOptionRow key={bt} label={bt} selected={selectedBodyTypes.includes(bt)} onClick={toggleBodyType} />
              ))}
            </div>
          </FilterTrigger>

          <FilterTrigger label="شهر" count={selectedCity ? 1 : 0}>
            <div className="space-y-0.5">
              {cities.map((c) => (
                <OptionRow key={c} label={c} selected={selectedCity === c} onClick={(v) => setSelectedCity(selectedCity === v ? null : v)} />
              ))}
            </div>
          </FilterTrigger>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="mr-auto h-9 px-3 text-xs text-danger hover:text-danger/80 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="size-3" />
              پاک کردن فیلترها
            </button>
          )}
        </div>

        {/* Row 3: Active filter tags */}
        {activeCount > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-border-light/60 flex flex-wrap gap-1.5">
            {selectedBrands.map((b) => (
              <FilterTag key={b} label={b} onRemove={() => toggleBrand(b)} />
            ))}
            {selectedPrice && <FilterTag label={selectedPrice} onRemove={() => setSelectedPrice(null)} />}
            {selectedYear && <FilterTag label={selectedYear} onRemove={() => setSelectedYear(null)} />}
            {selectedMileage && <FilterTag label={selectedMileage} onRemove={() => setSelectedMileage(null)} />}
            {selectedBodyTypes.map((bt) => (
              <FilterTag key={bt} label={bt} onRemove={() => toggleBodyType(bt)} />
            ))}
            {selectedCity && <FilterTag label={selectedCity} onRemove={() => setSelectedCity(null)} />}
          </div>
        )}
      </form>
    </div>
  );
}

/* ---- Small helper: removable filter tag ---- */
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium bg-brand/5 text-brand rounded-lg">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-brand/10 rounded-full p-0.5 transition-colors"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}


/* ================================================================== */
/*  3. Vehicle Brands                                                  */
/* ================================================================== */
function BrandsSection() {
  const { navigateTo } = useNavigation();
  const { ref, scroll } = useHorizontalScroll();

  if (!editorialContentReady) return <Section><ComingSoonNotice title="برندهای خودرو" detail="فهرست برندها هنوز به بانک اطلاعات خودرو متصل نشده است؛ برای جست‌وجوی آگهی واقعی از بخش خرید خودرو استفاده کنید." /></Section>;

  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>برندهای خودرو</SectionTitle>
        <button
          onClick={() => navigateTo('brands')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => navigateTo('brand-detail', { brandId: brand.id })}
              className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-muted/40 transition-colors"
            >
              <OptimizedImage
                src={brand.logo}
                alt={brand.name}
                width={96}
                height={96}
                sizes="48px"
                className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain opacity-80"
              />
              <span className="text-[10px] sm:text-[11px] text-text-muted font-medium">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronLeft className="size-4 text-text-secondary" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronRight className="size-4 text-text-secondary" />
        </button>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  4. Trusted Dealerships                                             */
/* ================================================================== */
function TrustedDealerships() {
  const { navigateTo } = useNavigation();
  const { ref } = useHorizontalScroll();
  const businesses = useHomeBusinesses('agency');

  return (
    <Section className="bg-warm-gray">
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>نمایندگی‌های معتمد آزاد گذر</SectionTitle>
        <button
          onClick={() => navigateTo('dealerships')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {businesses.map((dealer) => (
            <button
              key={dealer.id}
              onClick={() => navigateTo('dealership-detail', { businessSlug: dealer.slug })}
              className="flex-shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-white border border-border-light hover-lift group"
            >
              <div className="relative h-36 overflow-hidden">
                {dealer.cover ? <OptimizedImage src={dealer.cover} alt="" width={576} height={288} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="size-full bg-gradient-to-br from-brand to-brand-light" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2.5 left-2.5 bg-gold text-brand text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium"><ShieldCheck className="size-3" />تایید شده</div>
                <div className="absolute bottom-2.5 right-2.5 left-2.5">
                  <p className="text-sm font-bold text-white">{dealer.name}</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <MapPin className="size-3" />
                  <span>{dealer.city}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gold-dark">
                  <Car className="size-3 text-gold" />
                  <span className="font-medium">{toPersianNumber(dealer.listing_count)} خودرو</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  5. Luxury Cars by Budget                                           */
/* ================================================================== */
function BudgetSection() {
  const { navigateTo } = useNavigation();
  const budgetCategories = [
    { label: 'خودروهای تا ۷ میلیارد', max: 7_000_000_000, image: budgetImages[0] },
    { label: '۷ تا ۱۵ میلیارد', min: 7_000_000_000, max: 15_000_000_000, image: budgetImages[1] },
    { label: '۱۵ تا ۳۰ میلیارد', min: 15_000_000_000, max: 30_000_000_000, image: budgetImages[2] },
    { label: 'بالای ۳۰ میلیارد', min: 30_000_000_000, image: budgetImages[3] },
  ];

  return (
    <Section>
      <SectionTitle subtitle="خودروهای لوکس بر اساس بودجه شما">خودروهای لوکس بر اساس بودجه</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {budgetCategories.map((cat, i) => (
          <button
            key={i}
            onClick={() => navigateTo('buy', { minPrice: cat.min, maxPrice: cat.max })}
            className="relative h-52 md:h-64 rounded-xl overflow-hidden group cursor-pointer"
          >
            <OptimizedImage src={cat.image} alt="" width={384} height={512} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/80 via-brand/30 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-4">
              <p className="text-sm md:text-base font-bold text-white">{cat.label}</p>
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                مشاهده خودروها
                <ArrowLeft className="size-3" />
              </p>
            </div>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  6. Instant Sale Section                                             */
/* ================================================================== */
function InstantSaleSection() {
  const { navigateTo } = useNavigation();
  const { ref, scroll } = useHorizontalScroll();
  const { listings, isLoading } = useHomeListings('instant');

  return (
    <Section className="bg-warm-gray">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="size-5 text-red-500" />
            فروش فوری
            <span className="text-sm font-normal text-text-muted mr-2">| فرصتی محدود</span>
          </h2>
        </div>
        <button
          onClick={() => navigateTo('instant-sale')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {isLoading && <div className="w-full py-10 flex items-center justify-center"><Loader2 className="size-7 animate-spin text-gold-dark" /></div>}
          {!isLoading && listings.length === 0 && <p className="w-full py-10 text-center text-sm text-text-muted">فعلاً آگهی فروش فوری فعالی وجود ندارد.</p>}
          {listings.map((listing) => (
            <div key={listing.id} className="flex-shrink-0 w-72">
              <PublicListingCard listing={listing} emphasis="instant" compact />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronLeft className="size-4 text-text-secondary" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronRight className="size-4 text-text-secondary" />
        </button>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  7. Trusted Galleries                                                */
/* ================================================================== */
function TrustedGalleries() {
  const { navigateTo } = useNavigation();
  const { ref } = useHorizontalScroll();
  const businesses = useHomeBusinesses('gallery');

  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>نمایشگاه‌های معتمد آزاد گذر</SectionTitle>
        <button
          onClick={() => navigateTo('galleries')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {businesses.map((gallery) => (
            <button
              key={gallery.id}
              onClick={() => navigateTo('gallery-detail', { businessSlug: gallery.slug })}
              className="flex-shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-white border border-border-light hover-lift group"
            >
              <div className="relative h-40 overflow-hidden">
                {gallery.cover ? <OptimizedImage src={gallery.cover} alt="" width={576} height={320} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="size-full bg-gradient-to-br from-brand to-brand-light" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2.5 left-2.5 bg-gold text-brand text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium"><ShieldCheck className="size-3" />تایید شده</div>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-bold text-text-primary mb-1.5">{gallery.name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <MapPin className="size-3" />
                    <span>{gallery.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gold-dark">
                    <Car className="size-3 text-gold" />
                    <span className="font-medium">{toPersianNumber(gallery.listing_count)} خودرو</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  8. Special Offers                                                   */
/* ================================================================== */
function SpecialOffersSection() {
  const { navigateTo } = useNavigation();
  const { ref, scroll } = useHorizontalScroll();
  const { listings, isLoading } = useHomeListings('special');

  return (
    <Section className="bg-warm-gray">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Award className="size-5 text-gold" />
            فروش ویژه
            <span className="text-sm font-normal text-text-muted mr-2">| فرصت‌های طلایی مالکیت</span>
          </h2>
        </div>
        <button
          onClick={() => navigateTo('special-sale')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {isLoading && <div className="w-full py-10 flex items-center justify-center"><Loader2 className="size-7 animate-spin text-gold-dark" /></div>}
          {!isLoading && listings.length === 0 && <p className="w-full py-10 text-center text-sm text-text-muted">فعلاً آگهی ویژه فعالی وجود ندارد.</p>}
          {listings.map((listing) => (
            <div key={listing.id} className="flex-shrink-0 w-72">
              <PublicListingCard listing={listing} emphasis="special" compact />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronRight className="size-4 text-text-secondary" />
        </button>
        <button
          onClick={() => scroll('left')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-premium flex items-center justify-center hover:shadow-premium-lg transition-shadow z-10"
        >
          <ChevronLeft className="size-4 text-text-secondary" />
        </button>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  9. Body Styles                                                      */
/* ================================================================== */
function BodyStylesSection() {
  const { navigateTo } = useNavigation();
  const { ref, scroll } = useHorizontalScroll();
  const mainBodyTypes = bodyTypes.slice(0, 6);

  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>نوع بدنه خودرو</SectionTitle>
        <button onClick={() => navigateTo('buy')} className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors">
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {mainBodyTypes.map((type) => (
            <button
              key={type}
              onClick={() => navigateTo('buy', { bodyType: type })}
              className="flex-shrink-0 w-40 md:w-48 rounded-xl overflow-hidden bg-white border border-border-light hover-lift group"
            >
              <div className="relative h-28 overflow-hidden">
                <OptimizedImage
                  src={bodyTypeImages[type] || ''}
                  alt={type}
                  width={384}
                  height={224}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand/70 to-transparent" />
                <div className="absolute bottom-2.5 right-3">
                  <p className="text-sm font-bold text-white">{type}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  10. Latest Listings                                                 */
/* ================================================================== */
function LatestListingsSection() {
  const { navigateTo } = useNavigation();
  const { listings, isLoading } = useHomeListings('latest');

  return (
    <Section className="bg-warm-gray">
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>تازه‌ترین خودروهای ثبت شده</SectionTitle>
        <button
          onClick={() => navigateTo('buy')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="sm:col-span-2 lg:col-span-3 py-10 flex items-center justify-center"><Loader2 className="size-7 animate-spin text-gold-dark" /></div>}
        {!isLoading && listings.length === 0 && <p className="sm:col-span-2 lg:col-span-3 py-10 text-center text-sm text-text-muted">هنوز آگهی عادی فعالی ثبت نشده است.</p>}
        {listings.map((listing) => (
          <PublicListingCard key={listing.id} listing={listing} compact />
        ))}
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  11. Educational Videos                                              */
/* ================================================================== */
function EducationalVideos() {
  const { navigateTo } = useNavigation();
  const { ref, scroll } = useHorizontalScroll();

  if (!editorialContentReady) return <Section><ComingSoonNotice title="ویدیوهای آموزشی" detail="ویدیوهای نمونه از صفحه اصلی حذف شده‌اند تا فقط محتوای منتشرشدهٔ واقعی نمایش داده شود." /></Section>;

  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>ویدیوهای آموزشی</SectionTitle>
        <button
          onClick={() => navigateTo('videos')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="relative">
        <div ref={ref} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {videos.slice(0, 6).map((video) => (
            <button
              key={video.id}
              onClick={() => navigateTo('videos', { videoId: video.id })}
              className="flex-shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-white border border-border-light hover-lift group"
            >
              <div className="relative h-40 overflow-hidden">
                <OptimizedImage
                  src={video.thumbnail}
                  alt={video.title}
                  width={576}
                  height={320}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="size-5 text-brand mr-[-2px]" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-brand/90 text-white text-[11px] px-2 py-0.5 rounded-md">
                  {video.duration}
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold text-text-primary line-clamp-2 leading-6">{video.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                  <span>{video.category}</span>
                  <span>•</span>
                  <span>{video.views} بازدید</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  12. FAQ Section                                                     */
/* ================================================================== */
function FAQSection() {
  if (!editorialContentReady) return <Section><ComingSoonNotice title="سؤالات متداول" detail="پاسخ‌های این بخش هنوز نهایی و تأیید نشده‌اند." /></Section>;

  return (
    <Section className="bg-warm-gray">
      <div className="max-w-3xl mx-auto">
        <SectionTitle subtitle="پاسخ سوالات رایج درباره خدمات آزاد گذر">سوالات متداول</SectionTitle>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.slice(0, 6).map((faq, i) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-white rounded-xl border border-border-light px-5 data-[state=open]:shadow-card"
            >
              <AccordionTrigger className="text-sm font-semibold text-text-primary hover:no-underline py-4 text-right">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-text-muted leading-7 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  13. Blog Section                                                    */
/* ================================================================== */
function BlogSection() {
  const { navigateTo } = useNavigation();

  if (!editorialContentReady) return <Section><ComingSoonNotice title="مجله خودرو" detail="سامانه مقاله‌ها هنوز آماده انتشار محتوا نیست؛ مطالب نمونه نمایش داده نمی‌شوند." /></Section>;

  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <SectionTitle>مجله خودرو آزاد گذر</SectionTitle>
        <button
          onClick={() => navigateTo('blog')}
          className="text-sm text-gold-dark hover:text-gold font-medium flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {blogArticles.slice(0, 3).map((article) => (
          <button
            key={article.id}
            onClick={() => navigateTo('article-detail', { articleId: article.id })}
            className="text-right bg-white rounded-xl border border-border-light overflow-hidden hover-lift group"
          >
            <div className="relative h-48 overflow-hidden">
              <OptimizedImage
                src={article.image}
                alt={article.title}
                width={800}
                height={480}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 right-2.5">
                <Badge className="bg-white/90 text-text-primary text-[10px] px-2.5 py-0.5 rounded-md font-medium border-0">
                  {article.category}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-6 mb-2">
                {article.title}
              </h3>
              <p className="text-xs text-text-muted line-clamp-2 leading-5 mb-3">
                {article.summary}
              </p>
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>{article.date}</span>
                <span>{article.readTime} مطالعه</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Section>
  );
}
