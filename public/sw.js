// HuntLogic Service Worker — PWA Offline Support
const CACHE_VERSION = "huntlogic-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "/", "/login", "/dashboard", "/manifest.json",
  "/favicon.ico", "/apple-touch-icon.png",
  "/icons/icon-192x192.png", "/icons/icon-512x512.png",
];

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate — purge outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
              .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, cacheName) {
  return fetch(req).then((res) => {
    caches.open(cacheName).then((c) => c.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req));
}

function cacheFirst(req, cacheName) {
  return caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    caches.open(cacheName).then((c) => c.put(req, res.clone()));
    return res;
  }));
}

// Fetch — route requests to the right strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Auth API: NEVER intercept — service workers strip Set-Cookie headers
  // from responses passed through respondWith(), breaking CSRF token flow
  if (url.pathname.startsWith("/api/auth/")) return;

  // API calls: network-first, fall back to cached response
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Static assets (_next/static, icons, fonts): cache-first
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(woff2?|ttf|otf|eot|ico|png|jpg|jpeg|svg|webp)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: network-first for offline support
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
