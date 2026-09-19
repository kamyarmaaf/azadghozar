'use client';

import { isValidElement, useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, Eye, List, Loader2, Play, Share2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Separator } from '@/components/ui/separator';
import { fetchEducationalVideo, fetchEducationalVideos, type EducationalVideo } from '@/lib/video-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

const categoryColors: Record<string, string> = {
  rules: 'bg-red-100 text-red-700 border-red-200',
  education: 'bg-blue-100 text-blue-700 border-blue-200',
  comparison: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  guide: 'bg-amber-100 text-amber-700 border-amber-200',
  review: 'bg-violet-100 text-violet-700 border-violet-200',
};

function parseBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    : part);
}

function renderMarkdown(text: string) {
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(<ul key={`list-${elements.length}`} className="mb-4 list-inside list-disc space-y-1 text-muted-foreground">{listItems}</ul>);
    listItems = [];
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={elements.length} className="mb-4 mt-8 text-lg font-bold">{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      listItems.push(<li key={listItems.length} className="leading-7">{parseBold(line.slice(2))}</li>);
    } else {
      flushList();
      elements.push(<p key={elements.length} className="mb-4 leading-8 text-muted-foreground">{parseBold(line)}</p>);
    }
  }
  flushList();
  return elements.filter(isValidElement);
}

function formatPublishedDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

export function VideoDetailPage() {
  const { navigateTo, pageData, goBack } = useNavigation();
  const videoSlug = typeof pageData?.videoId === 'string' ? pageData.videoId : '';
  const [video, setVideo] = useState<EducationalVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<EducationalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLabel, setShareLabel] = useState('اشتراک‌گذاری');

  useEffect(() => {
    const controller = new AbortController();
    if (!videoSlug) {
      return () => controller.abort();
    }
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchEducationalVideo(videoSlug, controller.signal)
      .then(async (result) => {
        const relatedPage = await fetchEducationalVideos({ category: result.category, pageSize: 7, signal: controller.signal });
        if (controller.signal.aborted) return;
        setVideo(result);
        setRelatedVideos(relatedPage.results.filter((item) => item.slug !== result.slug).slice(0, 6));
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت ویدیو انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [videoSlug]);

  const chapterTitles = video?.content
    ? video.content.split('\n').filter((line) => line.startsWith('## ')).map((line) => line.slice(3).trim())
    : [];

  const shareVideo = async () => {
    if (!video) return;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShareLabel('لینک کپی شد');
      window.setTimeout(() => setShareLabel('اشتراک‌گذاری'), 1800);
    } catch {
      setShareLabel('اشتراک‌گذاری');
    }
  };

  if (!videoSlug) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="mb-4 text-red-700">نشانی ویدیو مشخص نیست.</p><Button onClick={() => navigateTo('videos')}>بازگشت به ویدیوها</Button></div>;
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center gap-2"><Loader2 className="size-5 animate-spin" /> در حال دریافت ویدیو...</div>;
  if (error || !video) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="mb-4 text-red-700">{error || 'ویدیو پیدا نشد.'}</p><Button onClick={() => navigateTo('videos')}>بازگشت به ویدیوها</Button></div>;

  const publishedDate = formatPublishedDate(video.published_at);
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb className="mb-6"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('videos')} className="cursor-pointer">ویدیوها</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage className="max-w-[220px] truncate">{video.title}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <Button variant="ghost" className="mb-6 gap-1" onClick={goBack}><ArrowRight className="size-4" /> بازگشت به ویدیوها</Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-premium">
              <video src={video.video_url} poster={video.thumbnail_url || undefined} controls preload="metadata" className="size-full object-contain">مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.</video>
            </div>

            <div>
              <div className="mb-3 flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold leading-9 md:text-2xl">{video.title}</h1>
                <Badge className={`shrink-0 border ${categoryColors[video.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{video.category_label}</Badge>
              </div>
              {video.description && <p className="mb-4 text-sm leading-7 text-muted-foreground">{video.description}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {video.author && <span className="flex items-center gap-1.5"><User className="size-4" />{video.author}</span>}
                {publishedDate && <span className="flex items-center gap-1.5"><Calendar className="size-4" />{publishedDate}</span>}
                <span className="flex items-center gap-1.5"><Eye className="size-4" />{toPersianNumber(video.view_count)} بازدید</span>
                {video.duration && <span className="flex items-center gap-1.5"><Clock className="size-4" />{video.duration}</span>}
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-1.5" onClick={shareVideo}><Share2 className="size-4" />{shareLabel}</Button>
            <Separator />

            <section>
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><List className="size-5 text-gold-dark" />توضیحات ویدیو</h2>
              {video.content ? <article className="prose prose-lg max-w-none">{renderMarkdown(video.content)}</article> : <p className="leading-8 text-muted-foreground">{video.description || 'توضیحات تکمیلی برای این ویدیو ثبت نشده است.'}</p>}
            </section>
          </div>

          <aside className="space-y-6">
            {chapterTitles.length > 0 && <Card className="p-4"><h2 className="mb-4 flex items-center gap-2 font-bold"><List className="size-4 text-gold-dark" />سرفصل‌ها</h2><ol className="space-y-3">{chapterTitles.map((title, index) => <li key={title} className="flex gap-3 text-sm"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">{toPersianNumber(index + 1)}</span><span className="pt-1">{title}</span></li>)}</ol></Card>}

            <Card className="overflow-hidden p-0">
              <div className="border-b p-4"><h2 className="font-bold">ویدیوهای مرتبط</h2></div>
              {relatedVideos.length === 0 ? <p className="p-5 text-sm text-muted-foreground">ویدیوی مرتبط دیگری منتشر نشده است.</p> : <div className="divide-y">{relatedVideos.map((related) => (
                <button key={related.id} className="flex w-full gap-3 p-3 text-right transition-colors hover:bg-muted/50" onClick={() => navigateTo('video-detail', { videoId: related.slug })}>
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {related.thumbnail_url && <OptimizedImage src={related.thumbnail_url} alt={related.title} fill sizes="112px" className="object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25"><Play className="size-4 text-white" fill="currentColor" /></div>
                  </div>
                  <div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-medium leading-5">{related.title}</h3><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3" />{toPersianNumber(related.view_count)} بازدید</span></div>
                </button>
              ))}</div>}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
