import { registerSW } from 'virtual:pwa-register';

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
  // Você pode chamar updateSW() se quiser forçar a atualização manualmente
  updateSW();
}

// Pode ser em um componente React
export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Seu navegador não suporta notificações push.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Permissão de notificação negada!');
    return;
  }

  console.log('Permissão de notificação concedida!');

  const registration = await navigator.serviceWorker.ready;
  console.log('Service Worker registrado:', registration);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'BAYnAICy5lO23CfhY-rhD7C_gdfIq4W9tkCbzfiaO-iIiJmNQfQfL77KuoH5vaD5VBA3SyiXIcb0g-icgB90IzQ' // TODO: Substitua pela sua chave pública VAPID USANDO DOTENV
  });
  console.log("VOu fazer a request")
  // Envie subscription para seu backend via fetch/AJAX
  const response = await fetch('http://localhost:3001/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
  alert('Inscrito para notificações!');
  console.log('Inscrição enviada ao servidor:', response);
}


export async function listenNotifies() {
  if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUSH_MESSAGE') {
      alert(event.data.message);
    }
  });
}
}