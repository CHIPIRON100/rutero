// Service worker: permite instalar la app y abrirla aunque falle la red.
// Estrategia: red primero (así siempre ves la última versión que subas a GitHub)
// y, si no hay red, la copia guardada. Los servicios externos (mapas, rutas, búsqueda)
// no se guardan: pasan directos.
const VERSION = 'rutalibre-1.0.0';
const SHELL = [
  "./",
  "css/app.css",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "index.html",
  "js/core/bus.js",
  "js/core/config.js",
  "js/core/i18n.js",
  "js/core/providers.js",
  "js/core/store.js",
  "js/features/about.js",
  "js/features/compass.js",
  "js/features/index.js",
  "js/features/locate.js",
  "js/features/navigation.js",
  "js/features/place.js",
  "js/features/route.js",
  "js/features/search.js",
  "js/i18n/es.js",
  "js/lib/format.js",
  "js/lib/geo.js",
  "js/lib/maneuver.js",
  "js/lib/polyline.js",
  "js/lib/progress.js",
  "js/main.js",
  "js/providers/geocoding-photon.js",
  "js/providers/index.js",
  "js/providers/routing-valhalla.js",
  "js/ui/icons.js",
  "js/ui/ui.js",
  "lib/MAPLIBRE-LICENSE.txt",
  "lib/maplibre-gl.css",
  "lib/maplibre-gl.js",
  "manifest.webmanifest",
  "version.json"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))),
  );
});
