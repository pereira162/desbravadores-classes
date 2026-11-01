// SGC Classes - Service Worker
const CACHE_NAME = 'sgc-classes-cache-v3';
const ASSETS_TO_CACHE = [
  '/desbravadores-classes/manifest.json',
  '/desbravadores-classes/icons/icon-192.png',
  '/desbravadores-classes/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW cache.addAll partially failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navegação e páginas HTML NUNCA são cacheadas (sempre diretas da rede para garantir código novo)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    return;
  }

  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
