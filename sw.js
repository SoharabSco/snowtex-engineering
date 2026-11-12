/* Snowtex Engineering - background helper (service worker)
   Keeps the front door (this small page + icons) on the phone, so the
   app opens fast and shows a friendly message when there is no internet.
   The real app (Google Apps Script) is always loaded fresh from Google. */

const CACHE = "snowtex-eng-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];

self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(CACHE).then(function(cache) { return cache.addAll(SHELL); }));
    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
        })
    );
    self.clients.claim();
});

// Only this site's own files: newest from the internet, the saved copy when offline
self.addEventListener("fetch", function(event) {
    const url = new URL(event.request.url);
    if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                const copy = response.clone();
                caches.open(CACHE).then(function(cache) { cache.put(event.request, copy); });
                return response;
            })
            .catch(function() {
                return caches.match(event.request, { ignoreSearch: true }).then(function(hit) { return hit || caches.match("./index.html"); });
            })
    );
});
