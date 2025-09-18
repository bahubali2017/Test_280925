// Cache names for different types of resources  
const CACHE_NAME = 'anamnesis-v2.2.0';
const STATIC_CACHE = 'anamnesis-static-v1.1.0';
const DYNAMIC_CACHE = 'anamnesis-dynamic-v1.1.0';
// Cache version - increment when you want to force cache refresh
const CACHE_VERSION = 'v2025.1.18.2';
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

      // Don't skip waiting to prevent rapid updates
      // self.skipWaiting();
    })()
  );
});