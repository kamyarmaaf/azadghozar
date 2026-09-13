'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, GitCompareArrows, Loader2, Plus, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  comparisonImageUrl,
  cursorFromPageUrl,
  fetchComparisonCandidates,
  fetchComparisonListings,
  type ComparisonCandidate,
  type ComparisonListing,
} from '@/lib/listing-api';
import { formatMileage, formatPrice, toPersianNumber } from '@/lib/utils';
import { MAX_COMPARISON_ITEMS, useComparison } from '@/stores/comparison';
import { useNavigation } from '@/stores/navigation';

type ComparisonCategory = {
  key: string;
  label: string;
  getValue: (listing: ComparisonListing) => string;
  getNumeric?: (listing: ComparisonListing) => number | null;
  bestDirection?: 'low' | 'high';
};

const categories: ComparisonCategory[] = [
  {
    key: 'price',
    label: 'قیمت',
    getValue: (listing) => listing.price === null ? 'تماس بگیرید' : formatPrice(listing.price),
    getNumeric: (listing) => listing.price,
    bestDirection: 'low',
  },
  {
    key: 'year',
    label: 'سال ساخت',
    getValue: (listing) => toPersianNumber(listing.production_year),
    getNumeric: (listing) => listing.production_year,
    bestDirection: 'high',
  },
  {
    key: 'mileage',
    label: 'کارکرد',
    getValue: (listing) => formatMileage(listing.mileage),
    getNumeric: (listing) => listing.mileage,
    bestDirection: 'low',
  },
  { key: 'engine', label: 'موتور', getValue: (listing) => listing.engine_description || 'ثبت نشده' },
  { key: 'transmission', label: 'گیربکس', getValue: (listing) => listing.transmission_label },
  { key: 'fuel', label: 'نوع سوخت', getValue: (listing) => listing.fuel_type_label },
  { key: 'drivetrain', label: 'انتقال قدرت', getValue: (listing) => listing.drivetrain_label },
  { key: 'body', label: 'نوع بدنه', getValue: (listing) => listing.body_type },
  { key: 'color', label: 'رنگ', getValue: (listing) => listing.color },
  { key: 'plate', label: 'نوع پلاک', getValue: (listing) => listing.plate_type_label },
  { key: 'condition', label: 'وضعیت خودرو', getValue: (listing) => listing.condition_label },
  { key: 'body-condition', label: 'وضعیت بدنه', getValue: (listing) => listing.body_condition_label },
  { key: 'chassis', label: 'وضعیت شاسی', getValue: (listing) => listing.chassis_condition_label },
  { key: 'engine-condition', label: 'وضعیت فنی', getValue: (listing) => listing.engine_condition_label },
  {
    key: 'insurance',
    label: 'بیمه شخص ثالث',
    getValue: (listing) => listing.insurance_months === null
      ? 'ثبت نشده'
      : `${toPersianNumber(listing.insurance_months)} ماه`,
  },
  { key: 'city', label: 'شهر', getValue: (listing) => listing.city },
];

function bestValue(
  category: ComparisonCategory,
  listings: ComparisonListing[],
): number | null {
  if (!category.getNumeric || !category.bestDirection) return null;
  const values = listings
    .map(category.getNumeric)
    .filter((value): value is number => value !== null);
  if (values.length < 2) return null;
  return category.bestDirection === 'low'
    ? Math.min(...values)
    : Math.max(...values);
}

