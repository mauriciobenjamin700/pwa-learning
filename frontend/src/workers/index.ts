import { registerSW } from 'virtual:pwa-register';

 const VAPID_PUBLIC_KEY = "BAYnAICy5lO23CfhY-rhD7C_gdfIq4W9tkCbzfiaO-iIiJmNQfQfL77KuoH5vaD5VBA3SyiXIcb0g-icgB90IzQ"


const updateSW = registerSW({
  onNeedRefresh() {
    alert('Uma nova versão está disponível! Recarregando...');
    window.location.reload();
  },
  onOfflineReady() {
    alert('App pronto para uso offline!');
  },
});

export default function registerServiceWorker() {
  updateSW();
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const requestNotifyPermission = () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Permissão de notificações concedida.');

        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });

          // Enviar a inscrição ao servidor
          fetch('http://localhost:3001/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
          })
            .then((response) => {
              if (response.ok) {
                console.log('Inscrição salva com sucesso no servidor.');
              } else {
                console.error('Erro ao salvar inscrição no servidor.');
              }
            })
            .catch((error) => {
              console.error('Erro na requisição:', error);
            });
        });
      } else {
        console.warn('Permissão de notificações negada.');
      }
    });
  }
}