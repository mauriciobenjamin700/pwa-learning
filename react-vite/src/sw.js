// @ts-nocheck

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({
          type: 'PUSH_MESSAGE',
          message: data.message || 'Nova notificação recebida!'
        });
      });
      return self.registration.showNotification('Notificação', {
        body: data.message || 'Nova notificação recebida!',
      });
    })
  );
});