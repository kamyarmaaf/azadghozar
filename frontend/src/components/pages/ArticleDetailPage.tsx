'use client';

import { isValidElement, useMemo } from 'react';
import { ArrowRight, User, Clock, Calendar, Share2, Bookmark, Heart, MessageSquare, Eye } from 'lucide-react';
import { blogArticles } from '@/lib/mock-data';
import { useNavigation } from '@/stores/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { elements.push(<ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />); inList = false; }
      continue;
    }

    // Heading ##
    if (trimmed.startsWith('## ')) {
      if (inList) { elements.push(<ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />); inList = false; }
      elements.push(<h2 key={elements.length} className="text-lg font-bold mt-8 mb-4">{trimmed.slice(3)}</h2>);
      continue;
    }

    // List item
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        inList = true;
        elements.push(<ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li className="leading-7">{trimmed.slice(2)}</li>
        </ul>);
      } else {
        const lastUl = elements[elements.length - 1];
        if (isValidElement<{ children?: React.ReactNode }>(lastUl)) {
          elements[elements.length - 1] = <ul key={elements.length - 1} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            {lastUl.props.children}
            <li className="leading-7">{trimmed.slice(2)}</li>
          </ul>;
        }
      }
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      // Parse bold
      const parsed = parseBold(text);
      elements.push(<p key={elements.length} className="leading-8 mb-2 flex gap-2"><span className="text-gold-dark font-bold shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span><span>{parsed}</span></p>);
      continue;
    }

    if (inList) { elements.push(<ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />); inList = false; }

    // Paragraph with bold
    elements.push(<p key={elements.length} className="leading-8 mb-4 text-muted-foreground">{parseBold(trimmed)}</p>);
  }

  if (inList) elements.push(<ul key={elements.length} className="list-disc list-inside space-y-1 mb-4 text-muted-foreground" />);
  return elements;
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function ArticleDetailPage() {
  const { navigateTo, pageData, goBack } = useNavigation();
  const articleId = pageData?.articleId as string | undefined;

  const article = useMemo(() => {
    if (!articleId) return null;
    return blogArticles.find((a) => a.id === articleId) ?? null;
  }, [articleId]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return blogArticles
      .filter((a) => a.id !== article.id && a.category === article.category)
      .slice(0, 3);
  }, [article]);

  if (!article) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold mb-2">مقاله یافت نشد</h2>
          <p className="text-muted-foreground mb-6">مقاله مورد نظر شما وجود ندارد یا حذف شده است.</p>
          <Button onClick={() => navigateTo('blog')}>بازگشت به وبلاگ</Button>
        </div>
      </main>
    );
  }

  const contentText = article.content || article.summary;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('blog')} className="cursor-pointer">وبلاگ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{article.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button variant="ghost" className="mb-6 gap-1 -mr-2" onClick={goBack}>
          <ArrowRight className="size-4" />
          بازگشت
        </Button>

        {/* Hero Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 shadow-premium">
          <OptimizedImage src={article.image} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6">
            <Badge variant="secondary" className="mb-3">{article.category}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-10">{article.title}</h1>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b">
          <span className="flex items-center gap-1.5">
            <User className="size-4" />
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            {article.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {article.readTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-4" />
            ۱,۲۳۴ بازدید
          </span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none mb-12">
          {renderMarkdown(contentText)}
        </article>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-12 pb-8 border-b">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-4" />
            اشتراک‌گذاری
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="size-4" />
            ذخیره
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Heart className="size-4" />
            لایک
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <MessageSquare className="size-4" />
            نظر
          </Button>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">مقالات مرتبط</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((ra) => (
                <Card
                  key={ra.id}
                  className="py-0 overflow-hidden hover-lift group cursor-pointer"
                  onClick={() => navigateTo('article-detail', { articleId: ra.id })}
                >
                  <div className="relative aspect-[16/10]">
                    <OptimizedImage src={ra.image} alt={ra.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm line-clamp-2 leading-6 group-hover:text-gold-dark transition-colors">
                      {ra.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ra.readTime}</span>
                      <span>{ra.date}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <Card className="bg-gradient-brand p-6 md:p-8 mb-8">
          <div className="text-center text-white">
            <h3 className="text-xl font-bold mb-2">به دنبال خودروی ایده‌آل خود هستید؟</h3>
            <p className="text-white/70 text-sm mb-4">هزاران خودروی وارداتی با بهترین قیمت در آزاد گذر</p>
            <Button variant="secondary" className="gap-2" onClick={() => navigateTo('buy')}>
              مشاهده خودروها
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
