const CACHE_NAME = 'lambo-v1-cache';
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
        console.warn('[SW] Precache non-fatal error:', err);
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

// 3. Fetch Strategy: Network first for API, Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension / third-party analytics
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Network-only for API endpoints (offline queue handles API mutations)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Stale-While-Revalidate for app assets, Google Fonts, and images
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached response if network fails, or fallback to index.html for navigation
            if (cachedResponse) return cachedResponse;
            if (request.mode === 'navigate') {
              return cache.match('/index.html');
            }
          });

        return cachedResponse || fetchPromise;
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
