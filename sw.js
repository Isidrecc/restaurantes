// Consulta sin cobertura (docs/diseno.md, sección 10, parte 5b): guarda en el teléfono los archivos de la app
// para que se abra sin conexión. Los datos ya los guarda Firestore en su propia caché (app/store.js).
// tools/build-site.mjs pone la versión y la lista de archivos al publicar. En local se queda en «dev» y todo
// se pide primero a la red, así que no estorba al trabajar.
const VERSION = 'dev';
const PRECACHE = [];
const CACHE = 'puntuam-' + VERSION;
const SCOPE = new URL('./', self.location).href;
const SDK = 'https://www.gstatic.com/firebasejs/';

// Al instalar, se guardan los archivos de esta versión. Uno que falle no impide el resto: se completará al usarlo.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

// Al activar, se borran las copias de versiones anteriores.
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('puntuam-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function save(key, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(key, copy));
  }
  return res;
}

// Primero la red; sin red, la copia.
function networkFirst(req, key) {
  return fetch(req).then((res) => save(key, res)).catch(() => caches.match(key).then((hit) => hit || Response.error()));
}

// Primero la copia; si no la hay, la red. Para archivos que no cambian nunca (llevan la versión en la dirección).
function cacheFirst(req) {
  return caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // La página de la app (con cualquier ?r= o ?muestra): siempre primero la red, para que las versiones nuevas
  // lleguen como hasta ahora. Las páginas de compartir (f/<id>/) no se tocan.
  if (req.mode === 'navigate') {
    if (url.href.split(/[?#]/)[0] === SCOPE || url.href.split(/[?#]/)[0] === SCOPE + 'index.html') {
      e.respondWith(networkFirst(req, SCOPE));
    }
    return;
  }
  // Firebase: la versión va en la dirección.
  if (url.href.startsWith(SDK)) { e.respondWith(cacheFirst(req)); return; }
  // Archivos de la app.
  if (url.origin === self.location.origin && url.href.startsWith(SCOPE)) {
    if (url.searchParams.has('v')) e.respondWith(cacheFirst(req));
    else e.respondWith(networkFirst(req, req));
  }
  // Lo demás (Google Maps, Firestore, Storage) va directo a la red.
});
