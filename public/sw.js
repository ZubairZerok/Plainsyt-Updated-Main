// PLAiNSYT kill-switch service worker. The site no longer registers a service worker; this file stays
// deployed so browsers that still have an old one installed fetch it, clear caches and unregister.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept or cache requests — always fetch from network
  return;
});
