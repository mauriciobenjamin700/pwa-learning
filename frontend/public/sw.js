// This line is required for workbox manifest injection
self.__WB_MANIFEST;

const VAPID_PUBLIC_KEY = "BAYnAICy5lO23CfhY-rhD7C_gdfIq4W9tkCbzfiaO-iIiJmNQfQfL77KuoH5vaD5VBA3SyiXIcb0g-icgB90IzQ"

console.log('Chave VAPID Pública:', VAPID_PUBLIC_KEY);

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

const saveSubscription = async (subscription) => {
    const response = await fetch('http://localhost:3001/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
    });

    return response.json();
};

console.log('Service Worker iniciado');

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', async (event) => {
    event.waitUntil(
        (async () => {
            try {
                const subscription = await self.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
                
                console.log('Nova subscription criada:', subscription);
                
                const response = await saveSubscription(subscription);
                console.log('Subscription salva no backend:', response);
                
                // Ativa o service worker imediatamente em todas as abas
                await self.clients.claim();
                
            } catch (error) {
                console.error('Erro ao ativar service worker:', error);
            }
        })()
    );
});

self.addEventListener('push', function(event) {
    event.waitUntil(
        (async () => {
            try {
                console.log('Raw push data:', event.data?.text());
                
                if (!event.data) {
                    console.warn('Recebido push sem dados');
                    return;
                }

                const data = event.data.json();
                console.log('Dados do push parseados:', data);

                const options = {
                    body: data.body || 'Sem mensagem',
                    icon: data.icon || '/icon-192x192.png',
                    badge: data.badge || '/icon-192x192.png',
                    vibrate: data.vibrate || [100, 50, 100],
                    data: {
                        ...data.data,
                        timestamp: Date.now()
                    },
                    actions: data.actions || [{
                        action: 'close',
                        title: 'Fechar'
                    }]
                };

                console.log('Mostrando notificação com opções:', options);
                return self.registration.showNotification(data.title || 'Notificação', options);
                
            } catch (error) {
                console.error('Erro ao processar push:', error);
                // Mostra uma notificação de fallback em caso de erro
                return self.registration.showNotification('Notificação', {
                    body: 'Recebemos uma atualização mas houve um erro ao processá-la.'
                });
            }
        })()
    );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});