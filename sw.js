const CACHE = 'financeflow-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/output.css',
  '/manifest.json',
  '/js/store.js',
  '/js/api.js',
  '/js/calculator.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('SW: fallo al cachear algunos assets', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API requests: network first, fallback to cache
  if (url.hostname === 'api.dolaraldiavzla.com' || url.hostname === 've.dolarapi.com') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(match => match || new Response(
          JSON.stringify({ error: 'offline' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )))
    );
    return;
  }

  // Static assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      if (res.ok) caches.open(CACHE).then(cache => cache.put(e.request, clone));
      return res;
    }).catch(() => new Response('Offline', { status: 503 })))
  );
});
