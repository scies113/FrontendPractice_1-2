//КОНФИГ
const CACHE_NAME = 'notes-app-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json'
];

//УСТАНОВКА (КЭШИРОВАНИЕ СТАТИЧЕСКИХ РЕСУРСОВ)
self.addEventListener('install', (event) => {
  console.log('[SW] Установка...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование файлов:', ASSETS_TO_CACHE);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Пропускаем ожидание активации');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Ошибка кэширования:', err);
      })
  );
});

//АКТИВАЦИЯ: ОЧИСТКА СТАРЫХ КЭШЕЙ
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Удаление старого кэша:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Захват клиентов');
        return self.clients.claim();
      })
  );
});

//ПЕРЕХВАТ ЗАПРОСОВ
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Из кэша:', event.request.url);
          return cachedResponse;
        }
        
        console.log('[SW] Из сети:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch((err) => {
            console.error('[SW] Ошибка сети:', err);
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});