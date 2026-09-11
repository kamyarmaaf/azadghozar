'use client';

import { isValidElement, useMemo, useState } from 'react';
import {
  ArrowRight,
  Play,
  Eye,
  Calendar,
  Clock,
  User,
  Share2,
  Bookmark,
  Heart,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  List,
  ChevronDown,
} from 'lucide-react';
import { videos } from '@/lib/mock-data';
import { useNavigation } from '@/stores/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const categoryColors: Record<string, string> = {
  '\u0642\u0648\u0627\u0646\u06cc\u0646': 'bg-red-100 text-red-700 border-red-200',
  '\u0622\u0645\u0648\u0632\u0634': 'bg-blue-100 text-blue-700 border-blue-200',
  '\u0645\u0642\u0627\u06cc\u0633\u0647': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '\u0631\u0627\u0647\u0646\u0645\u0627': 'bg-amber-100 text-amber-700 border-amber-200',
  '\u0646\u0642\u062f \u0648 \u0628\u0631\u0631\u0633\u06cc': 'bg-violet-100 text-violet-700 border-violet-200',
};

const chapterIcons = ['\u06f1', '\u06f2', '\u06f3', '\u06f4', '\u06f5', '\u06f6', '\u06f7', '\u06f8'];

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />
        );
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith('## ')) {
      if (inList) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />
        );
        inList = false;
      }
      elements.push(
        <h2 key={elements.length} className="text-lg font-bold mt-8 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        inList = true;
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li className="leading-7">{parseBold(trimmed.slice(2))}</li>
          </ul>
        );
      } else {
        const lastUl = elements[elements.length - 1];
        if (isValidElement<{ children?: React.ReactNode }>(lastUl)) {
          elements[
            elements.length - 1
          ] = (
            <ul key={elements.length - 1} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
              {lastUl.props.children}
              <li className="leading-7">{parseBold(trimmed.slice(2))}</li>
            </ul>
          );
        }
      }
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <p key={elements.length} className="leading-8 mb-2 flex gap-2">
          <span className="text-gold-dark font-bold shrink-0">
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
          <span>{parseBold(text)}</span>
        </p>
      );
      continue;
    }

    if (inList) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />
      );
      inList = false;
    }

    elements.push(
      <p key={elements.length} className="leading-8 mb-4 text-muted-foreground">
        {parseBold(trimmed)}
      </p>
    );
  }

  if (inList)
    elements.push(
      <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />
    );
  return elements;
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function extractChapters(content: string): { title: string; time: string }[] {
  const lines = content.split('\n');
  const chapters: { title: string; time: string }[] = [];
  let currentTime = '۰۰:۰۰';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Simulate time progression
      const idx = chapters.length;
      const mins = idx * 4 + 1;
      const secs = (idx * 23) % 60;
      currentTime = `${mins.toString().padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)])}:${secs.toString().padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)])}`;
      chapters.push({
        title: line.slice(3).trim(),
        time: currentTime,
      });
    }
  }
  return chapters;
}

