'use client';

import { isValidElement, useEffect, useState } from 'react';
import { ArrowRight, Calendar, Clock, Eye, Loader2, Share2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { fetchArticle, fetchArticles, type Article } from '@/lib/article-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';

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
    elements.push(<ul key={`list-${elements.length}`} className="mb-5 list-inside list-disc space-y-2 text-muted-foreground">{listItems}</ul>);
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
      elements.push(<h2 key={elements.length} className="mb-4 mt-9 text-xl font-bold">{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      listItems.push(<li key={listItems.length} className="leading-8">{parseBold(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      const number = line.match(/^\d+/)?.[0];
      elements.push(<p key={elements.length} className="mb-3 flex gap-2 leading-8"><span className="shrink-0 font-bold text-gold-dark">{number}.</span><span>{parseBold(line.replace(/^\d+\.\s/, ''))}</span></p>);
    } else {
      flushList();
      elements.push(<p key={elements.length} className="mb-5 leading-8 text-muted-foreground">{parseBold(line)}</p>);
    }
  }
  flushList();
  return elements.filter(isValidElement);
}

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

export function ArticleDetailPage() {
  const { navigateTo, pageData, goBack } = useNavigation();
  const articleSlug = typeof pageData?.articleId === 'string' ? pageData.articleId : '';
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLabel, setShareLabel] = useState('اشتراک‌گذاری');

  useEffect(() => {
    const controller = new AbortController();
    if (!articleSlug) return () => controller.abort();
    const timer = window.setTimeout(() => setLoading(true), 0);
    void fetchArticle(articleSlug, controller.signal)
      .then(async (result) => {
        const relatedPage = await fetchArticles({ category: result.category, pageSize: 4, signal: controller.signal });
        if (controller.signal.aborted) return;
        setArticle(result);
        setRelatedArticles(relatedPage.results.filter((item) => item.slug !== result.slug).slice(0, 3));
        setError('');
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'دریافت مقاله انجام نشد.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [articleSlug]);

  useEffect(() => {
    if (!article) return;
    const previousTitle = document.title;
    document.title = article.meta_title || `${article.title} | آزادگذر`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content ?? '';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = article.meta_description || article.summary;
    return () => {
      document.title = previousTitle;
      if (meta) meta.content = previousDescription;
    };
  }, [article]);

  const shareArticle = async () => {
    if (!article) return;
    try {
      if (navigator.share) await navigator.share({ title: article.title, text: article.summary, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShareLabel('لینک کپی شد');
      window.setTimeout(() => setShareLabel('اشتراک‌گذاری'), 1800);
    } catch {
      setShareLabel('اشتراک‌گذاری');
    }
  };

  if (!articleSlug) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="mb-4 text-red-700">نشانی مقاله مشخص نیست.</p><Button onClick={() => navigateTo('blog')}>بازگشت به مجله</Button></div>;
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center gap-2"><Loader2 className="size-5 animate-spin" /> در حال دریافت مقاله...</div>;
  if (error || !article) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><p className="mb-4 text-red-700">{error || 'مقاله پیدا نشد.'}</p><Button onClick={() => navigateTo('blog')}>بازگشت به مجله</Button></div>;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Breadcrumb className="mb-6"><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('blog')} className="cursor-pointer">مجله خودرو</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage className="max-w-[240px] truncate">{article.title}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <Button variant="ghost" className="mb-6 gap-1" onClick={goBack}><ArrowRight className="size-4" /> بازگشت</Button>

        <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl bg-muted shadow-premium">
          {article.cover_image_url && <OptimizedImage src={article.cover_image_url} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6"><Badge variant="secondary" className="mb-3">{article.category_label}</Badge><h1 className="text-2xl font-bold leading-10 text-white md:text-3xl">{article.title}</h1></div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 border-b pb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="size-4" />{article.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="size-4" />{formatDate(article.published_at)}</span>
          {article.read_time && <span className="flex items-center gap-1.5"><Clock className="size-4" />{article.read_time}</span>}
          <span className="flex items-center gap-1.5"><Eye className="size-4" />{toPersianNumber(article.view_count)} بازدید</span>
        </div>

        <p className="mb-8 border-r-4 border-gold-dark pr-4 text-base leading-8 text-muted-foreground">{article.summary}</p>
        <article className="prose prose-lg mb-12 max-w-none">{renderMarkdown(article.content)}</article>

        <div className="mb-12 border-b pb-8"><Button variant="outline" size="sm" className="gap-1.5" onClick={shareArticle}><Share2 className="size-4" />{shareLabel}</Button></div>

        {relatedArticles.length > 0 && <section className="mb-12"><h2 className="mb-6 text-xl font-bold">مقالات مرتبط</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{relatedArticles.map((related) => <Card key={related.id} className="group cursor-pointer overflow-hidden py-0 hover-lift" onClick={() => navigateTo('article-detail', { articleId: related.slug })}><div className="relative aspect-[16/10] bg-muted">{related.cover_image_url && <OptimizedImage src={related.cover_image_url} alt={related.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />}</div><div className="space-y-2 p-4"><h3 className="line-clamp-2 text-sm font-bold leading-6 transition-colors group-hover:text-gold-dark">{related.title}</h3><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{related.read_time}</span><span>{formatDate(related.published_at)}</span></div></div></Card>)}</div></section>}

        <Card className="mb-8 bg-gradient-brand p-6 md:p-8"><div className="text-center text-white"><h2 className="mb-2 text-xl font-bold">به دنبال خودروی ایده‌آل خود هستید؟</h2><p className="mb-4 text-sm text-white/70">خودروهای فعال بازار را در آزادگذر مشاهده کنید.</p><Button variant="secondary" className="gap-2" onClick={() => navigateTo('buy')}>مشاهده خودروها <ArrowRight className="size-4" /></Button></div></Card>
      </div>
    </main>
  );
}
