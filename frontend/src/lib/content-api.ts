import { apiRequest, resolveMediaUrl } from '@/lib/api';

export interface ContentPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ContentCategory {
  value: string;
  label: string;
}

export interface EducationalVideo {
  id: number;
  slug: string;
  title: string;
  category: string;
  category_label: string;
  description: string;
  content: string;
  author: string;
  duration: string;
  thumbnail_url: string;
  video_url: string;
  view_count: number;
  published_at: string | null;
}

export interface FrequentlyAskedQuestion {
  id: number;
  question: string;
  answer: string;
  category: string;
  category_label: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  category_label: string;
  author: string;
  read_time: string;
  cover_image_url: string;
  view_count: number;
  published_at: string | null;
}

export type ContentKind = 'videos' | 'faqs' | 'articles';

export interface ContentQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
}

export function fetchContentPage<T>(kind: ContentKind, query: ContentQuery = {}) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    page_size: String(query.pageSize ?? 9),
  });
  if (query.category && query.category !== 'all') params.set('category', query.category);
  if (query.q?.trim()) params.set('q', query.q.trim());
  return apiRequest<ContentPage<T>>(`/content/${kind}/?${params}`);
}

export function fetchContentCategories(kind: ContentKind) {
  return apiRequest<ContentCategory[]>(`/content/${kind}/categories/`);
}

export function fetchVideo(slug: string) {
  return apiRequest<EducationalVideo>(`/content/videos/${encodeURIComponent(slug)}/`);
}

export function fetchArticle(slug: string) {
  return apiRequest<Article>(`/content/articles/${encodeURIComponent(slug)}/`);
}

export function contentImageUrl(url: string): string {
  return resolveMediaUrl(url);
}

export function contentDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('fa-IR').format(new Date(value)) : '';
}