export function VideoDetailPage() {
  const { navigateTo, pageData, goBack } = useNavigation();
  const videoId = pageData?.videoId as string | undefined;
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const video = useMemo(() => {
    if (!videoId) return videos[0];
    return videos.find((v) => v.id === videoId) ?? videos[0];
  }, [videoId]);

  const relatedVideos = useMemo(() => {
    return videos
      .filter((v) => v.id !== video.id && v.category === video.category)
      .slice(0, 6);
  }, [video]);

  const moreVideos = useMemo(() => {
    if (relatedVideos.length >= 6) return [];
    const remaining = videos
      .filter(
        (v) => v.id !== video.id && !relatedVideos.find((r) => r.id === v.id)
      )
      .slice(0, 6 - relatedVideos.length);
    return remaining;
  }, [video, relatedVideos]);

  const allRelated = [...relatedVideos, ...moreVideos];

  const chapters = useMemo(() => {
    if (!video.content) return [];
    return extractChapters(video.content);
  }, [video.content]);

  const contentText = video.content || video.description || '';

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">
                خانه
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('videos')} className="cursor-pointer">
                ویدیوها
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px]">{video.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button variant="ghost" className="mb-6 gap-1 -mr-2" onClick={goBack}>
          <ArrowRight className="size-4" />
          بازگشت به ویدیوها
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-premium">
              <OptimizedImage src={video.thumbnail} alt={video.title} fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/30" />

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/95 flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                  <Play className="size-10 md:size-12 text-brand mr-[-3px]" fill="currentColor" />
                </div>
              </div>

              {/* Bottom gradient + duration */}
              <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
                <Badge className="absolute bottom-3 left-3 bg-black/70 text-white border-0 text-sm font-medium">
                  {video.duration}
                </Badge>
              </div>
            </div>

            {/* Video Title */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl md:text-2xl font-bold leading-9">{video.title}</h1>
                <Badge className={`shrink-0 border ${categoryColors[video.category] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {video.category}
                </Badge>
              </div>
              {video.description && (
                <p className="text-muted-foreground text-sm leading-7 mb-4">
                  {video.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {video.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="size-4" />
                    {video.author}
                  </span>
                )}
                {video.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {video.date}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" />
                  {video.views} بازدید
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {video.duration}
                </span>
              </div>
            </div>

            <Separator />

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant={liked ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setLiked(!liked)}
              >
                <Heart className={`size-4 ${liked ? 'fill-current' : ''}`} />
                لایک {liked && '(۲۵۶)'}
              </Button>
              <Button
                variant={saved ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => setSaved(!saved)}
              >
                <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} />
                ذخیره
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="size-4" />
                اشتراک‌گذاری
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="size-4" />
                نظر
              </Button>
            </div>

            <Separator />

            {/* Content / Transcript */}
            {contentText ? (
              <section>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <List className="size-5 text-gold-dark" />
                  محتوای ویدیو
                </h2>
                <article className="prose prose-lg max-w-none">
                  {renderMarkdown(contentText)}
                </article>
              </section>
            ) : (
              <section>
                <h2 className="text-lg font-bold mb-4">محتوای ویدیو</h2>
                <p className="text-muted-foreground leading-8">
                  محتوای کامل این ویدیو به زودی اضافه خواهد شد.
                </p>
              </section>
            )}

            <Separator />

            {/* CTA */}
            <Card className="bg-gradient-brand p-6 md:p-8">
              <div className="text-center text-white">
                <h3 className="text-xl font-bold mb-2">به دنبال خودروی ایده‌آل خود هستید؟</h3>
                <p className="text-white/70 text-sm mb-4">
                  هزاران خودروی وارداتی با بهترین قیمت در آزاد گذر
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="secondary" className="gap-2" onClick={() => navigateTo('buy')}>
                    مشاهده خودروها
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => navigateTo('consultation')}
                  >
                    مشاوره رایگان
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chapters / Table of Contents */}
            {chapters.length > 0 && (
              <Card className="p-0 overflow-hidden">
                <div className="p-4 pb-3 border-b">
                  <h3 className="font-bold flex items-center gap-2">
                    <List className="size-4 text-gold-dark" />
                    فصل‌های ویدیو
                  </h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="chapters" className="border-0">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <ChevronDown className="size-4" />
                        {chapters.length} فصل
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-0">
                        {chapters.map((ch, idx) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-right"
                          >
                            <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0">
                              {chapterIcons[idx] || (idx + 1).toString()}
                            </span>
                            <span className="flex-1 line-clamp-1 font-medium">{ch.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0 font-mono">
                              {ch.time}
                            </span>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}

            {/* Related Videos */}
            <Card className="p-0 overflow-hidden">
              <div className="p-4 pb-3 border-b">
                <h3 className="font-bold">ویدیوهای مرتبط</h3>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {allRelated.map((rv) => (
                  <button
                    key={rv.id}
                    className="w-full flex gap-3 p-3 hover:bg-muted/50 transition-colors text-right"
                    onClick={() => navigateTo('video-detail', { videoId: rv.id })}
                  >
                    <div className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-900">
                      <OptimizedImage src={rv.thumbnail} alt={rv.title} fill sizes="112px" className="object-cover" />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="size-4 text-white mr-[-1px]" fill="currentColor" />
                      </div>
                      <Badge className="absolute bottom-1 left-1 bg-black/70 text-white border-0 text-[10px] px-1 py-0">
                        {rv.duration}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className="text-sm font-medium line-clamp-2 leading-5 mb-1">
                        {rv.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="size-3" />
                        <span>{rv.views} بازدید</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Services */}
            <Card className="p-4 space-y-3">
              <h3 className="font-bold mb-1">خدمات مرتبط</h3>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigateTo('inspection')}
              >
                <CheckCircle2 className="size-4 text-orange-500" />
                درخواست بازرسی خودرو
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigateTo('consultation')}
              >
                <ThumbsUp className="size-4 text-violet-500" />
                مشاوره تخصصی رایگان
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigateTo('transportation')}
              >
                <span className="text-green-600 font-bold text-sm">🚛</span>
                حمل و نقل خودرو
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
