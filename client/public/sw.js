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

// Never cache index.html (prevents reload loops)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/" || url.pathname.endsWith("index.html")) {
    return event.respondWith(fetch(event.request));
  }

  // Don't cache SSE or WebSocket requests
  if (url.pathname.includes("/chat/stream") || url.protocol.startsWith("ws")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
    )
  );
});