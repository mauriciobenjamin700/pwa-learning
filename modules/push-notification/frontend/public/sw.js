self.addEventListener('push', (event) => {
    const data = event.data?.json(); // Recebe os dados da notificação
    const title = data?.title || 'Nova notificação';
    const options = {
      body: data?.body || 'Você tem uma nova notificação!',
      icon: '/pwa-192x192.png', // Ícone da notificação
      badge: '/pwa-192x192.png', // Badge para dispositivos móveis
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
});

// Evento de aguardar a notificação ser jogada
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'push') {
    const { title, body } = event.data.data;
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });
  }
});