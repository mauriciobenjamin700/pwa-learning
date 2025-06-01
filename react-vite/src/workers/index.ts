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

  // Solicitar permissão de notificação
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Permissão de notificações concedida.');

        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:VAPID_PUBLIC_KEY,
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