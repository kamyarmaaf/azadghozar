import { apiRequest } from '@/lib/api';

export interface FrequentlyAskedQuestion {
  id: number;
  question: string;
  answer: string;
  category: string;
  category_label: string;
}

export interface FrequentlyAskedQuestionPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: FrequentlyAskedQuestion[];
}

export interface FAQCategory {
  value: string;
  label: string;
}

export async function fetchFrequentlyAskedQuestions(
  options: {
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
    signal?: AbortSignal;
  } = {},
): Promise<FrequentlyAskedQuestionPage> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    page_size: String(options.pageSize ?? 20),
  });
  if (options.category) params.set('category', options.category);
  if (options.query?.trim()) params.set('q', options.query.trim());
  return apiRequest<FrequentlyAskedQuestionPage>(`/content/faqs/?${params.toString()}`, {
    signal: options.signal,
  });
}

export async function fetchFAQCategories(signal?: AbortSignal): Promise<FAQCategory[]> {
  return apiRequest<FAQCategory[]>('/content/faqs/categories/', { signal });
}
