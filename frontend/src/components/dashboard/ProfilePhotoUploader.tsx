'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { compressImage, formatFileSize } from '@/lib/image-compression';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function ProfilePhotoUploader() {
  const currentUser = useAuth((state) => state.currentUser);
  const updateProfilePhoto = useAuth((state) => state.updateProfilePhoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canUseProfilePhoto = currentUser?.role === 'buyer' || currentUser?.role === 'seller';

  async function selectFile(file?: File) {
    if (!file || busy || !canUseProfilePhoto) return;
    setBusy(true);
    setMessage('در حال فشرده‌سازی تصویر...');
    setError('');
    let objectUrl = '';
    try {
      const result = await compressImage(file, {
        maxInputBytes: 5 * 1024 * 1024,
        targetBytes: 250 * 1024,
        maxDimension: 512,
        fallbackName: 'profile-photo',
      });
      objectUrl = result.previewUrl;
      setPreview(objectUrl);
      setMessage('در حال ذخیرهٔ تصویر...');
      await updateProfilePhoto(result.file);
      setMessage(`عکس پروفایل ذخیره شد · ${formatFileSize(result.originalBytes)} ← ${formatFileSize(result.compressedBytes)}`);
    } catch (reason) {
      setMessage('');
      setError(reason instanceof Error ? reason.message : 'ذخیرهٔ عکس پروفایل انجام نشد.');
    } finally {
      setPreview('');
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = '';
      setBusy(false);
    }
  }

  if (!canUseProfilePhoto) return null;

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl border p-4" aria-label="عکس پروفایل شخصی">
      <Avatar className="size-20 border">
        {(preview || currentUser?.profilePhoto) && <AvatarImage src={preview || currentUser?.profilePhoto} alt="عکس پروفایل شخصی" className="object-cover" />}
        <AvatarFallback className="bg-brand text-white text-xl font-bold">{currentUser?.avatar || 'ک'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium">عکس پروفایل شخصی</p>
        <p className="text-xs text-muted-foreground">تصاویر JPG، PNG یا WebP تا ۵ مگابایت؛ خروجی WebP حداکثر ۵۱۲ پیکسل و ۲۵۰ کیلوبایت.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="انتخاب عکس پروفایل" onChange={(event) => void selectFile(event.target.files?.[0])} disabled={busy} />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {busy ? 'در حال بارگذاری...' : currentUser?.profilePhoto ? 'تغییر عکس' : 'انتخاب عکس'}
        </Button>
        {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      </div>
    </section>
  );
}
