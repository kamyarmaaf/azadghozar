'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Upload, Plus, X, Check, ChevronRight, ChevronLeft, Car, Settings, Shield, DollarSign, ImagePlus, Video, Play, Pause, Trash2, Film, Loader2 } from 'lucide-react';
import { brands, bodyTypes } from '@/lib/mock-data';
import { toPersianNumber } from '@/lib/utils';
import {
  compressListingImages,
  formatFileSize,
  type CompressedListingImage,
} from '@/lib/image-compression';
import { useNavigation } from '@/stores/navigation';
import { useAuth } from '@/stores/auth';
import { resolveMediaUrl } from '@/lib/api';
import {
  createVehicleListing,
  fetchVehicleListing,
  listingImageFileUrl,
  updateVehicleListing,
  type ListingImage,
  type VehicleListing,
} from '@/lib/listing-api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const steps = [
  { id: 1, title: 'اطلاعات عمومی', icon: Car, description: 'برند، مدل و سال ساخت' },
  { id: 2, title: 'مشخصات فنی', icon: Settings, description: 'موتور، گیربکس و سوخت' },
  { id: 3, title: 'وضعیت خودرو', icon: Shield, description: 'کارکرد و توضیحات' },
  { id: 4, title: 'قیمت، تصاویر و ویدیو', icon: DollarSign, description: 'قیمت، عکس، ویدیو و تماس' },
];

const plateTypes = [
  { value: 'free-zone', label: 'منطقه آزاد' },
  { value: 'temporary-import', label: 'واردات موقت' },
  { value: 'national', label: 'پلاک ملی' },
];

const carColors = [
  'سفید', 'مشکی', 'نقره‌ای', 'خاکستری', 'قرمز', 'آبی',
  'سبز', 'کرم', 'قهوه‌ای', 'طلایی', 'نارنجی', 'بنفش',
];

const transmissionOptions = ['اتوماتیک', 'دستی', 'سی‌وی‌تی', 'دوکلاچه'];
const fuelOptions = ['بنزینی', 'دیزلی', 'هیبریدی', 'برقی', 'هیبریدی پلاگین'];
const drivetrainOptions = ['جلو', 'عقب', 'دو دیفرانسیل', 'چهار چرخ متحرک'];
const conditionOptions = ['آکبند', 'در حد نو', 'کارکرده تمیز', 'سالم', 'نیاز به تعمیر'];
const bodyConditionOptions = ['بدون رنگ', 'یک لکه رنگ', 'چند لکه رنگ', 'دور رنگ', 'تمام رنگ', 'تصادفی'];
const chassisConditionOptions = ['سالم و پلمپ', 'ضربه جزئی', 'آسیب‌دیده'];
const engineConditionOptions = ['سالم', 'نیاز به سرویس', 'تعویض شده', 'نیاز به تعمیر'];
const ownershipOptions = ['سند به نام فروشنده', 'سند آماده انتقال', 'وکالتی', 'در رهن یا لیزینگ'];
const priceTypeOptions = [
  { value: 'fixed', label: 'قیمت قطعی' },
  { value: 'negotiable', label: 'قابل مذاکره' },
  { value: 'contact', label: 'تماس بگیرید' },
];
const contactPreferenceOptions = [
  { value: 'both', label: 'تماس و پیام در آزادگذر' },
  { value: 'phone', label: 'فقط تماس تلفنی' },
  { value: 'chat', label: 'فقط پیام در آزادگذر' },
];

