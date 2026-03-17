const CACHE_NAME = 'gravity-os-v1';
importScripts('/assets/games/cache.sw-js');

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/home/index.html',
  '/assets/games/games.html',
  '/assets/games/games.js',
  '/assets/games/games.css',
  '/assets/games/cache.sw-js',
  '/assets/json/zones.json',
  '/assets/themes/themes.json',
  '/assets/proxy/proxy.html',
  '/assets/proxy/proxy.js',
  '/assets/settings/settings.html',
  '/assets/apps/apps.html',
  '/assets/ai/ai.html',
  '/assets/extensions/extensions.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err)))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Only cache successful GET requests
          if (event.request.method === 'GET' && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback for offline mode if fetch fails and not in cache
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
