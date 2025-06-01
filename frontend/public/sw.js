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

self.addEventListener('activate', async (event) => {
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const response = await saveSubscription(subscription);
    console.log(response);
});

self.addEventListener('push', (event) => {
  console.log("Entrei no push")
  const title = event.data?.text() || 'Notificação';
  console.log('Título da notificação:', title);
  const data = event.data?.json(); // Parse o payload como JSON
  console.log('Push recebido:', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/icon.png', // Opcional: ícone padrão
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});