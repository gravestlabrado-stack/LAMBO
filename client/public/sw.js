const CACHE_NAME = 'lambo-v2-cache';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lambo-logo.svg',
  '/favicon.svg',
];

// 1. Install & Pre-cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate & clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Strategy: Network First for API, Cache-First for static assets, Fallback to index.html for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension / third-party analytics
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Skip Vite dev-server internals, HMR, and dynamic development modules
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // Network-only for API endpoints (offline queue handles offline data sync)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Navigation requests: Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const match =
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'));
          if (match) return match;
          return new Response('Offline: App shell not found in cache.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // Static Assets (fonts, CSS, JS bundles, images, icons): Cache First, then network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === 'image') {
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' },
            });
          }
          return new Response('Resource offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
    })
  );
});

// 4. Web Push Notification Event Handler
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'LAMBO Telemetry Alert', body: event.data.text() };
    }
  }

  const title = data.title || 'LAMBO Specimen Alert';
  const options = {
    body: data.body || 'You have a pending botanical care task.',
    icon: data.icon || '/lambo-logo.svg',
    badge: data.badge || '/lambo-logo.svg',
    data: {
      url: data.url || '/',
      treeId: data.treeId || null,
      timestamp: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Specimen' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
