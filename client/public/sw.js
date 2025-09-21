/* global self, caches */
// Cache names for different types of resources  
const CACHE_NAME = 'anamnesis-v2.3.0-cleanup-fix';
// Critical assets to cache
const CRITICAL_ASSETS = ["/", "/index.html"];
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