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

// Activate event - smart cache cleanup based on network status
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    // Check if we're online before cleaning up caches
    fetch('/').then(() => {
      // We're online - safe to clean up old caches
      console.log('[SW] Online - cleaning up old caches');
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      });
    }).catch(() => {
      // We're offline - keep all caches for maximum resilience
      console.log('[SW] Offline - keeping all caches for resilience');
      return Promise.resolve();
    }).then(() => {
      console.log('[SW] Service worker activated');
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
      // First, try to find the resource in ANY cache
      caches.match(event.request).then(cachedResponse => {
        
        // Define the fetch promise for network request
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // If we get a valid response, update the current cache
            if (networkResponse && networkResponse.status === 200) {
              console.log('[SW] Updating cache for:', event.request.url);
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] Network fetch failed for:', event.request.url, error);
            // If network fails and we have cached response, return it
            if (cachedResponse) {
              console.log('[SW] Network failed, serving cached version:', event.request.url);
              return cachedResponse;
            }
            throw error;
          });

        // If we have a cached response, serve it immediately and update in background
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          // Start background update (silent fail)
          fetchPromise.catch(() => {});
          return cachedResponse;
        }

        // No cached response, must wait for network
        console.log('[SW] No cache found, fetching from network:', event.request.url);
        return fetchPromise;
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
