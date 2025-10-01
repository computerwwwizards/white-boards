
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