const transmissionLabels: Record<string, string> = {
  manual: 'دستی', automatic: 'اتوماتیک', cvt: 'سی‌وی‌تی', dct: 'دوکلاچه',
};
const fuelLabels: Record<string, string> = {
  gasoline: 'بنزینی', diesel: 'دیزلی', hybrid: 'هیبریدی',
  electric: 'برقی', phev: 'هیبریدی پلاگین',
};
const drivetrainLabels: Record<string, string> = {
  fwd: 'جلو', rwd: 'عقب', '4wd': 'دو دیفرانسیل', awd: 'چهار چرخ متحرک',
};
const conditionLabels: Record<string, string> = {
  new: 'آکبند', like_new: 'در حد نو', clean_used: 'کارکرده تمیز',
  good: 'سالم', needs_repair: 'نیاز به تعمیر',
};
const bodyConditionLabels: Record<string, string> = {
  no_paint: 'بدون رنگ', one_spot: 'یک لکه رنگ', multiple_spots: 'چند لکه رنگ',
  around_paint: 'دور رنگ', full_paint: 'تمام رنگ', accident: 'تصادفی',
};
const chassisConditionLabels: Record<string, string> = {
  sealed: 'سالم و پلمپ', minor_damage: 'ضربه جزئی', damaged: 'آسیب‌دیده',
};
const engineConditionLabels: Record<string, string> = {
  healthy: 'سالم', needs_service: 'نیاز به سرویس', replaced: 'تعویض شده',
  needs_repair: 'نیاز به تعمیر',
};
const ownershipLabels: Record<string, string> = {
  owner: 'سند به نام فروشنده', ready: 'سند آماده انتقال',
  power_of_attorney: 'وکالتی', financed: 'در رهن یا لیزینگ',
};
const plateTypeLabels: Record<string, string> = {
  free_zone: 'free-zone', temporary_import: 'temporary-import', national: 'national',
};

const yearOptions = Array.from({ length: 25 }, (_, i) => toPersianNumber(new Date().getFullYear() - i));

const toAsciiDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const digitsOnly = (value: string) => toAsciiDigits(value).replace(/\D/g, '');

const isValidContactNumber = (value: string) => {
  const digits = digitsOnly(value);
  return /^(?:98|0)?9\d{9}$/.test(digits) || /^0\d{9,10}$/.test(digits);
};

interface FormData {
  brand: string;
  model: string;
  trim: string;
  year: string;
  plateType: string;
  freeZone: string;
  province: string;
  city: string;
  color: string;
  bodyType: string;
  engine: string;
  transmission: string;
  fuelType: string;
  drivetrain: string;
  mileage: string;
  condition: string;
  bodyCondition: string;
  chassisCondition: string;
  engineCondition: string;
  insuranceMonths: string;
  ownershipStatus: string;
  description: string;
  price: string;
  priceType: string;
  tradePossible: string;
  contactNumber: string;
  contactPreference: string;
}

const initialForm: FormData = {
  brand: '', model: '', trim: '', year: '', plateType: '', freeZone: '', province: '', city: '', color: '', bodyType: '',
  engine: '', transmission: '', fuelType: '', drivetrain: '',
  mileage: '', condition: '', bodyCondition: '', chassisCondition: '', engineCondition: '',
  insuranceMonths: '', ownershipStatus: '', description: '', price: '', priceType: 'negotiable',
  tradePossible: 'no', contactNumber: '', contactPreference: 'both',
};

function listingToForm(listing: VehicleListing): FormData {
  return {
    brand: listing.brand_name,
    model: listing.model_name,
    trim: listing.trim_name,
    year: toPersianNumber(listing.production_year),
    plateType: plateTypeLabels[listing.plate_type] || listing.plate_type,
    freeZone: listing.free_zone,
    province: listing.province,
    city: listing.city,
    color: listing.color,
    bodyType: listing.body_type,
    engine: listing.engine_description,
    transmission: transmissionLabels[listing.transmission] || listing.transmission,
    fuelType: fuelLabels[listing.fuel_type] || listing.fuel_type,
    drivetrain: drivetrainLabels[listing.drivetrain] || listing.drivetrain,
    mileage: toPersianNumber(listing.mileage),
    condition: conditionLabels[listing.condition] || listing.condition_label,
    bodyCondition: bodyConditionLabels[listing.body_condition] || listing.body_condition_label,
    chassisCondition: chassisConditionLabels[listing.chassis_condition] || listing.chassis_condition_label,
    engineCondition: engineConditionLabels[listing.engine_condition] || listing.engine_condition_label,
    insuranceMonths: listing.insurance_months === null ? '' : String(listing.insurance_months),
    ownershipStatus: ownershipLabels[listing.ownership_status] || listing.ownership_status_label,
    description: listing.description,
    price: listing.price === null ? '' : toPersianNumber(listing.price.toLocaleString('en-US')),
    priceType: listing.price_type,
    tradePossible: listing.trade_possible ? 'yes' : 'no',
    contactNumber: listing.contact_number,
    contactPreference: listing.contact_preference,
  };
}

