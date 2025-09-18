// Service Worker temporarily disabled to prevent reload loops
// This was causing infinite reloads due to immediate takeover
console.log('[SW] Service Worker disabled - using network-only mode');

// All fetch event handling disabled - using network-only mode