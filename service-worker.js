const CACHE = "bigtree-pocket-till-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
  "/src/css/style.css",
  "/src/js/app.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
