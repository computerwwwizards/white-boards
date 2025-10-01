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

// Fetch event - implement cache-first strategy for static assets and navigation
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle static assets OR navigation requests (HTML pages)
  if (isStaticAsset(url) || event.request.mode === 'navigate') {
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
        return fetchPromise.catch(error => {
          // If it's a navigation request and network fails, try to serve index.html from cache
          if (event.request.mode === 'navigate') {
            console.log('[SW] Navigation failed, trying to serve cached index.html');
            // Get the base path from the current request
            const basePath = new URL(event.request.url).pathname.split('/').slice(0, -1).join('/') || '';
            const indexPath = basePath + '/index.html';
            
            return caches.match(indexPath).then(indexResponse => {
              if (indexResponse) {
                console.log('[SW] Serving cached index.html for navigation:', indexPath);
                return indexResponse;
              }
              // Try to serve the base path
              return caches.match(basePath + '/').then(rootResponse => {
                if (rootResponse) {
                  console.log('[SW] Serving cached root for navigation:', basePath + '/');
                  return rootResponse;
                }
                // Try any cached HTML file as last resort
                return caches.keys().then(cacheNames => {
                  for (const cacheName of cacheNames) {
                    return caches.open(cacheName).then(cache => {
                      return cache.keys().then(requests => {
                        for (const request of requests) {
                          if (request.url.endsWith('.html') || request.url.endsWith('/')) {
                            return cache.match(request);
                          }
                        }
                        return null;
                      });
                    });
                  }
                  return null;
                }).then(fallbackResponse => {
                  if (fallbackResponse) {
                    console.log('[SW] Serving fallback HTML from cache');
                    return fallbackResponse;
                  }
                  throw error;
                });
              });
            });
          }
          throw error;
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
