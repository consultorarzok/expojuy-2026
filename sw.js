// Service worker de ExpoJuy 2026 — deja la app usable con mala señal (Ciudad Cultural, 200+ stands).
// Todas las pantallas (agenda, mapa, expositores) viven en index.html: cachearlo alcanza para navegar offline.
var CACHE_NAME = 'expojuy-2026-v2'; // v2: fix — v1 servía el HTML viejo de caché para siempre, ver estrategia abajo
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

// El HTML (navegación) va SIEMPRE a la red primero — el sitio cambia seguido y cache-first
// lo dejaba pegado a la primera versión que se haya cacheado, para siempre. El caché es
// solo el respaldo para cuando no hay señal.
// El resto (imágenes, manifest) sí va caché-primero — no cambian tan seguido y priorizar
// velocidad ahí no tiene el mismo riesgo de mostrar contenido viejo.
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var url = new URL(e.request.url);
  if(url.origin!==self.location.origin) return;

  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){ return cached || caches.match('./index.html'); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
