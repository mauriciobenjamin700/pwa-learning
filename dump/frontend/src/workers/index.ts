import { registerSW } from 'virtual:pwa-register';

const VAPID_PUBLIC_KEY = "BAYnAICy5lO23CfhY-rhD7C_gdfIq4W9tkCbzfiaO-iIiJmNQfQfL77KuoH5vaD5VBA3SyiXIcb0g-icgB90IzQ"
const API_URL = 'http://localhost:3001/api/subscribe';

/**
 * Registra o Service Worker e define o comportamento
 * quando uma nova versão está disponível.
 * @returns {void}
 */
const updateSW = registerSW({
  onNeedRefresh() {
    alert('Uma nova versão está disponível! Recarregando...');
    window.location.reload();
  },
  onOfflineReady() {
    console.log('App pronto para uso offline!');
  },
});

export default function registerServiceWorker() {
  updateSW();
}

/**
 * Converte uma string base64 em um array de bytes
 * para ser usado como chave pública VAPID.
 * @param base64String String base64 da chave pública VAPID
 * @returns {Uint8Array} Array de bytes correspondente
 */
function urlBase64ToUint8Array(base64String: string) : Uint8Array {
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

/**
 * Solicita permissão para enviar notificações ao usuário
 * e registra o Service Worker para receber notificações push.
 * * @description Esta função verifica se o navegador suporta notificações e Service Workers.
 * Se suportado, solicita permissão ao usuário e, se concedida,
 * registra o Service Worker e se inscreve para receber notificações push.
 * Em seguida, envia a inscrição ao servidor para que possa enviar notificações push.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/pushManager
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/ready
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/pushManager/subscribe
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/applicationServerKey
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/endpoint
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/expirationTime
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/keys
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/p256dh
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscriptionJSON/auth
 * @returns {void}
 */
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

          fetch(API_URL, {
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