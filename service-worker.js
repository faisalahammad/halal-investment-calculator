// Cache name - change version when updating the app
const CACHE_NAME = "halal-investment-calculator-v1";

// Files to cache
const filesToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/icons/favicon.png",
  "./assets/icons/icon-192x192.png",
  "./assets/icons/icon-512x512.png",
];

// Install event - caches the application files
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        return cache.addAll(filesToCache);
      })
      .catch((error) => {
        console.log("[ServiceWorker] Cache error:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log("[ServiceWorker] Removing old cache:", cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      }),
  );
});

// Fetch event - try from network first, fallback to cache, then to offline page
self.addEventListener("fetch", (event) => {
  console.log("[ServiceWorker] Fetch", event.request.url);

  // For navigation requests (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // If both network and cache fail, show offline page
          return caches.match("/offline.html");
        });
      }),
    );
    return;
  }

  // For other requests, use a "stale-while-revalidate" strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update the cache with the new response
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log("[ServiceWorker] Fetch failed:", error);
          });

        // Return the cached response immediately, or wait for network response
        return cachedResponse || fetchPromise;
      });
    }),
  );
});

// Handle offline form submissions by storing them for later
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-calculations") {
    event.waitUntil(syncCalculations());
  }
});

// Function to sync stored calculations when back online
function syncCalculations() {
  // This would send any stored calculations to a server
  // For this app, we just log that sync would happen
  console.log("[ServiceWorker] Syncing calculations would happen here");
  return Promise.resolve();
}
