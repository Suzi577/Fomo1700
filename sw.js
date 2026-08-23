
// FOMO Push Notifications Service Worker
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FOMO Gqeberha - New Events!';
  const options = {
    body: data.body || '🎉 New events in Gqeberha!',
    icon: '/icon.png',
    badge: '/badge.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
