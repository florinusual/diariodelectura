/* Service worker del Diario de Lectura: guarda la app para abrirla sin conexión. */
var VERSION = "diario-v4";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];
var FONTS = "diario-fonts";

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request, url = new URL(req.url);
  if (req.method !== "GET") return;

  // Páginas: primero la red (para recibir actualizaciones), si no hay conexión, la copia guardada.
  if (req.mode === "navigate") {
    ev.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put("index.html", copy); });
      return res;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }

  // Tipografías de Google: de la caché, y se refrescan en segundo plano.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    ev.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  // Archivos propios de la app: de la caché, si no, de la red.
  if (url.origin === self.location.origin) {
    ev.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
  }
});
