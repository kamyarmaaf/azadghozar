import { apiRequest } from '@/lib/api';

export interface EducationalVideo {
  id: number;
  title: string;
  slug: string;
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

export interface EducationalVideoPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: EducationalVideo[];
}

export interface VideoCategory {
  value: string;
  label: string;
}

export async function fetchEducationalVideos(
  options: {
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
    signal?: AbortSignal;
  } = {},
): Promise<EducationalVideoPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    page_size: String(options.pageSize ?? 8),
  });
  if (options.category) params.set('category', options.category);
  if (options.query?.trim()) params.set('q', options.query.trim());
  return apiRequest<EducationalVideoPage>(`/content/videos/?${params.toString()}`, {
    signal: options.signal,
  });
}

export async function fetchEducationalVideo(
  slug: string,
  signal?: AbortSignal,
): Promise<EducationalVideo> {
  return apiRequest<EducationalVideo>(
    `/content/videos/${encodeURIComponent(slug)}/`,
    { signal },
  );
}

export async function fetchVideoCategories(
  signal?: AbortSignal,
): Promise<VideoCategory[]> {
  return apiRequest<VideoCategory[]>('/content/videos/categories/', { signal });
}
