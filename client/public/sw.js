/* eslint-env serviceworker */
/* global self, caches, clients, URL */
/* eslint no-unused-vars: "off" */
// @ts-nocheck
// Anamnesis Medical AI Assistant - Service Worker
// Version 1.0.0

const CACHE_NAME = 'anamnesis-v2.1.1';
const STATIC_CACHE = 'anamnesis-static-v1.0.0';
const DYNAMIC_CACHE = 'anamnesis-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/chat',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/',
  '/auth/'
];

// Install event - cache static assets
self.addEventListener('install', (/** @type {InstallEvent} */ event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (/** @type {ActivateEvent} */ event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName.startsWith('anamnesis-');
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // CRITICAL: Skip Service Worker for SSE streaming endpoints
  // This prevents SW from buffering streaming responses and delaying abort signals
  if (url.pathname.includes('/chat/stream') || 
      request.headers.get('Accept') === 'text/event-stream') {
    return; // Let browser handle SSE directly for instant Stop AI
  }

  // API endpoints - Network first, fallback to cache
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, fallback to network
  if (STATIC_ASSETS.includes(url.pathname) || 
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/screenshots/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Other requests - Network first for fresh content
  event.respondWith(networkFirstStrategy(request));
});

// Network-first strategy (for API calls and dynamic content)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses (but not error responses)
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request and we don't have a cached version,
    // return the cached index page (for SPA routing)
    if (request.mode === 'navigate') {
      const indexResponse = await caches.match('/');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    throw error;
  }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch and cache:', request.url, error);
    throw error;
  }
}

// Background sync for offline message queue (future enhancement)
self.addEventListener('sync', (/** @type {SyncEvent} */ event) => {
  if (event.tag === 'background-message-sync') {
    console.log('[SW] Background sync triggered for messages');
    // Future: Implement message queue sync when back online
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (/** @type {PushEvent} */ event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);
    
    const options = {
      body: data.body || 'New medical AI response available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'anamnesis-notification',
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View Response',
          icon: '/icons/icon-96x96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Anamnesis', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (/** @type {NotificationEvent} */ event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/chat')
    );
  }
});