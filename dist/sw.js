self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || 'Wersee Chats';
  const options = {
    body: payload.body || 'You received a new chat message.',
    icon: payload.icon || '/brand/wersee-icon-192.png',
    badge: payload.badge || '/favicon-48x48.png',
    tag: payload.tag || 'wersee-chat',
    renotify: true,
    data: {
      url: payload.url || '/workspace/chats',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || '/workspace/chats';
  const urlToOpen = new URL(requestedUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      const existingClient = windowClients.find((client) => {
        const current = new URL(client.url);
        const target = new URL(urlToOpen);
        return current.origin === target.origin;
      });

      if (existingClient) {
        await existingClient.navigate(urlToOpen);
        return existingClient.focus();
      }
      return self.clients.openWindow(urlToOpen);
    }),
  );
});
