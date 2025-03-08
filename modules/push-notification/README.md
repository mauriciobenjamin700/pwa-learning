# Enviando Notificações Na Web

Iremos precisar de um projeto para o frontend e outro para o backend

- Crie o backend usando `mkdir backend`
- Crie o frontend usando `npm create vite@latest frontend -- --template react-ts`

Configure seu frontend seguindo o guia principal clicando [aqui](../../README.md)

## Serviços

Iremos precisar configurar os seguintes serviços para conseguir a permissão do usuário e lançar as notificações que chegarem

```ts
// /src/services/notify/index.ts
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
```

```js
// /public/sw.js
const CACHE_NAME = 'assets-cache-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Padrões glob para arquivos que você deseja armazenar em cache
const GLOB_PATTERNS = [
  '/', // Página inicial
  '/index.html',
  '**/*.html', // Todos os arquivos HTML
  '**/*.css',  // Todos os arquivos CSS
  '**/*.js',   // Todos os arquivos JS
  '**/*.png',  // Todas as imagens PNG
  '**/*.jpg',  // Todas as imagens JPG
  '**/*.svg',  // Todas as imagens SVG
  '**/*.ico',  // Todos os ícones
];

const MAX_AGE_ASSETS = 60 * 60 * 24 * 30; // 30 dias em segundos
const MAX_AGE_API = 60 * 60 * 24; // 1 dia em segundos

// Função para buscar e armazenar em cache todos os arquivos que correspondem aos padrões glob
const cacheAllMatchingFiles = async () => {
  const cache = await caches.open(CACHE_NAME);

  // Busca todos os arquivos que correspondem aos padrões glob
  const allFiles = await Promise.all(
    GLOB_PATTERNS.map((pattern) => {
      return self.registration.scope + pattern;
    })
  );

  // Armazena os arquivos no cache
  await cache.addAll(allFiles);
  console.log('Todos os arquivos foram armazenados em cache.');
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado.');
  event.waitUntil(
    cacheAllMatchingFiles().then(() => {
      self.skipWaiting(); // Força o service worker a ativar imediatamente
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle de todas as páginas
});

// Estratégia de Cache para Arquivos Estáticos e APIs
self.addEventListener('fetch', (event) => {
  const apiUrlPattern = /^https:\/\/api\.seusite\.com\/.*/;

  // Cache de APIs
  if (apiUrlPattern.test(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Armazena a resposta no cache
          const responseClone = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Retorna o cache se a rede falhar
          return caches.match(event.request);
        })
    );
  } else {
    // Cache de Arquivos Estáticos
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Expiração do Cache
const cleanOldCache = async () => {
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = new Date(response.headers.get('date')).getTime();
        const currentTime = new Date().getTime();
        if (
          (cacheName === CACHE_NAME && currentTime - cacheTime > MAX_AGE_ASSETS * 1000) ||
          (cacheName === API_CACHE_NAME && currentTime - cacheTime > MAX_AGE_API * 1000)
        ) {
          await cache.delete(request);
        }
      }
    }
  }
};

// Limpa o cache periodicamente
setInterval(cleanOldCache, 60 * 60 * 1000); // Executa a cada hora

// Notificações Push
self.addEventListener('push', (event) => {
  console.log("Notificação recebida via WebPush: ", event.data)
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

// Clique em Notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Fecha a notificação
  event.waitUntil(
    clients.openWindow('https://github.com/mauriciobenjamin700') // Abre uma URL ao clicar na notificação
  );
});

// Mensagens do Frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    });
  }
});
```

```tsx
// /src/App.tsx
import { useEffect, useState } from 'react'
import './App.css'
import { getNotificationPermission, registerServiceWorker, sendNotification } from './services'

function App() {
  const [notifyState, setNotifyState] = useState("")

  useEffect(() => {
    const main = async () => {
      await registerServiceWorker()
      const permission = await getNotificationPermission()
      setNotifyState(permission)
    }
    main()
  },[])

  const handleNotify = async () => {
    alert("Notificação enviada!")
    await sendNotification("Título da Notificação", "Corpo da Notificação")
  }

  return (
    <div>
      <h1>As notificações estão: {notifyState}</h1>
      <button onClick={handleNotify}>Enviar Notificação</button>
    </div>
  )
}

export default App

```