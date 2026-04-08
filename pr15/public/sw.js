// ===== КОНФИГУРАЦИЯ =====
const CACHE_NAME = 'notes-cache-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-48x48.png',
  '/icons/favicon-64x64.png',
  '/icons/favicon-128x128.png',
  '/icons/favicon-256x256.png',
  '/icons/favicon-512x512.png'
];

//УСТАНОВКА(КЭШИРОВАНИЕ СТАТИКИ)
self.addEventListener('install', (event) => {
  console.log('[SW] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Ошибка кэширования:', err))
  );
});

//АКТИВАЦИЯ(ОЧИСТКА СТАРЫХ КЭШЕЙ)
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация...');
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.method !== 'GET') return;

  //динамический контент
  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return networkRes;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/content/home.html'))
        )
    );
    return;
  }

  //Cache First
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return networkRes;
          });
      })
  );
});
