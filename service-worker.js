// Identity Forge Service Worker
const CACHE_NAME = 'identity-forge-v3';
const scheduledNotifications = new Map();

// Install
self.addEventListener('install', (event) => {
  console.log('Identity Forge SW: Installing...');
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Identity Forge SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for notification scheduling from main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, notifyAt } = event.data;
    scheduleNotification(title, body, notifyAt);
  }
});

// Schedule a notification
function scheduleNotification(title, body, notifyAt) {
  const delay = notifyAt - Date.now();
  const notificationId = `${title}-${notifyAt}`;
  
  // Clear any existing timeout for this notification
  if (scheduledNotifications.has(notificationId)) {
    clearTimeout(scheduledNotifications.get(notificationId));
  }
  
  if (delay > 0) {
    const timeoutId = setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'identity-forge-reminder',
        requireInteraction: true, // Makes it stay until dismissed
        actions: [
          { action: 'open', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: { url: '/' }
      });
      scheduledNotifications.delete(notificationId);
    }, delay);
    
    scheduledNotifications.set(notificationId, timeoutId);
    console.log(`Notification scheduled for ${new Date(notifyAt).toLocaleString()}`);
  } else {
    // If time has passed, show immediately
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'identity-forge-reminder',
      requireInteraction: true,
      data: { url: '/' }
    });
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return; // Just close the notification
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to find and focus an existing window
        for (let client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle notification close (for analytics/tracking if needed)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Keep service worker alive
self.addEventListener('fetch', (event) => {
  // Pass through, don't cache for now
  event.respondWith(fetch(event.request));
});