export function SellPage() {
  const { navigateTo, pageData } = useNavigation();
  const currentUser = useAuth((state) => state.currentUser);
  const requestedListingId = Number(pageData?.vehicleId);
  const editListingId = Number.isInteger(requestedListingId) && requestedListingId > 0
    ? requestedListingId
    : null;
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const effectiveContactNumber = form.contactNumber || currentUser?.phoneNumber || '';
  const [uploadedImages, setUploadedImages] = useState<CompressedListingImage[]>([]);
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const uploadedImagesRef = useRef<CompressedListingImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [imageError, setImageError] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedListingId, setSubmittedListingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [listingLoadError, setListingLoadError] = useState('');
  const totalImageCount = existingImages.length + uploadedImages.length;
  const missingFinalRequirements = [
    !form.priceType || (form.priceType !== 'contact' && !digitsOnly(form.price))
      ? 'قیمت خودرو'
      : null,
    !isValidContactNumber(effectiveContactNumber) ? 'شماره تماس معتبر' : null,
    !form.contactPreference ? 'روش تماس' : null,
    totalImageCount < 5 ? `${toPersianNumber(5 - totalImageCount)} تصویر دیگر` : null,
  ].filter((item): item is string => Boolean(item));

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => () => {
    uploadedImagesRef.current.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setUploadedImages((images) => {
        images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return [];
      });
      setVideoPreview((preview) => {
        if (preview) URL.revokeObjectURL(preview);
        return null;
      });
      setVideoFile(null);
      setVideoDuration('');
      setSubmitted(false);
      setSubmittedListingId(null);
      setSubmitError('');
      setCurrentStep(1);

      if (!editListingId) {
        setForm(initialForm);
        setExistingImages([]);
        setExistingVideoUrl(null);
        setRemoveExistingVideo(false);
        setListingLoadError('');
        return;
      }

      setIsLoadingListing(true);
      setListingLoadError('');
      fetchVehicleListing(editListingId)
        .then((listing) => {
          if (cancelled) return;
          setForm(listingToForm(listing));
          setExistingImages(listing.image_files);
          setExistingVideoUrl(resolveMediaUrl(listing.video) || null);
          setRemoveExistingVideo(false);
        })
        .catch((error) => {
          if (cancelled) return;
          setListingLoadError(
            error instanceof Error ? error.message : 'دریافت اطلاعات آگهی انجام نشد.',
          );
        })
        .finally(() => {
          if (!cancelled) setIsLoadingListing(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editListingId]);

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return Boolean(
          form.brand && form.model.trim() && form.year && form.plateType
          && form.province.trim() && form.city.trim() && form.color && form.bodyType
          && (form.plateType !== 'free-zone' || form.freeZone.trim()),
        );
      case 2:
        return Boolean(form.transmission && form.fuelType && form.drivetrain);
      case 3:
        return Boolean(
          form.mileage.trim() && form.condition && form.bodyCondition
          && form.chassisCondition && form.engineCondition && form.ownershipStatus,
        );
      case 4:
        return Boolean(
          form.priceType && (form.priceType === 'contact' || digitsOnly(form.price).length > 0)
          && isValidContactNumber(effectiveContactNumber) && form.contactPreference
          && totalImageCount >= 5,
        );
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      setSubmitError('برای ثبت آگهی ابتدا وارد حساب کاربری شوید.');
      return;
    }
    if (!['seller', 'gallery', 'agency'].includes(currentUser.role)) {
      setSubmitError('ثبت آگهی فقط برای فروشنده، نمایشگاه و نمایندگی فعال است. ابتدا نقش حساب را تغییر دهید.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const input = {
        ...form,
        contactNumber: effectiveContactNumber,
        images: uploadedImages,
        video: videoFile,
      };
      const listing = editListingId
        ? await updateVehicleListing(editListingId, {
          ...input,
          retainedImageIds: existingImages.map((image) => image.id),
          removeVideo: removeExistingVideo,
        })
        : await createVehicleListing(input);
      setSubmittedListingId(listing.id);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'ثبت آگهی انجام نشد. دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImages = async (files: File[]) => {
    const remainingSlots = 10 - totalImageCount;
    if (remainingSlots <= 0) {
      setImageError('حداکثر ۱۰ تصویر می‌توانید اضافه کنید.');
      return;
    }
    setIsCompressingImages(true);
    setImageError('');
    try {
      const compressed = await compressListingImages(files, {
        maxFiles: remainingSlots,
        maxDimension: 1920,
        targetBytes: 1024 * 1024,
      });
      setUploadedImages((previous) => [...previous, ...compressed]);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'خطا در پردازش تصاویر');
    } finally {
      setIsCompressingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await addImages(files);
  };

  const removeImage = (index: number) => {
    setUploadedImages((previous) => {
      const image = previous[index];
      if (image) URL.revokeObjectURL(image.previewUrl);
      return previous.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages((images) => images.filter((image) => image.id !== imageId));
  };

  const handleVideoUpload = (file: File) => {
    if (!file.type.startsWith('video/')) return;
    if (file.size > 200 * 1024 * 1024) return; // 200MB limit
    setIsVideoUploading(true);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const dur = video.duration;
      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60);
      setVideoDuration(`${toPersianNumber(mins.toString().padStart(2, '0'))}:${toPersianNumber(secs.toString().padStart(2, '0'))}`);
      const previewUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreview(previewUrl);
      setRemoveExistingVideo(false);
      setIsVideoUploading(false);
    };
    video.src = url;
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/') && !videoFile && !existingVideoUrl) {
      handleVideoUpload(file);
    }
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (existingVideoUrl) {
      setExistingVideoUrl(null);
      setRemoveExistingVideo(true);
    }
    setVideoDuration('');
  };

  if (isLoadingListing) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          در حال دریافت اطلاعات آگهی...
        </div>
      </main>
    );
  }

  if (listingLoadError) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center space-y-4">
            <p role="alert" className="text-sm text-red-700">{listingLoadError}</p>
            <Button variant="outline" onClick={() => navigateTo(currentUser?.dashboardPage || 'seller-dashboard')}>
              بازگشت به داشبورد
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="size-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {editListingId ? 'تغییرات آگهی ذخیره شد' : 'آگهی شما با موفقیت ثبت شد'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {editListingId
              ? 'آگهی ویرایش‌شده دوباره در صف بررسی قرار گرفت و پس از تایید منتشر می‌شود.'
              : 'آگهی شما پس از بررسی و تایید توسط تیم آزاد گذر منتشر خواهد شد. معمولا بررسی در کمتر از ۲ ساعت انجام می‌شود.'}
          </p>
          {submittedListingId && (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm mb-6">
              کد پیگیری آگهی: <strong>{toPersianNumber(submittedListingId)}</strong>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigateTo('home')}>بازگشت به خانه</Button>
            <Button variant="outline" onClick={() => navigateTo(currentUser?.dashboardPage || 'buyer-dashboard')}>داشبورد من</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{editListingId ? 'ویرایش آگهی خودرو' : 'ثبت آگهی خودرو'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold mb-2">
          {editListingId ? 'ویرایش آگهی خودرو' : 'ثبت آگهی خودرو'}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {editListingId
            ? 'اطلاعات را اصلاح کنید؛ پس از ذخیره، آگهی دوباره بررسی خواهد شد.'
            : 'اطلاعات خودروی خود را وارد کنید تا آگهی شما ثبت شود'}
        </p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted ? 'bg-success text-white' :
                      isActive ? 'bg-brand text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </div>
                    <span className={`text-xs font-medium text-center hidden sm:block ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-6 sm:mb-5 transition-colors ${
                      isCompleted ? 'bg-success' : 'bg-border'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">مرحله {toPersianNumber(currentStep)} از {toPersianNumber(steps.length)}</span>
            <span className="text-xs text-muted-foreground">{steps[currentStep - 1].description}</span>
          </div>
        </div>

        {/* Step Content */}
        <Card className="py-0">
          <CardContent className="p-6 space-y-6">
            {/* Step 1: General Info */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-semibold mb-1">اطلاعات عمومی</h2>
                  <p className="text-sm text-muted-foreground">مشخصات اصلی خودروی خود را وارد کنید</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>برند خودرو <span className="text-destructive">*</span></Label>
                    <Select value={form.brand} onValueChange={(v) => updateForm('brand', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب برند" /></SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>مدل خودرو <span className="text-destructive">*</span></Label>
                    <Input placeholder="مثلا: کلاس E" value={form.model} onChange={(e) => updateForm('model', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>تیپ یا نسخه</Label>
                    <Input placeholder="مثلا: E 200 یا XSE" value={form.trim} onChange={(e) => updateForm('trim', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>سال ساخت <span className="text-destructive">*</span></Label>
                    <Select value={form.year} onValueChange={(v) => updateForm('year', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب سال" /></SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع پلاک <span className="text-destructive">*</span></Label>
                    <Select value={form.plateType} onValueChange={(v) => updateForm('plateType', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب نوع پلاک" /></SelectTrigger>
                      <SelectContent>
                        {plateTypes.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.plateType === 'free-zone' && (
                    <div className="space-y-2">
                      <Label>نام منطقه آزاد <span className="text-destructive">*</span></Label>
                      <Input placeholder="مثلا: کیش، قشم یا اروند" value={form.freeZone} onChange={(e) => updateForm('freeZone', e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>استان محل خودرو <span className="text-destructive">*</span></Label>
                    <Input placeholder="مثلا: هرمزگان" value={form.province} onChange={(e) => updateForm('province', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>شهر محل خودرو <span className="text-destructive">*</span></Label>
                    <Input placeholder="مثلا: بندرعباس" value={form.city} onChange={(e) => updateForm('city', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>رنگ خودرو <span className="text-destructive">*</span></Label>
                    <Select value={form.color} onValueChange={(v) => updateForm('color', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب رنگ" /></SelectTrigger>
                      <SelectContent>
                        {carColors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع بدنه <span className="text-destructive">*</span></Label>
                    <Select value={form.bodyType} onValueChange={(v) => updateForm('bodyType', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب نوع بدنه" /></SelectTrigger>
                      <SelectContent>
                        {bodyTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Technical Specs */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-semibold mb-1">مشخصات فنی</h2>
                  <p className="text-sm text-muted-foreground">اطلاعات فنی موتور و گیربکس خودرو</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>حجم موتور</Label>
                    <Input placeholder="مثلا: ۲۰۰۰ سی‌سی توربو" value={form.engine} onChange={(e) => updateForm('engine', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>گیربکس <span className="text-destructive">*</span></Label>
                    <Select value={form.transmission} onValueChange={(v) => updateForm('transmission', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب گیربکس" /></SelectTrigger>
                      <SelectContent>
                        {transmissionOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع سوخت <span className="text-destructive">*</span></Label>
                    <Select value={form.fuelType} onValueChange={(v) => updateForm('fuelType', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب سوخت" /></SelectTrigger>
                      <SelectContent>
                        {fuelOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>سیستم انتقال قدرت <span className="text-destructive">*</span></Label>
                    <Select value={form.drivetrain} onValueChange={(v) => updateForm('drivetrain', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب سیستم" /></SelectTrigger>
                      <SelectContent>
                        {drivetrainOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Condition */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-semibold mb-1">وضعیت خودرو</h2>
                  <p className="text-sm text-muted-foreground">کارکرد و وضعیت فعلی خودرو را مشخص کنید</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>کارکرد (کیلومتر) <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="مثلا: ۱۵۰۰۰"
                      value={form.mileage}
                      onChange={(e) => updateForm('mileage', e.target.value.replace(/[^0-9۰-۹٠-٩]/g, ''))}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت خودرو <span className="text-destructive">*</span></Label>
                    <Select value={form.condition} onValueChange={(v) => updateForm('condition', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب وضعیت" /></SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت بدنه و رنگ <span className="text-destructive">*</span></Label>
                    <Select value={form.bodyCondition} onValueChange={(v) => updateForm('bodyCondition', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب وضعیت بدنه" /></SelectTrigger>
                      <SelectContent>
                        {bodyConditionOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت شاسی <span className="text-destructive">*</span></Label>
                    <Select value={form.chassisCondition} onValueChange={(v) => updateForm('chassisCondition', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب وضعیت شاسی" /></SelectTrigger>
                      <SelectContent>
                        {chassisConditionOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت موتور <span className="text-destructive">*</span></Label>
                    <Select value={form.engineCondition} onValueChange={(v) => updateForm('engineCondition', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب وضعیت موتور" /></SelectTrigger>
                      <SelectContent>
                        {engineConditionOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>وضعیت سند <span className="text-destructive">*</span></Label>
                    <Select value={form.ownershipStatus} onValueChange={(v) => updateForm('ownershipStatus', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب وضعیت سند" /></SelectTrigger>
                      <SelectContent>
                        {ownershipOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>بیمه شخص ثالث باقی‌مانده</Label>
                    <Select value={form.insuranceMonths} onValueChange={(v) => updateForm('insuranceMonths', v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="انتخاب تعداد ماه" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 13 }, (_, months) => (
                          <SelectItem key={months} value={String(months)}>
                            {months === 0 ? 'فاقد بیمه معتبر' : `${toPersianNumber(months)} ماه`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>توضیحات تکمیلی</Label>
                  <Textarea
                    placeholder="توضیحات کامل وضعیت خودرو، آپشن‌ها، سابقه تصادف، سرویس‌های انجام شده و هر اطلاعات مفید دیگر را بنویسید..."
                    className="min-h-32"
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">توضیحات دقیق‌تر باعث فروش سریع‌تر خودرو می‌شود</p>
                </div>
              </div>
            )}

            {/* Step 4: Price, Images & Video */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-fade-in-up">
                <div>
                  <h2 className="text-lg font-semibold mb-1">قیمت، تصاویر و ویدیو</h2>
                  <p className="text-sm text-muted-foreground">قیمت، تصاویر و ویدیوی خودرو را مشخص کنید</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نحوه اعلام قیمت <span className="text-destructive">*</span></Label>
                    <Select value={form.priceType} onValueChange={(v) => updateForm('priceType', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priceTypeOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.priceType !== 'contact' && (
                    <div className="space-y-2">
                      <Label>قیمت (تومان) <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="مثلا: ۱۲,۵۰۰,۰۰۰,۰۰۰"
                        value={form.price}
                        onChange={(e) => updateForm('price', e.target.value.replace(/[^0-9۰-۹٠-٩,٬]/g, ''))}
                        inputMode="numeric"
                      />
                      <p className="text-xs text-muted-foreground">قیمت را به تومان وارد کنید</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>امکان معاوضه</Label>
                    <Select value={form.tradePossible} onValueChange={(v) => updateForm('tradePossible', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">ندارد</SelectItem>
                        <SelectItem value="yes">دارد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>روش تماس ترجیحی <span className="text-destructive">*</span></Label>
                    <Select value={form.contactPreference} onValueChange={(v) => updateForm('contactPreference', v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {contactPreferenceOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>شماره تماس <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="مثلا: ۰۹۱۲۱۲۳۴۵۶۷"
                      value={effectiveContactNumber}
                      onChange={(e) => updateForm('contactNumber', e.target.value)}
                      dir="ltr"
                      inputMode="tel"
                    />
                    {effectiveContactNumber && !isValidContactNumber(effectiveContactNumber) && (
                      <p className="text-xs text-destructive">شماره تماس معتبر وارد کنید.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تصاویر خودرو <span className="text-destructive">*</span></Label>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-gold hover:bg-gold/5 transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {isCompressingImages ? (
                      <>
                        <Upload className="size-12 mx-auto text-gold mb-3 animate-pulse" />
                        <p className="font-medium text-sm mb-1">در حال فشرده‌سازی تصاویر...</p>
                        <p className="text-xs text-muted-foreground">این کار روی دستگاه شما انجام می‌شود</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-12 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="font-medium text-sm mb-1">تصاویر را اینجا بکشید و رها کنید</p>
                        <p className="text-xs text-muted-foreground mb-3">یا کلیک کنید تا فایل انتخاب شود</p>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {toPersianNumber(totalImageCount)} از ۱۰ تصویر
                          </Badge>
                          <Badge variant="outline">WebP، حداکثر حدود ۱ مگابایت</Badge>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(event) => {
                      void addImages(Array.from(event.target.files || []));
                    }}
                  />
                  {imageError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {imageError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    حداقل ۵ تصویر لازم است؛ اکنون {toPersianNumber(totalImageCount)} تصویر دارید. تصاویر جدید به WebP تبدیل و ابعاد آن‌ها حداکثر ۱۹۲۰ پیکسل می‌شود.
                  </p>
                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                      {existingImages.map((image, idx) => (
                        <div key={image.id} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <OptimizedImage src={listingImageFileUrl(image)} alt={`تصویر فعلی خودرو ${toPersianNumber(idx + 1)}`} fill sizes="(max-width: 640px) 33vw, 20vw" className="object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id)}
                            aria-label="حذف تصویر فعلی"
                            className="absolute -top-2 -left-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            <X className="size-3 text-white" />
                          </button>
                          {idx === 0 && (
                            <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0">تصویر اصلی</Badge>
                          )}
                          <Badge variant="secondary" className="absolute bottom-1 left-1 text-[9px] px-1 py-0">
                            {formatFileSize(image.file_size)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                      {uploadedImages.map((image, idx) => (
                        <div key={image.id} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <OptimizedImage src={image.previewUrl} alt={`تصویر خودرو ${toPersianNumber(idx + 1)}`} fill sizes="(max-width: 640px) 33vw, 20vw" className="object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            aria-label="حذف تصویر جدید"
                            className="absolute -top-2 -left-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            <X className="size-3 text-white" />
                          </button>
                          {existingImages.length === 0 && idx === 0 && (
                            <Badge className="absolute bottom-1 right-1 text-[10px] px-1 py-0">تصویر اصلی</Badge>
                          )}
                          <Badge variant="secondary" className="absolute bottom-1 left-1 text-[9px] px-1 py-0">
                            {formatFileSize(image.compressedBytes)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Video Upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>ویدیوی خودرو</Label>
                    <Badge variant="secondary" className="text-[10px]">اختیاری</Badge>
                  </div>
                  {!videoPreview && !existingVideoUrl && !isVideoUploading && (
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-gold hover:bg-gold/5 transition-colors cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleVideoDrop}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'video/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleVideoUpload(file);
                        };
                        input.click();
                      }}
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Video className="size-7 text-primary" />
                      </div>
                      <p className="font-medium text-sm mb-1">ویدیوی معرفی خودرو را آپلود کنید</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        ویدیو را بکشید و رها کنید یا کلیک کنید تا فایل انتخاب شود
                      </p>
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          <Film className="size-3 ml-1" />
                          حداکثر ۲۰۰ مگابایت
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          MP4, WebM, MOV
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          <Video className="size-3 ml-1" />
                          ۱ ویدیو
                        </Badge>
                      </div>
                    </div>
                  )}
                  {isVideoUploading && (
                    <div className="border-2 border-dashed border-gold/50 rounded-xl p-8 text-center bg-gold/5">
                      <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                        <Film className="size-7 text-gold animate-pulse" />
                      </div>
                      <p className="font-medium text-sm">در حال پردازش ویدیو...</p>
                      <p className="text-xs text-muted-foreground mt-1">لطفا صبر کنید</p>
                    </div>
                  )}
                  {(videoPreview || existingVideoUrl) && !isVideoUploading && (
                    <div className="relative rounded-xl overflow-hidden border bg-black/5">
                      <div className="aspect-video">
                        <video
                          src={videoPreview || existingVideoUrl || undefined}
                          className="w-full h-full object-contain bg-black"
                          controls
                          preload="metadata"
                        />
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {videoDuration && (
                          <Badge className="bg-black/70 text-white hover:bg-black/70 border-0 backdrop-blur-sm">
                            <Video className="size-3 ml-1" />
                            {videoDuration}
                          </Badge>
                        )}
                        {videoFile && (
                          <Badge className="bg-black/70 text-white hover:bg-black/70 border-0 backdrop-blur-sm">
                            {(videoFile.size / (1024 * 1024)).toFixed(1)} مگابایت
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        aria-label="حذف ویدیو"
                        className="absolute top-3 left-3 w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="size-4 text-white" />
                      </button>
                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Play className="size-4 text-primary" />
                          <span className="font-medium">{videoFile?.name || 'ویدیوی فعلی آگهی'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {videoFile ? 'ویدیو با موفقیت بارگذاری شد' : 'ویدیوی فعلی'}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    آگهی‌هایی با ویدیو، تا ۴۰٪ بیشتر دیده می‌شوند
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <Separator className="mt-2" />
            {submitError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}
            {currentStep === 4 && missingFinalRequirements.length > 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-800">
                برای فعال‌شدن دکمه، این موارد را کامل کنید: {missingFinalRequirements.join('، ')}.
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ChevronRight className="size-4" />
                مرحله قبل
              </Button>
              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  disabled={!canGoNext()}
                >
                  مرحله بعد
                  <ChevronLeft className="size-4" />
                </Button>
              ) : (
                <Button onClick={() => void handleSubmit()} disabled={!canGoNext() || isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {isSubmitting
                    ? 'در حال ذخیره...'
                    : editListingId ? 'ذخیره تغییرات' : 'ثبت آگهی'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
