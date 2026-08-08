/* ============================================================
 * WatchList Service Worker
 * Strategies:
 *   - JS/CSS/fonts (hash URL)  → Cache-First, 1 year
 *   - HTML                     → Network-First (always fresh)
 *   - AniList / MangaDex / Jikan API → Stale-While-Revalidate, 15 min TTL
 *   - Image CDNs               → Cache-First, 7 days
 * ============================================================ */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `wast-static-${CACHE_VERSION}`;
const API_CACHE = `wast-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `wast-images-${CACHE_VERSION}`;

const TTL_MS = {
  API: 15 * 60 * 1000,        // 15 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// API origins to cache
const API_ORIGINS = [
  'https://graphql.anilist.co',
  'https://api.mangadex.org',
  'https://api.jikan.moe',
];

// Image CDN origins to cache
const IMAGE_ORIGINS = [
  'https://uploads.mangadex.org',
  'https://s4.anilist.co',
  'https://cdn.myanimelist.net',
  'https://img1.ak.crunchyroll.com',
];

// ── Install: pre-cache the app shell ──────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/'])
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route to appropriate strategy ─────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET & chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // 1. HTML (app shell) → Network-First
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // 2. Static assets with hash in filename → Cache-First (immutable)
  const isHashedAsset = /\/assets\/[^/]+-[a-f0-9]{8,}\.(js|css|woff2?|svg|png|jpg|webp)/.test(url.pathname);
  if (isHashedAsset) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3. API calls → Stale-While-Revalidate with TTL
  if (API_ORIGINS.some((o) => request.url.startsWith(o))) {
    event.respondWith(staleWhileRevalidateWithTTL(request, API_CACHE, TTL_MS.API));
    return;
  }

  // 4. Image CDNs → Cache-First with 7-day TTL
  if (IMAGE_ORIGINS.some((o) => request.url.startsWith(o))) {
    event.respondWith(cacheFirstWithTTL(request, IMAGE_CACHE, TTL_MS.IMAGES));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network failed and no cache available');
  }
}

/** Cache-First but checks TTL stored in a companion meta entry */
async function cacheFirstWithTTL(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const metaKey = request.url + '__meta';
  const metaRes = await cache.match(metaKey);
  
  if (metaRes) {
    const meta = await metaRes.json();
    if (Date.now() < meta.expiresAt) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    // TTL expired — remove stale entry
    cache.delete(request);
    cache.delete(metaKey);
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      cache.put(metaKey, new Response(JSON.stringify({ expiresAt: Date.now() + ttlMs }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network failed and no cache available');
  }
}

/** Serve stale immediately, revalidate in background, respect TTL */
async function staleWhileRevalidateWithTTL(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);
  const metaKey = request.url + '__meta';

  const [metaRes, cached] = await Promise.all([
    cache.match(metaKey),
    cache.match(request),
  ]);

  let isExpired = true;
  if (metaRes) {
    const meta = await metaRes.json();
    isExpired = Date.now() >= meta.expiresAt;
  }

  if (cached && !isExpired) {
    // Fresh cache hit — revalidate silently in background
    event.waitUntil(revalidate(request, cache, metaKey, ttlMs));
    return cached;
  }

  // Stale or no cache — fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      cache.put(metaKey, new Response(JSON.stringify({ expiresAt: Date.now() + ttlMs }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return response;
  } catch {
    if (cached) return cached; // serve stale on failure
    throw new Error('Network failed and no cache available');
  }
}

async function revalidate(request, cache, metaKey, ttlMs) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      cache.put(metaKey, new Response(JSON.stringify({ expiresAt: Date.now() + ttlMs }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }
  } catch {
    // silent — stale content is fine
  }
}
