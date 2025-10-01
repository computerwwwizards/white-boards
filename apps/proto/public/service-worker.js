
const CACHE_NAME = 'static-assets-v1';

// List of file extensions considered static assets
const STATIC_EXTENSIONS = [
	'.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.json', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.webm', '.gif', '.txt', '.html', '.pdf', '.zip', '.gz', '.mjs', '.map'
];

function isStaticAsset(url) {
	return STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

self.addEventListener('install', event => {
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys => Promise.all(
			keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
		))
	);
	self.clients.claim();
});

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	if (isStaticAsset(url)) {
		event.respondWith(
			caches.open(CACHE_NAME).then(cache =>
				cache.match(event.request).then(cachedResponse => {
					const fetchPromise = fetch(event.request)
						.then(networkResponse => {
							if (networkResponse && networkResponse.ok) {
								cache.put(event.request, networkResponse.clone());
							}
							return networkResponse;
						})
						.catch(() => cachedResponse);
					// Serve cached first, then update in background
					return cachedResponse || fetchPromise;
				})
			)
		);
	}
});
