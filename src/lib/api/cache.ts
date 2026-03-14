/**
 * Lightweight client-side API cache with stale-while-revalidate pattern.
 * No external dependencies.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_STALE_MS = 30_000; // 30 seconds before revalidating
const DEFAULT_MAX_AGE_MS = 300_000; // 5 minutes hard expiry

interface FetchWithCacheOptions {
  staleMs?: number;
  maxAgeMs?: number;
}

/**
 * Fetch with stale-while-revalidate caching.
 * Returns cached data immediately if fresh, revalidates in background if stale.
 */
export async function fetchWithCache<T>(
  url: string,
  options?: FetchWithCacheOptions & RequestInit
): Promise<T> {
  const {
    staleMs = DEFAULT_STALE_MS,
    maxAgeMs = DEFAULT_MAX_AGE_MS,
    ...fetchOptions
  } = options || {};
  const cacheKey = url;
  const now = Date.now();
  const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;

  // If we have cached data
  if (entry) {
    const age = now - entry.timestamp;

    // Fresh — return immediately
    if (age < staleMs) {
      return entry.data;
    }

    // Stale but within max age — return stale data, revalidate in background
    if (age < maxAgeMs) {
      // Only start one revalidation at a time
      if (!entry.promise) {
        entry.promise = revalidate<T>(url, cacheKey, fetchOptions);
      }
      return entry.data;
    }

    // Expired — fetch fresh
  }

  // No cache or expired — fetch and wait
  return revalidate<T>(url, cacheKey, fetchOptions);
}

async function revalidate<T>(
  url: string,
  cacheKey: string,
  fetchOptions?: RequestInit
): Promise<T> {
  const res = await fetch(url, fetchOptions);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Invalidate a specific cache entry or all entries matching a prefix.
 */
export function invalidateCache(urlOrPrefix?: string): void {
  if (!urlOrPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key === urlOrPrefix || key.startsWith(urlOrPrefix)) {
      cache.delete(key);
    }
  }
}
