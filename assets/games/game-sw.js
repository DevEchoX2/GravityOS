const CACHE_NAME = 'gravity-games-v1';
const ASSETS_TO_CACHE = [
  './g.html',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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
  // We want to cache game assets as they are loaded
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((fetchResponse) => {
        // Only cache successful responses from specific domains (to avoid caching everything)
        if (
          fetchResponse &&
          fetchResponse.status === 200 &&
          (event.request.url.includes('cdn.jsdelivr.net') || 
           event.request.url.includes('github.com') ||
           event.request.url.includes('raw.githubusercontent.com'))
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback for offline if not in cache
      if (event.request.mode === 'navigate') {
        return caches.match('./g.html');
      }
    })
  );
});
