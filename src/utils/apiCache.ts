/**
 * apiFetch — Universal fetch wrapper with:
 *  - localStorage cache with configurable TTL
 *  - In-flight request deduplication (same URL won't double-fetch)
 *  - Per-domain token-bucket rate limiter (prevents 429s from Jikan etc.)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // unix ms
}

// ─── In-memory dedup map ──────────────────────────────────────────────────────

const inFlightRequests = new Map<string, Promise<any>>();

// ─── Token Bucket Rate Limiter ────────────────────────────────────────────────

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const RATE_LIMIT_CONFIGS: Record<string, { maxTokens: number; refillPerSec: number }> = {
  'api.jikan.moe': { maxTokens: 3, refillPerSec: 3 }, // Jikan: 3 req/sec
  'graphql.anilist.co': { maxTokens: 5, refillPerSec: 5 }, // AniList: generous
  'api.mangadex.org': { maxTokens: 5, refillPerSec: 5 }, // MangaDex: 5 req/sec
  'default': { maxTokens: 10, refillPerSec: 10 },
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'default';
  }
}

function consumeToken(domain: string): boolean {
  const config = RATE_LIMIT_CONFIGS[domain] ?? RATE_LIMIT_CONFIGS['default'];
  const now = Date.now();
  let bucket = buckets.get(domain);

  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(domain, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsed * config.refillPerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true; // allowed
  }
  return false; // rate limited
}

async function waitForToken(domain: string, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!consumeToken(domain)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Rate limit timeout for ${domain}`);
    }
    // Wait ~100ms then retry
    await new Promise((r) => setTimeout(r, 100));
  }
}

// ─── localStorage Cache helpers ───────────────────────────────────────────────

const CACHE_PREFIX = 'apicache_';

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // Storage quota exceeded — evict oldest entries
    evictOldestEntries();
    try {
      const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Silently fail if still full
    }
  }
}

function evictOldestEntries(): void {
  try {
    const cacheKeys: Array<{ key: string; expiresAt: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) {
        try {
          const entry: CacheEntry<any> = JSON.parse(localStorage.getItem(k) ?? '{}');
          cacheKeys.push({ key: k, expiresAt: entry.expiresAt ?? 0 });
        } catch {
          cacheKeys.push({ key: k, expiresAt: 0 });
        }
      }
    }
    // Remove the oldest 25% of entries
    cacheKeys.sort((a, b) => a.expiresAt - b.expiresAt);
    const toRemove = Math.ceil(cacheKeys.length * 0.25);
    cacheKeys.slice(0, toRemove).forEach(({ key }) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET request with cache + rate limiting.
 * @param url        Full URL to fetch
 * @param ttlMs      Cache TTL in milliseconds (default: 15 minutes)
 * @param fetchInit  Optional RequestInit (for POST/headers etc.)
 */
export async function apiFetch<T = any>(
  url: string,
  ttlMs: number = 15 * 60 * 1000,
  fetchInit?: RequestInit,
): Promise<T> {
  // Build a cache key from URL + body (for POST requests like GraphQL)
  const bodyStr = typeof fetchInit?.body === 'string' ? fetchInit.body : '';
  const cacheKey = url + (bodyStr ? '|' + bodyStr : '');

  // 1. Check localStorage cache
  const cached = getCached<T>(cacheKey);
  if (cached !== null) return cached;

  // 2. Dedup in-flight requests
  const existing = inFlightRequests.get(cacheKey);
  if (existing) return existing as Promise<T>;

  // 3. Rate limiting
  const domain = getDomain(url);
  await waitForToken(domain);

  // 4. Fetch
  const requestPromise = fetch(url, fetchInit)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: T = await res.json();
      setCached<T>(cacheKey, data, ttlMs);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// ─── TTL Presets ─────────────────────────────────────────────────────────────

export const TTL = {
  ONE_MIN: 60 * 1000,
  FIVE_MIN: 5 * 60 * 1000,
  FIFTEEN_MIN: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;
