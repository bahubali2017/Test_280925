/* global self, caches */
// Cache names for different types of resources  
const CACHE_NAME = 'anamnesis-hard-reload-' + Date.now();
// Critical assets to cache - DISABLED to prevent cache conflicts
const CRITICAL_ASSETS = [];
// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Pre-cache critical assets only
      try {
        await cache.addAll(CRITICAL_ASSETS);
        console.log('✅ Critical assets cached');
      } catch (error) {
        console.warn('⚠️ Failed to cache some assets:', error);
      }

      // Force immediate activation for cache fix
      self.skipWaiting();
    })()
  );
});