const CACHE_NAME = 'gravity-os-v1';
const GAME_CACHE_NAME = 'gravity-games-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/home/index.html',
  '/assets/games/games.html',
  '/assets/games/games.js',
  '/assets/games/games.css',
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
  const url = new URL(event.request.url);
  
  // Cache game covers and game files from GitHub or local assets
  const isGameAsset = url.href.includes('GravityOS-Assets/main/covers') || 
                      url.href.includes('GravityOS-Assets/main/files') ||
                      url.pathname.includes('/assets/games/covers/') || 
                      url.pathname.includes('/assets/games/files/');

  if (isGameAsset) {
    event.respondWith(
      caches.open(GAME_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => response);
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET' && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
