/* Service worker del Diario de Lectura: guarda la app para abrirla sin conexión. */
var VERSION = "diario-v14";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];
var FONTS = "diario-fonts";
var PENDING = "diario-pending";

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== FONTS && k !== PENDING; }).map(function (k) { return caches.delete(k); }));
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

/* Cronómetro en la barra de notificaciones. La app manda el estado; aquí se dibuja y se atienden sus botones. */
function hhmm(ts) { return new Date(ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }); }
function mins(ms) { var m = Math.max(0, Math.round(ms / 60000)); return m < 1 ? "menos de 1 min" : m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min"; }
function drawTimer(d) {
  return self.registration.getNotifications({ tag: "timer" }).then(function (ns) {
    if (!d) { ns.forEach(function (n) { n.close(); }); return; }
    return self.registration.showNotification((d.run ? "Leyendo: " : "En pausa: ") + d.title, {
      tag: "timer",
      body: d.run ? "Empezaste a las " + hhmm(d.run) + (d.acc ? " (más " + mins(d.acc) + " de antes)" : "") + "." : "Llevas " + mins(d.acc) + " de lectura.",
      icon: "icons/icon-192.png",
      silent: true,
      renotify: false,
      requireInteraction: true,
      timestamp: d.run || Date.now(),
      data: d,
      actions: d.run ? [{ action: "pause", title: "Pausar" }, { action: "finish", title: "Terminar" }] : [{ action: "resume", title: "Continuar" }, { action: "finish", title: "Terminar" }]
    });
  }).catch(function () {});
}
function addPending(ev) {
  return caches.open(PENDING).then(function (c) {
    return c.match("pending").then(function (r) { return r ? r.json() : []; }).then(function (list) {
      list.push(ev);
      return c.put("pending", new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } }));
    });
  });
}

self.addEventListener("message", function (ev) {
  if (ev.data && ev.data.type === "timer-draw") ev.waitUntil(drawTimer(ev.data.data));
});

self.addEventListener("notificationclick", function (ev) {
  var n = ev.notification;
  if (n.tag !== "timer") return;
  var act = ev.action || "open", at = Date.now(), d = n.data || {}, msg = { type: "timer", action: act, at: at };
  if (act !== "pause" && act !== "resume") n.close();
  ev.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    var c = cs[0];
    if (act === "pause" || act === "resume") {
      // Se redibuja de inmediato y se anota la hora del toque por si la app no está abierta para recibirlo.
      var nd = { title: d.title, run: act === "resume" ? at : null, acc: act === "pause" && d.run ? (d.acc || 0) + (at - d.run) : (d.acc || 0) };
      if (c) c.postMessage(msg);
      return addPending(msg).then(function () { return drawTimer(nd); });
    }
    if (c) { c.postMessage(msg); return c.focus ? c.focus() : null; }
    return addPending(msg).then(function () { return self.clients.openWindow("./?leer=1"); });
  }));
});
