/**
 * Função que verifica se o navegador suporta notificações
 * e solicita permissão para exibi-las
 * @returns 'default' se o navegador não suporta notificações
 * @returns 'granted' se o usuário permitiu as notificações
 * @returns 'denied' se o usuário negou as notificações
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  let permissions :NotificationPermission = 'denied';

    if ('Notification' in window) {
        permissions = await Notification.requestPermission()
    }

    return permissions;
}

export async function sendNotification(title: string, body: string) {

  let registration = undefined

  alert("entrei na linha 19")

  registration = await navigator.serviceWorker.ready

  alert("entrei na linha 26: " + registration.active)
  
  registration?.active?.postMessage({
    type: 'push',
    data: {
      title: title,
      body: body,
    }
  });

  alert("entrei na linha 36")

}