const CACHE_VERSION = "v3.1.0"; // bump each deploy
const CACHE_NAME = `anamnesis-cache-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const request = event.request;

  // Skip non-GET requests 
  if (request.method !== 'GET') {
    return;
  }

  // Never cache index.html (prevents reload loops)
  if (url.pathname === "/" || url.pathname.endsWith("index.html")) {
    return event.respondWith(fetch(request));
  }

  // Skip navigation requests (SPA routes)
  if (request.mode === 'navigate') {
    return event.respondWith(fetch(request));
  }

  // Skip API endpoints 
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin")) {
    return event.respondWith(fetch(request));
  }

  // Skip SSE or WebSocket requests
  if (url.pathname.includes("/chat/stream")) {
    return;
  }

  // Only cache static assets (script, style, image, font)
  const cacheableDestinations = ['script', 'style', 'image', 'font', 'document'];
  if (!cacheableDestinations.includes(request.destination)) {
    return;
  }

  // Cache-first strategy for static assets with error handling
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          try {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          } catch (error) {
            console.log('[SW] Cache put failed:', error);
          }
        }
        return response;
      });
    })
  );
});