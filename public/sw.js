/* डीलक्स सैलून — offline shell. First online visit caches the app; later opens without net. */
const CACHE = "deluxe-salon-v1";

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/images/cards/01-old-barber-shop.webp",
  "/images/wallpapers/01-old-barber-shop.jpg",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

async function fromNetwork(request) {
  const response = await fetch(request);
  if (response.ok && request.method === "GET" && sameOrigin(new URL(request.url))) {
    const cache = await caches.open(CACHE);
    void cache.put(request, response.clone());
  }
  return response;
}

async function fromCache(request) {
  return caches.match(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache YouTube / third-party media APIs.
  if (!sameOrigin(url)) return;

  // HTML navigations: network first, then cached home, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fromNetwork(request)
        .catch(() => fromCache(request))
        .then((cached) => cached || caches.match("/"))
        .then((home) => home || caches.match("/offline.html")),
    );
    return;
  }

  // Static assets + Next bundles: cache first, then network (and store).
  event.respondWith(
    fromCache(request).then((cached) => {
      if (cached) {
        void fromNetwork(request).catch(() => null);
        return cached;
      }
      return fromNetwork(request).catch(() => caches.match("/offline.html"));
    }),
  );
});
