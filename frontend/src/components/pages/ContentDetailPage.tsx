'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigation } from '@/stores/navigation';
import { contentDate, contentImageUrl, fetchArticle, fetchVideo, type Article, type EducationalVideo } from '@/lib/content-api';
import { toPersianNumber } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';

export function ContentDetailPage({ kind }: { kind: 'videos' | 'articles' }) {
  const { navigateTo, pageData } = useNavigation();
  const slug = kind === 'videos' ? pageData?.videoSlug : pageData?.articleSlug;
  const validSlug = typeof slug === 'string' && slug.length > 0;
  const [content, setContent] = useState<EducationalVideo | Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!validSlug || typeof slug !== 'string') return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      (kind === 'videos' ? fetchVideo(slug) : fetchArticle(slug)).then(
        (result) => { if (active) { setContent(result); setError(''); } },
        (reason) => { if (active) { setContent(null); setError(reason instanceof Error ? reason.message : 'محتوا یافت نشد.'); } },
      ).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [kind, slug, validSlug, retry]);

  const isVideo = kind === 'videos';
  const video = isVideo ? content as EducationalVideo | null : null;
  const article = !isVideo ? content as Article | null : null;

  return (
    <main className="min-h-screen bg-background py-8" dir="rtl">
      <div className="container mx-auto max-w-4xl px-4">
        <button type="button" onClick={() => navigateTo(isVideo ? 'videos' : 'blog')} className="mb-6 text-sm text-muted-foreground">بازگشت به {isVideo ? 'ویدیوها' : 'مجله خودرو'}</button>
        {!validSlug && <p className="py-10 text-sm text-destructive">آدرس محتوا نامعتبر است.</p>}
        {validSlug && loading && <p role="status" className="py-10">در حال دریافت محتوا...</p>}
        {validSlug && error && !loading && <div className="py-10 text-sm text-destructive">{error} <Button variant="outline" className="mr-2" onClick={() => setRetry((value) => value + 1)}>تلاش دوباره</Button></div>}
        {validSlug && content?.slug === slug && !loading && <article className="overflow-hidden rounded-2xl border bg-white p-5 md:p-8">
          <p className="mb-3 text-sm text-gold-dark">{content.category_label}</p>
          <h1 className="mb-4 text-2xl font-bold leading-10">{content.title}</h1>
          <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>{content.author}</span>
            <span>{contentDate(content.published_at)}</span>
            <span>{toPersianNumber(content.view_count)} بازدید</span>
            <span>{video?.duration || article?.read_time}</span>
          </div>
          {video?.video_url ? <video controls preload="metadata" poster={contentImageUrl(video.thumbnail_url)} src={contentImageUrl(video.video_url)} className="mb-6 aspect-video w-full rounded-xl bg-black" /> : null}
          {video && !video.video_url && <p className="mb-6 rounded-xl bg-muted p-4 text-sm">فایل این ویدیو در دسترس نیست.</p>}
          {article?.cover_image_url && <div className="relative mb-6 aspect-video overflow-hidden rounded-xl"><OptimizedImage src={contentImageUrl(article.cover_image_url)} alt={article.title} fill className="object-cover" /></div>}
          <p className="mb-6 text-sm leading-8 text-muted-foreground">{video?.description || article?.summary}</p>
          <div className="max-w-none leading-8 text-muted-foreground [&_h2]:my-5 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mr-5 [&_p]:mb-4 [&_ul]:list-disc" dir="rtl"><ReactMarkdown>{content.content || ''}</ReactMarkdown></div>
        </article>}
      </div>
    </main>
  );
}
