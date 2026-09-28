/* Minimal service worker: enables installability without offline caching.
   Audio / API traffic stays on the network (no Cache Storage). */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Chromium requires a fetch handler for the install prompt / “Add to Home Screen”.
self.addEventListener('fetch', () => {})
