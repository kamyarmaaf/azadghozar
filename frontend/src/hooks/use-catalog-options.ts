import { useEffect, useState } from 'react';
import { fetchCatalogOptions, type CatalogOptions } from '@/lib/catalog-options';

let cache: CatalogOptions | null = null;
let pending: Promise<CatalogOptions> | null = null;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

function load(force = false): Promise<CatalogOptions> {
  if (!force && cache && Date.now() - cachedAt < CACHE_MS) return Promise.resolve(cache);
  if (!pending) {
    pending = fetchCatalogOptions()
      .then((result) => {
        cache = result;
        cachedAt = Date.now();
        return result;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}

export function useCatalogOptions() {
  const [data, setData] = useState<CatalogOptions | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let mounted = true;
    load(retry > 0).then(
      (result) => { if (mounted) { setData(result); setError(false); setLoading(false); } },
      () => { if (mounted) { setError(true); setLoading(false); } },
    );
    return () => { mounted = false; };
  }, [retry]);

  return {
    brands: data?.brands ?? [],
    bodyTypes: data?.bodyTypes.map((item) => item.name) ?? [],
    loading,
    error,
    reload: () => { setLoading(true); setError(false); setRetry((value) => value + 1); },
  };
}
