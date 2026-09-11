const DEFAULT_MAX_INPUT_BYTES = 15 * 1024 * 1024;
const DEFAULT_TARGET_BYTES = 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_MAX_FILES = 10;
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export interface CompressedImage {
  id: string;
  file: File;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

export type CompressedListingImage = CompressedImage;

export interface ImageCompressionOptions {
  maxFiles?: number;
  maxInputBytes?: number;
  targetBytes?: number;
  maxDimension?: number;
  preserveTransparency?: boolean;
  fallbackName?: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`تصویر «${file.name}» قابل خواندن نیست.`));
    };
    image.src = objectUrl;
  });
}

function fitDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('مرورگر امکان فشرده‌سازی این تصویر را ندارد.'));
      },
      'image/webp',
      quality,
    );
  });
}

function webpFileName(fileName: string, fallbackName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, '') || fallbackName;
  return `${baseName}.webp`;
}

export async function compressListingImage(
  source: File,
  options: ImageCompressionOptions = {},
): Promise<CompressedListingImage> {
  const maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
  const targetBytes = options.targetBytes ?? DEFAULT_TARGET_BYTES;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const preserveTransparency = options.preserveTransparency ?? false;

  if (!SUPPORTED_IMAGE_TYPES.has(source.type)) {
    throw new Error('فقط تصاویر JPG، PNG و WebP قابل بارگذاری هستند.');
  }
  if (source.size > maxInputBytes) {
    throw new Error(
      `حجم اولیه تصویر «${source.name}» بیشتر از ${formatFileSize(maxInputBytes)} است.`,
    );
  }

  const image = await loadImage(source);
  let dimensions = fitDimensions(
    image.naturalWidth,
    image.naturalHeight,
    maxDimension,
  );
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: preserveTransparency });
  if (!context) throw new Error('امکان پردازش تصویر در مرورگر وجود ندارد.');

  let blob: Blob | null = null;
  let quality = 0.84;

  for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    if (!preserveTransparency) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    quality = 0.84;
    do {
      blob = await encodeWebp(canvas, quality);
      quality -= 0.07;
    } while (blob.size > targetBytes && quality >= 0.49);

    if (blob.size <= targetBytes || Math.max(canvas.width, canvas.height) <= 960) {
      break;
    }

    dimensions = {
      width: Math.max(1, Math.round(dimensions.width * 0.82)),
      height: Math.max(1, Math.round(dimensions.height * 0.82)),
    };
  }

  if (!blob) throw new Error('فشرده‌سازی تصویر انجام نشد.');

  const file = new File(
    [blob],
    webpFileName(source.name, options.fallbackName ?? 'image'),
    {
    type: 'image/webp',
    lastModified: Date.now(),
    },
  );

  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    originalBytes: source.size,
    compressedBytes: file.size,
    width: canvas.width,
    height: canvas.height,
  };
}

export const compressImage = compressListingImage;

export async function compressListingImages(
  files: File[],
  options: ImageCompressionOptions = {},
): Promise<CompressedListingImage[]> {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  if (files.length > maxFiles) {
    throw new Error(`حداکثر ${maxFiles.toLocaleString('fa-IR')} تصویر دیگر می‌توانید اضافه کنید.`);
  }

  const compressed: CompressedListingImage[] = [];
  try {
    // Sequential processing avoids a large memory spike on mobile devices.
    for (const file of files) {
      compressed.push(await compressListingImage(file, options));
    }
    return compressed;
  } catch (error) {
    compressed.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    throw error;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('fa-IR')} کیلوبایت`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('fa-IR', {
    maximumFractionDigits: 1,
  })} مگابایت`;
}
