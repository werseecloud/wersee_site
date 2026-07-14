importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

let messaging = null;

const initializeFirebaseMessaging = (firebaseConfig) => {
  if (messaging || !firebaseConfig?.apiKey || !firebaseConfig?.projectId || !firebaseConfig?.appId) {
    return;
  }

  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || '',
      icon: '/vite.svg',
      data: {
        url: payload.data?.url || '/'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    initializeFirebaseMessaging(event.data.config);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
