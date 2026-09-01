/* ============================================================
   DebtIQ service worker — installable PWA + offline app shell.
   - Precaches the single-file app shell so it launches offline.
   - Navigations: network-first (fresh app), fall back to cache.
   - Same-origin assets: cache-first, then network (and cache it).
   - /api/* is never cached (always live; auth-gated).
   Bump CACHE on every shell change to invalidate old caches.
   ============================================================ */
const CACHE = 'debtiq-v1';
const SHELL = [
  '/', '/index.html', '/lenders.js', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))  // tolerate a missing asset
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache API calls — they must be live and are auth-gated.
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

  // App navigations: serve fresh when online, fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put('/index.html', cp)); return res; })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Same-origin static assets: cache-first, then network (and cache the response).
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          if (res && res.status === 200) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
          return res;
        }).catch(() => cached)
      )
    );
  }
  // Cross-origin (fonts, jsDelivr): leave to the browser/network.
});
