console.log('Service Worker iniciado');

/**
 * Service Worker para gerenciar notificações push e cache.
 * Este script registra o Service Worker, lida com eventos de push e notificação,
 * e garante que o Service Worker seja instalado e ativado corretamente.
*/
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    event.waitUntil(self.skipWaiting());
});

/**
 * Evento de ativação do Service Worker.
 * Garante que o Service Worker seja ativado imediatamente
 * e que os clientes sejam atualizados para usar a nova versão.
 * Isso é importante para garantir que as notificações push funcionem corretamente
 * e que o Service Worker esteja sempre atualizado.
 * @event activate
 * @description Este evento é disparado quando o Service Worker é ativado.
 * Ele chama `self.clients.claim()` para garantir que o Service Worker controle
 * todos os clientes imediatamente, sem esperar que eles sejam recarregados.
 * Isso é crucial para que as notificações push funcionem corretamente
 * e que o Service Worker esteja sempre atualizado.
 * @returns {Promise<void>} Retorna uma Promise que resolve quando o Service Worker é ativado.
 * @throws {Error} Lança um erro se houver problemas ao ativar o Service Worker.
 */
self.addEventListener('activate', async (event) => {
    event.waitUntil(
        (async () => {
            try {
                await self.clients.claim();
                
            } catch (error) {
                console.error('Erro ao ativar service worker:', error);
            }
        })()
    );
});

/**
 * Evento de recebimento de push.
 * Este evento é disparado quando o Service Worker recebe uma notificação push.
 * Ele processa os dados do push e exibe uma notificação ao usuário.
 * @event push
 * @description Este evento é disparado quando o Service Worker recebe uma notificação push.
 * Ele processa os dados do push e exibe uma notificação ao usuário.
 * @returns {Promise<void>} Retorna uma Promise que resolve quando a notificação é exibida.
 * @throws {Error} Lança um erro se houver problemas ao processar os dados do push ou exibir a notificação.
 */
self.addEventListener('push', function(event) {
    event.waitUntil(
        (async () => {
            try {
                //console.log('Raw push data:', event.data?.text());
                
                if (!event.data) {
                    console.warn('Recebido push sem dados');
                    return;
                }

                const data = event.data.json();
                //console.log('Dados do push parseados:', data);
                
                const notificationData = data.notification;
                
                const options = {
                    body: notificationData.body,
                    icon: notificationData.icon,
                    badge: notificationData.badge,
                    vibrate: notificationData.vibrate,
                    data: notificationData.data,
                    actions: notificationData.actions
                };

                //console.log('Mostrando notificação com opções:', options);
                return self.registration.showNotification(notificationData.title || 'Notificação', options);
                
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

/**
 * Evento de clique na notificação.
 * Este evento é disparado quando o usuário clica em uma notificação.
 * Ele fecha a notificação e abre uma URL especificada nos dados da notificação.
 * @event notificationclick
 * @description Este evento é disparado quando o usuário clica em uma notificação.
 * Ele fecha a notificação e abre uma URL especificada nos dados da notificação.
 * @returns {Promise<void>} Retorna uma Promise que resolve quando a URL é aberta.
 * @throws {Error} Lança um erro se houver problemas ao abrir a URL ou fechar a notificação.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});