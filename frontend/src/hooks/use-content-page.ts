import { useEffect, useState } from 'react';
import {
  fetchContentPage,
  type ContentKind,
  type ContentPage,
  type ContentQuery,
} from '@/lib/content-api';

export function useContentPage<T>(kind: ContentKind, query: ContentQuery) {
  const [data, setData] = useState<ContentPage<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const { page, pageSize, category, q } = query;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchContentPage<T>(kind, { page, pageSize, category, q }).then(
        (response) => {
          if (!active) return;
          setData(response);
          setError('');
        },
        (reason) => {
          if (!active) return;
          setData(null);
          setError(reason instanceof Error ? reason.message : 'دریافت محتوا انجام نشد.');
        },
      ).finally(() => { if (active) setLoading(false); });
    }, q ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [kind, page, pageSize, category, q, retry]);

  return { data, loading, error, reload: () => setRetry((value) => value + 1) };
}
