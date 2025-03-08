/**
 * Função que verifica se o navegador suporta notificações
 * e solicita permissão para exibi-las
 * @returns 'default' se o navegador não suporta notificações
 * @returns 'granted' se o usuário permitiu as notificações
 * @returns 'denied' se o usuário negou as notificações
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  let permissions :NotificationPermission = 'denied';

  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações.');
    permissions = "denied";
  }

  else if ('Notification' in window && Notification.permission === 'default') {
      permissions = await Notification.requestPermission()
  }

  else {
    permissions = Notification.permission
  }

    return permissions;
}

export async function registerServiceWorker(){

  try{
    if ('serviceWorker' in navigator) {
      const service = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registrado com sucesso:', service.scope);
    }
    else{
      throw new Error('Service Worker não suportado');
    }
  } catch (error) {
    console.error('Falha ao registrar o Service Worker:', error);
  }
}

// export async function sendNotification(title: string, body: string) {

//   let registration = undefined

//   alert("entrei na linha 19")

//   registration = await navigator.serviceWorker.ready

//   alert("entrei na linha 26: " + registration.active)
  
//   registration?.active?.postMessage({
//     type: 'push',
//     data: {
//       title: title,
//       body: body,
//     }
//   });

//   alert("entrei na linha 36")

// }

export async function sendNotification(title: string, body: string) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
    });
  } else {
    console.warn('Service Worker não está pronto ou não suportado.');
  }
}

export async function subscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
  });

  // Enviar a assinatura para o servidor
  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}