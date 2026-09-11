import Image, { type ImageProps } from 'next/image';

type OptimizedImageProps = Omit<ImageProps, 'width' | 'height'> & {
  width?: number;
  height?: number;
};

export function OptimizedImage({
  src,
  width = 1200,
  height = 800,
  fill = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  unoptimized,
  alt,
  ...props
}: OptimizedImageProps) {
  const dynamicSource = typeof src === 'string'
    && (src.startsWith('http://')
      || src.startsWith('https://')
      || src.startsWith('blob:'));

  return (
    <Image
      src={src}
      sizes={sizes}
      unoptimized={unoptimized ?? dynamicSource}
      alt={alt}
      {...(fill ? { fill: true } : { width, height })}
      {...props}
    />
  );
}
