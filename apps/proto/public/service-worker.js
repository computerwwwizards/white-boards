
const CACHE_NAME = 'runtime-cache-v1';

// List of file extensions to cache
const STATIC_ASSET_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.html'
];

function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSET_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

self.addEventListener('install', event => {
  self.skipWaiting();
});


self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Handle navigation requests (reload, F5, SPA routes)
  if (event.request.mode === 'navigate') {
    const INDEX_URL = '/white-boards/index.html';
    event.respondWith(
      caches.match(INDEX_URL).then(cached => {
        return cached || fetch(INDEX_URL)
          .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              caches.open(CACHE_NAME).then(cache => cache.put(INDEX_URL, response.clone()));
            }
            return response;
          })
          .catch(() => {
            // If offline and not cached, show a simple offline page
            return new Response('<h1>Offline</h1><p>You are currently offline.</p>', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
    );
    return;
  }

  // Only cache static assets
  if (!isStaticAsset(event.request)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});
