// Service worker de ExpoJuy 2026 — deja la app usable con mala señal (Ciudad Cultural, 200+ stands).
// Todas las pantallas (agenda, mapa, expositores) viven en index.html: cachearlo alcanza para navegar offline.
var CACHE_NAME = 'expojuy-2026-v1';
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './images/expojuy-icon.png',
  './images/icon-192.png',
  './images/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(CORE_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Cache-first para lo propio del sitio (con estas pantallas son solo JS/CSS/imágenes del mismo documento);
// red directa para todo lo externo (fonts, etc.) sin interferir.
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var url = new URL(e.request.url);
  if(url.origin!==self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        if(e.request.mode==='navigate') return caches.match('./index.html');
      });
    })
  );
});