export function ComparisonPage() {
  const navigateTo = useNavigation((state) => state.navigateTo);
  const selectedIds = useComparison((state) => state.selectedIds);
  const toggle = useComparison((state) => state.toggle);
  const remove = useComparison((state) => state.remove);
  const clear = useComparison((state) => state.clear);
  const syncAvailable = useComparison((state) => state.syncAvailable);

  const [listings, setListings] = useState<ComparisonListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<ComparisonCandidate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [candidateError, setCandidateError] = useState('');
  const [candidateReloadVersion, setCandidateReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (selectedIds.length === 0) {
        setListings([]);
        setLoadError('');
        return;
      }
      setIsLoading(true);
      setLoadError('');
      fetchComparisonListings(selectedIds, controller.signal)
        .then((data) => {
          setListings(data);
          if (data.length !== selectedIds.length) {
            syncAvailable(data.map((listing) => listing.id));
            toast({
              title: 'فهرست مقایسه به‌روز شد',
              description: 'آگهی غیرفعال یا حذف‌شده از مقایسه کنار گذاشته شد.',
            });
          }
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setLoadError(error instanceof Error ? error.message : 'دریافت اطلاعات مقایسه انجام نشد.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedIds, syncAvailable]);

  useEffect(() => {
    if (!pickerOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (search.trim().length === 1) {
        setCandidates([]);
        setNextCursor(null);
        setCandidateError('برای جست‌وجو حداقل دو حرف وارد کنید.');
        setIsLoadingCandidates(false);
        return;
      }
      setIsLoadingCandidates(true);
      setCandidateError('');
      fetchComparisonCandidates({
        query: search,
        pageSize: 16,
        signal: controller.signal,
      })
        .then((page) => {
          setCandidates(page.results);
          setNextCursor(cursorFromPageUrl(page.next));
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setCandidateError(error instanceof Error ? error.message : 'دریافت آگهی‌ها انجام نشد.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingCandidates(false);
        });
    }, search.trim() ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [candidateReloadVersion, pickerOpen, search]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const searchTooShort = search.trim().length === 1;

  const handleToggle = (listingId: number) => {
    const result = toggle(listingId);
    if (result === 'limit') {
      toast({
        title: 'ظرفیت مقایسه تکمیل است',
        description: `حداکثر ${toPersianNumber(MAX_COMPARISON_ITEMS)} خودرو را می‌توانید مقایسه کنید.`,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: result === 'added' ? 'به مقایسه اضافه شد' : 'از مقایسه حذف شد' });
    if (result === 'added' && selectedIds.length + 1 >= MAX_COMPARISON_ITEMS) {
      setPickerOpen(false);
    }
  };

  const loadMoreCandidates = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setCandidateError('');
    try {
      const page = await fetchComparisonCandidates({
        query: search,
        cursor: nextCursor,
        pageSize: 16,
      });
      setCandidates((current) => {
        const knownIds = new Set(current.map((candidate) => candidate.id));
        return [
          ...current,
          ...page.results.filter((candidate) => !knownIds.has(candidate.id)),
        ];
      });
      setNextCursor(cursorFromPageUrl(page.next));
    } catch (error) {
      setCandidateError(error instanceof Error ? error.message : 'دریافت ادامه آگهی‌ها انجام نشد.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">
                خانه
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>مقایسه خودرو</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">مقایسه خودرو</h1>
            <p className="text-sm text-muted-foreground mt-1">
              حداکثر {toPersianNumber(MAX_COMPARISON_ITEMS)} آگهی واقعی را کنار هم بررسی کنید.
            </p>
          </div>
          <Button
            onClick={() => setPickerOpen(true)}
            disabled={selectedIds.length >= MAX_COMPARISON_ITEMS}
          >
            <Plus className="size-4" />
            افزودن خودرو
          </Button>
        </div>

        {selectedIds.length === 0 ? (
          <Card className="py-0">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                <GitCompareArrows className="size-12 text-muted-foreground/40" />
              </div>
              <h2 className="text-xl font-bold mb-3">هنوز خودرویی انتخاب نشده است</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                از میان آگهی‌های فعال، خودروهای موردنظر را انتخاب کنید تا مشخصاتشان هم‌زمان نمایش داده شود.
              </p>
              <Button onClick={() => setPickerOpen(true)}>
                <Search className="size-4" />
                انتخاب خودرو
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="py-0 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {isLoading && listings.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-5">
                      <Loader2 className="size-4 animate-spin" />
                      در حال دریافت اطلاعات مقایسه...
                    </div>
                  ) : listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="relative shrink-0 flex items-center gap-3 bg-secondary rounded-xl p-2 pl-8 min-w-[210px]"
                    >
                      <button
                        type="button"
                        aria-label="حذف از مقایسه"
                        onClick={() => remove(listing.id)}
                        className="absolute top-2 left-2 w-5 h-5 bg-destructive/10 hover:bg-destructive/20 rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="size-3 text-destructive" />
                      </button>
                      <OptimizedImage
                        src={comparisonImageUrl(listing)}
                        alt={`${listing.brand_name} ${listing.model_name}`}
                        width={128}
                        height={96}
                        sizes="64px"
                        className="w-16 h-12 rounded-lg object-cover cursor-pointer"
                        onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {listing.brand_name} {listing.model_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {listing.trim_name || 'تیپ پایه'} · {toPersianNumber(listing.production_year)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedIds.length < MAX_COMPARISON_ITEMS && (
                    <Button
                      variant="outline"
                      className="h-16 shrink-0 border-dashed"
                      onClick={() => setPickerOpen(true)}
                    >
                      <Plus className="size-4" />
                      افزودن خودرو
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {loadError ? (
              <Card className="py-0 border-destructive/40">
                <CardContent className="py-10 text-center">
                  <p className="text-destructive mb-4">{loadError}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    تلاش دوباره
                  </Button>
                </CardContent>
              </Card>
            ) : listings.length > 0 && (
              <Card className="py-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="font-semibold w-44 sticky right-0 bg-secondary z-10">
                          ویژگی
                        </TableHead>
                        {listings.map((listing) => (
                          <TableHead key={listing.id} className="text-center min-w-[190px]">
                            <div className="flex flex-col items-center gap-1 py-2">
                              <OptimizedImage
                                src={comparisonImageUrl(listing)}
                                alt={`${listing.brand_name} ${listing.model_name}`}
                                width={192}
                                height={128}
                                sizes="96px"
                                className="w-24 h-16 rounded-lg object-cover cursor-pointer"
                                onClick={() => navigateTo('vehicle-details', { vehicleId: listing.id })}
                              />
                              <span className="font-semibold text-sm">
                                {listing.brand_name} {listing.model_name}
                              </span>
                              {listing.is_inspected && (
                                <Badge className="bg-success text-white text-[10px]">کارشناسی شده</Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => {
                        const best = bestValue(category, listings);
                        return (
                          <TableRow key={category.key}>
                            <TableCell className="font-medium text-muted-foreground sticky right-0 bg-background z-10">
                              {category.label}
                            </TableCell>
                            {listings.map((listing) => {
                              const numericValue = category.getNumeric?.(listing) ?? null;
                              const isBest = best !== null && numericValue === best;
                              return (
                                <TableCell
                                  key={listing.id}
                                  className={`text-center ${isBest ? 'text-success font-semibold' : ''}`}
                                >
                                  <span className="inline-flex items-center justify-center gap-1">
                                    {category.getValue(listing)}
                                    {isBest && <Check className="size-3.5" />}
                                  </span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            <div className="flex justify-center mt-6">
              <Button variant="outline" className="text-destructive" onClick={clear}>
                <X className="size-4" />
                پاک‌کردن فهرست مقایسه
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>انتخاب خودرو برای مقایسه</DialogTitle>
            <DialogDescription>
              نتایج به‌صورت سریع و مرحله‌ای از میان آگهی‌های فعال دریافت می‌شوند.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی برند، مدل، تیپ یا شهر..."
              className="pr-10"
            />
          </div>

          <div className="overflow-y-auto min-h-0 -mx-1 px-1">
            {isLoadingCandidates ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                در حال دریافت آگهی‌ها...
              </div>
            ) : candidateError && candidates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-destructive mb-4">{candidateError}</p>
                {!searchTooShort && (
                  <Button variant="outline" onClick={() => setCandidateReloadVersion((version) => version + 1)}>
                    تلاش دوباره
                  </Button>
                )}
              </div>
            ) : candidates.length === 0 ? (
              <p className="py-16 text-center text-muted-foreground">آگهی مطابق جست‌وجو پیدا نشد.</p>
            ) : (
              <div className="space-y-2 py-1">
                {candidates.map((candidate) => {
                  const isSelected = selectedIdSet.has(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      className="flex items-center gap-3 rounded-xl border p-2.5"
                    >
                      <OptimizedImage
                        src={comparisonImageUrl(candidate)}
                        alt={`${candidate.brand_name} ${candidate.model_name}`}
                        width={160}
                        height={112}
                        sizes="80px"
                        className="w-20 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {candidate.brand_name} {candidate.model_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {candidate.trim_name || 'تیپ پایه'} · {toPersianNumber(candidate.production_year)} · {candidate.city}
                        </p>
                        <p className="text-xs font-medium text-brand mt-1">
                          {candidate.price === null ? 'تماس بگیرید' : formatPrice(candidate.price)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isSelected ? 'secondary' : 'outline'}
                        onClick={() => handleToggle(candidate.id)}
                      >
                        {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
                        {isSelected ? 'انتخاب شده' : 'افزودن'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {nextCursor && !isLoadingCandidates && (
            <Button
              variant="outline"
              onClick={() => void loadMoreCandidates()}
              disabled={isLoadingMore}
            >
              {isLoadingMore && <Loader2 className="size-4 animate-spin" />}
              نمایش آگهی‌های بیشتر
            </Button>
          )}
          {candidateError && candidates.length > 0 && (
            <p className="text-xs text-destructive text-center">{candidateError}</p>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
