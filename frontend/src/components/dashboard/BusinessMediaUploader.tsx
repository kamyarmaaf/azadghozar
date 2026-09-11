'use client';

import { useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, Loader2, Upload } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/image-compression';
import { useAuth } from '@/stores/auth';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';

interface BusinessMediaUploaderProps {
  kind: 'logo' | 'cover';
}

const mediaOptions = {
  logo: {
    title: 'لوگوی نمایشگاه',
    help: 'خروجی WebP، حداکثر ۳۰۰ کیلوبایت و ضلع ۸۰۰ پیکسل',
    maxInputBytes: 5 * 1024 * 1024,
    targetBytes: 300 * 1024,
    maxDimension: 800,
    preserveTransparency: true,
  },
  cover: {
    title: 'تصویر کاور',
    help: 'خروجی WebP، حداکثر ۷۰۰ کیلوبایت و ضلع ۱۹۲۰ پیکسل',
    maxInputBytes: 10 * 1024 * 1024,
    targetBytes: 700 * 1024,
    maxDimension: 1920,
    preserveTransparency: false,
  },
} as const;

export function BusinessMediaUploader({ kind }: BusinessMediaUploaderProps) {
  const config = mediaOptions[kind];
  const currentUser = useAuth((state) => state.currentUser);
  const updateBusinessImages = useAuth((state) => state.updateBusinessImages);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUrl = kind === 'logo' ? currentUser?.businessLogo : currentUser?.businessCover;
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const displayedPreviewUrl = previewUrl || currentUrl || '';

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setMessage('در حال فشرده‌سازی تصویر...');
    let localPreview = '';
    try {
      const compressed = await compressImage(file, {
        maxInputBytes: config.maxInputBytes,
        targetBytes: config.targetBytes,
        maxDimension: config.maxDimension,
        preserveTransparency: config.preserveTransparency,
        fallbackName: `business-${kind}`,
      });
      localPreview = compressed.previewUrl;
      setPreviewUrl(localPreview);
      setMessage(`فشرده شد: ${formatFileSize(compressed.originalBytes)} ← ${formatFileSize(compressed.compressedBytes)}`);
      const user = await updateBusinessImages(
        kind === 'logo'
          ? { businessLogo: compressed.file }
          : { businessCover: compressed.file },
      );
      const savedUrl = kind === 'logo' ? user.businessLogo : user.businessCover;
      setPreviewUrl(savedUrl);
      setMessage(`با موفقیت ذخیره شد · ${formatFileSize(compressed.compressedBytes)}`);
    } catch (uploadError) {
      setPreviewUrl(currentUrl || '');
      setMessage('');
      setError(uploadError instanceof Error ? uploadError.message : 'بارگذاری تصویر انجام نشد.');
    } finally {
      if (localPreview) URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = '';
      setIsUploading(false);
    }
  };

  const Icon = kind === 'logo' ? Upload : Camera;
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className={`relative w-full overflow-hidden border-2 border-dashed border-input hover:border-gold-dark transition-colors ${kind === 'logo' ? 'min-h-52 rounded-xl' : 'aspect-[3/1] min-h-40 rounded-xl'}`}
      >
        {displayedPreviewUrl ? (
          <>
            <OptimizedImage src={displayedPreviewUrl} alt={config.title} width={kind === 'logo' ? 800 : 1600} height={kind === 'logo' ? 800 : 540} className={`w-full h-full ${kind === 'logo' ? 'object-contain p-4' : 'absolute inset-0 object-cover'}`} />
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 hover:opacity-100 transition-opacity"><ImagePlus className="size-5 ml-2" />تغییر تصویر</span>
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <span className={`${kind === 'logo' ? 'rounded-full' : 'rounded-xl'} w-16 h-16 bg-muted flex items-center justify-center`}><Icon className="size-6 text-muted-foreground" /></span>
            <span className="text-sm text-muted-foreground">{config.title} را انتخاب کنید</span>
          </span>
        )}
        {isUploading && <span className="absolute inset-0 flex flex-col items-center justify-center bg-background/85"><Loader2 className="size-8 animate-spin text-gold-dark mb-2" /><span className="text-sm">در حال بهینه‌سازی و آپلود...</span></span>}
      </button>
      <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectFile(event.target.files?.[0])} />
      <p className="text-xs text-muted-foreground">{config.help}</p>
      {message && <p className="flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="size-4" />{message}</p>}
      {error && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <Button type="button" variant="outline" size="sm" className="w-full" disabled={isUploading} onClick={() => inputRef.current?.click()}>{displayedPreviewUrl ? 'جایگزینی تصویر' : 'انتخاب تصویر'}</Button>
    </div>
  );
}
