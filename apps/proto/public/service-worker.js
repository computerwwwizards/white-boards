const CACHE_NAME = 'static-assets-v1';

// List of file extensions considered static assets
const STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', 
  '.json', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.webm', 
  '.gif', '.txt', '.html', '.pdf', '.zip', '.gz', '.mjs', '.map',
  '.xml', '.csv', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

// Check if a URL points to a static asset
function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext));
}

// Install event - immediately take control
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

// Activate event - take control of all clients (keep old caches for reliability)
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[SW] Service worker activated - keeping old caches for fallback');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement cache-first strategy for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          
          // Define the fetch promise for network request
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // If we get a valid response, update the cache
              if (networkResponse && networkResponse.status === 200) {
                console.log('[SW] Updating cache for:', event.request.url);
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(error => {
              console.log('[SW] Network fetch failed for:', event.request.url, error);
              // Return cached response if available, otherwise let the error propagate
              return cachedResponse;
            });

          // If we have a cached response, serve it immediately and update in background
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            // Start background update
            fetchPromise.catch(() => {
              // Silent fail for background updates
            });
            return cachedResponse;
          }

          // No cached response, wait for network
          console.log('[SW] No cache, fetching from network:', event.request.url);
          return fetchPromise;
        });
      })
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
