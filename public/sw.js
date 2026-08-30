// Lightweight PWA Service Worker (Network-only, no caching per configuration)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Network-only fetch handler (zero caching)
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
