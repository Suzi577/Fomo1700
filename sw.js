// FOMO - Fixed Service Worker - Clears old cache
const CACHE_NAME = 'fomo-v3-' + Date.now(); // Force new cache

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // ALWAYS fetch events.json fresh from network, never cache
  if (event.request.url.includes('events.json')) {
    event.respondWith(
      fetch(event.request.url + '?t=' + Date.now(), { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For other files, network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
