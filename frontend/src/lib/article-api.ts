import { apiRequest } from '@/lib/api';

export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  category_label: string;
  author: string;
  read_time: string;
  cover_image_url: string;
  meta_title: string;
  meta_description: string;
  view_count: number;
  published_at: string | null;
}

export interface ArticlePage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
}

export interface ArticleCategory {
  value: string;
  label: string;
}

export async function fetchArticles(
  options: {
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
    signal?: AbortSignal;
  } = {},
): Promise<ArticlePage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    page_size: String(options.pageSize ?? 9),
  });
  if (options.category) params.set('category', options.category);
  if (options.query?.trim()) params.set('q', options.query.trim());
  return apiRequest<ArticlePage>(`/content/articles/?${params.toString()}`, {
    signal: options.signal,
  });
}

export async function fetchArticle(slug: string, signal?: AbortSignal): Promise<Article> {
  return apiRequest<Article>(`/content/articles/${encodeURIComponent(slug)}/`, { signal });
}

export async function fetchArticleCategories(signal?: AbortSignal): Promise<ArticleCategory[]> {
  return apiRequest<ArticleCategory[]>('/content/articles/categories/', { signal });
}
