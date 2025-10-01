const RUNTIME_CACHE = 'white-boards-runtime-v1';
const BASE_URL = '/white-boards';

// Everything goes into runtime cache!

// Install event - just activate immediately, no pre-caching
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        console.log('Service Worker: Ready to cache everything in runtime!');
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Install failed:', error);
      }
    })()
  );
});

// Activate event - cleanup old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== RUNTIME_CACHE &&
              cacheName.startsWith('white-boards-')
            )
            .map(cacheName => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
        
        // Claim all clients immediately
        await self.clients.claim();
        console.log('Service Worker: Activated successfully');
      } catch (error) {
        console.error('Service Worker: Activation failed:', error);
      }
    })()
  );
});

// Fetch event - implement offline-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Only handle requests within our app's scope
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith(BASE_URL) && url.origin === location.origin) {
    return;
  }

  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: For navigation requests (HTML pages)
    if (request.mode === 'navigate' || request.destination === 'document') {
      return await handleNavigationRequest(request);
    }
    
    // Strategy 2: For static assets (JS, CSS, images, etc.)
    if (isStaticAsset(url)) {
      return await handleStaticAssetRequest(request);
    }
    
    // Strategy 3: For API calls and other requests
    return await handleDynamicRequest(request);
    
  } catch (error) {
    console.error('Service Worker: Fetch handler error:', error);
    
    // Ultimate fallback - try to serve from cache
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing else works, return offline page
    return await getOfflineFallback(request);
  }
}

async function handleNavigationRequest(request) {
  try {
    // OFFLINE FIRST: Always try cache first for navigation
    const cachedResponse = await getCachedResponse(request);
    
    if (navigator.onLine) {
      // If online, try to fetch and update cache in background
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          // Update cache with fresh content
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, networkResponse.clone());
          
          // If we have cached content, serve it for speed
          // Otherwise serve the network response
          if (cachedResponse) {
            // Update cache in background, serve cached version for speed
            return cachedResponse;
          }
          return networkResponse;
        }
      } catch (networkError) {
        console.log('Service Worker: Network failed, serving from cache');
      }
    }
    
    // Serve from cache (either offline or network failed)
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to main page
    const mainPageResponse = await caches.match(`${BASE_URL}/`);
    if (mainPageResponse) {
      return mainPageResponse;
    }
    
    // Last resort fallback
    return await getOfflineFallback(request);
    
  } catch (error) {
    console.error('Service Worker: Navigation request failed:', error);
    return await getOfflineFallback(request);
  }
}

async function handleStaticAssetRequest(request) {
  try {
    // CACHE FIRST: For static assets, prefer cache for speed
    const cachedResponse = await getCachedResponse(request);
    
    if (cachedResponse) {
      // Serve from cache immediately
      if (navigator.onLine) {
        // Background update if online
        updateCacheInBackground(request);
      }
      return cachedResponse;
    }
    
    // If not in cache and online, fetch and cache
    if (navigator.onLine) {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    }
    
    throw new Error('Asset not available offline');
    
  } catch (error) {
    console.error('Service Worker: Static asset request failed:', error);
    return new Response('Asset not available offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function handleDynamicRequest(request) {
  try {
    if (!navigator.onLine) {
      // If offline, serve from cache ONLY
      const cachedResponse = await getCachedResponse(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      throw new Error('Request not available offline');
    }
    
    // If online, try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.status < 400) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Request failed', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function getCachedResponse(request) {
  // Only check runtime cache since that's all we use
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  return await runtimeCache.match(request);
}

async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, networkResponse);
      console.log(`Service Worker: Background updated cache for ${request.url}`);
    }
  } catch (error) {
    console.log('Service Worker: Background cache update failed:', error);
  }
}

async function getOfflineFallback(request) {
  // For navigation requests, return the main app
  if (request.mode === 'navigate' || request.destination === 'document') {
    const fallback = await caches.match(`${BASE_URL}/`);
    if (fallback) {
      return fallback;
    }
  }
  
  // Generic offline response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

function isStaticAsset(url) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.webp',
    '.avif', '.webm', '.mp4', '.mp3'
  ];
  
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch(error => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames,
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        count: keys.length,
        urls: keys.map(req => req.url)
      };
    }
    
    return status;
  } catch (error) {
    return { error: error.message };
  }
}

async function clearAllCaches() {
  // Only clear caches if online (as per requirements)
  if (!navigator.onLine) {
    throw new Error('Cannot clear cache while offline - staying offline-first!');
  }
  
  const cacheNames = await caches.keys();
  const whiteBoardsCaches = cacheNames.filter(name => name.startsWith('white-boards-'));
  await Promise.all(whiteBoardsCaches.map(name => caches.delete(name)));
  console.log('Service Worker: Cleared caches:', whiteBoardsCaches);
}

// Periodic cache cleanup (only when online)
setInterval(async () => {
  if (navigator.onLine) {
    try {
      const cache = await caches.open(RUNTIME_CACHE);
      const requests = await cache.keys();
      
      // Remove old entries (older than 7 days for runtime cache)
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      let cleanedCount = 0;
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (now - responseDate > maxAge) {
              await cache.delete(request);
              cleanedCount++;
            }
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Service Worker: Cleaned ${cleanedCount} old cache entries`);
      }
    } catch (error) {
      console.error('Service Worker: Cache cleanup failed:', error);
    }
  }
}, 60 * 60 * 1000); // Run every hour

console.log('Service Worker: Offline-first script loaded with BASE_URL:', BASE_URL);
