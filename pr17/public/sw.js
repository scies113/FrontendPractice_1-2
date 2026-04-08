//КОНФИГУРАЦИЯ
const CACHE_NAME = 'notes-cache-v5';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v3';

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

//УСТАНОВКА
self.addEventListener('install', (event) => {
  console.log('[SW] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

//АКТИВАЦИЯ
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

//ПЕРЕХВАТ ЗАПРОСОВ
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return networkRes;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/content/home.html')))
    );
    return;
  }

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

//PUSH-УВЕДОМЛЕНИЯ С КНОПКАМИ
self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Новое уведомление', body: event.data.text(), reminderId: null };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/favicon-128x128.png',
    badge: '/icons/favicon-48x48.png',
    data: { reminderId: data.reminderId }
  };

  //если это напоминание — добавляем кнопку «Отложить»
  if (data.reminderId) {
    options.actions = [
      { action: 'snooze', title: '⏰ Отложить на 1 минуту' }
    ];
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

//КЛИК ПО УВЕДОМЛЕНИЮ
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'snooze') {
    //отложить напоминание на 5 минут
    const reminderId = notification.data.reminderId;
    console.log('[SW] Snooze для напоминания:', reminderId);

    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(() => {
          notification.close();
          console.log('[SW] Напоминание отложено');
        })
        .catch(err => {
          console.error('[SW] Ошибка snooze:', err);
          notification.close();
        })
    );
  } else {
    //обычный клик — открыть приложение
    notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});
