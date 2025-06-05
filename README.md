# Aprendendo a Configurar um PWA

Um Progressive Web App (PWA) é uma aplicação web que utiliza tecnologias modernas para oferecer uma experiência similar à de um aplicativo nativo. PWAs combinam o melhor da web e dos aplicativos móveis, proporcionando uma experiência rápida, confiável e envolvente para os usuários.

## Características de um PWA

- Responsivo: Funciona em qualquer dispositivo, seja desktop, tablet ou smartphone.
- Confiável: Carrega instantaneamente, mesmo em condições de rede instáveis, graças ao uso de service workers.
- Engajador: Oferece uma experiência imersiva, com suporte a notificações push e a capacidade de ser adicionado à tela inicial do dispositivo.

## Tecnologias Utilizadas

- Service Workers: Scripts que rodam em segundo plano e permitem funcionalidades como cache offline, notificações push e sincronização em segundo plano.
- Manifest: Um arquivo JSON que define como o PWA deve ser exibido ao usuário, incluindo ícones, nome, descrição e tema.
- HTTPS: PWAs devem ser servidos via HTTPS para garantir a segurança dos dados e a integridade da aplicação.

## Vantagens dos PWAs

- Desempenho: PWAs são rápidos e responsivos, proporcionando uma experiência de usuário fluida.
- Offline: Graças ao cache offline, os usuários podem acessar o PWA mesmo sem conexão à internet.
- Instalação: PWAs podem ser instalados diretamente da web, sem a necessidade de passar por uma loja de aplicativos.
- Atualizações: As atualizações são automáticas e transparentes para o usuário.

## Exemplos de PWAs

- Twitter Lite: Uma versão leve do Twitter que oferece uma experiência rápida e responsiva.
- Pinterest: A PWA do Pinterest oferece uma experiência de usuário rica e envolvente.
- Uber: A PWA da Uber permite que os usuários solicitem corridas mesmo em condições de rede instáveis.

## **Guia Passo a Passo: Configurando um PWA com Vite + React + TypeScript**

### **Pré-requisitos**

1. Node.js instalado (versão 16 ou superior).
2. Um projeto React com Vite e TypeScript. Se ainda não tem, siga o passo 1.
3. Uma API `em node de preferência`

---

### **Passo 1: Criar um Projeto React com Vite e TypeScript**

Se você já tem um projeto, pule para o **Passo 2**.

1. Abra o terminal e execute o seguinte comando para criar um novo projeto:

   ```bash
   npm create vite@latest frontend --template react-ts
   ```

2. Navegue até a pasta do projeto:

   ```bash
   cd frontend
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie o servidor de desenvolvimento para verificar se tudo está funcionando:

   ```bash
   npm run dev
   ```

   Acesse `http://localhost:5173` no navegador. Se a página do React aparecer, seu projeto está pronto!

---

### **Passo 2: Instalar o Plugin `vite-plugin-pwa`**

O `vite-plugin-pwa` é a ferramenta que vai transformar sua aplicação em um PWA.

1. No terminal, instale o plugin:

   ```bash
   npm install vite-plugin-pwa --save-dev
   ```

---

### **Passo 3: Configure o Vite**

No seu arquivo `vite.config.ts`, adicione este conteúdo, onde os metadados do `manifest` são a seu critério

```ts
// filepath: /home/mauriciobenjamin700/projects/my/learning/pwa-learning/react-vite/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    open: true,
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Meu App PWA',
        description: 'Um aplicativo incrível feito com React e Vite',
        lang: 'pt-BR',
        short_name: 'Meu App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#053fb4',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    })
  ],
});
```
Crie um arquivo chamado **vite-env.d.ts** na raiz do seu projeto (ou em src):

```ts
declare module 'virtual:pwa-register' {
  export function registerSW(options?: any): any;
}
```

### **Passo 4: Configure funções para ativar o service worker e as notificações**

Crie uma pasta chamada `workers` no seu projeto e adicione o seguinte conteúdo nela, onde lembre-se de configurar corretamente para o seu problema as variáveis `VAPID_PUBLIC_KEY` e `API_URL`

```ts
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
```

e no seu arquivo ``main.tsx`, lembre-se de adicionar o import e chamada da função **registerSW**

```ts
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux';
import { store } from './store';
import registerSW from "@/workers";

registerSW();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)

```

Para finalizar, vamos configurar nosso arquivo `sw.js` dentro da nossa pasta ``public`, onde teremos este conteúdo:

```js
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
```

### **Passo 5: Build do Frontend**

Usaremos um script do makefile para testar nosso pwa.

```bash
start:
  @npm run build
  @cp public/sw.js dist/sw.js
  @npm run preview
```

Use o comando ``make start` para iniciar o Frontend

## **Guia Passo a Passo:  Configurando o Backend para enviar as notificações

Crie uma pasta para o backend e instale as dependências:

```bash
mkdir backend
cd backend
npm init -y
npm install express cors web-push body-parser dotenv sqlite3
```

Configure as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

Crie um arquivo `.env`:

```env
VAPID_PUBLIC_KEY="sua_chave_publica"
VAPID_PRIVATE_KEY="sua_chave_privada"
VAPID_EMAIL="seu@email.com"
```

Crie o banco de dados SQLite (`db.js`):

```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('subscriptions.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE,
    keys TEXT
  )`);
});

module.exports = db;
```

Configure o servidor Express (`index.js`):

```javascript
require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Endpoint para subscrição
app.post('/api/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  db.run(
    `INSERT INTO subscriptions (endpoint, keys) VALUES (?, ?)`,
    [endpoint, JSON.stringify(keys)],
    (err) => {
      if (err) {
        res.status(500).json({ error: 'Erro ao salvar inscrição' });
      } else {
        res.status(201).json({ message: 'Inscrito com sucesso!' });
      }
    }
  );
});

// Endpoint para enviar notificações
app.post('/api/notify', async (req, res) => {
  const payload = JSON.stringify({
    notification: {
      title: req.body.title || 'Notificação',
      body: req.body.message || 'Nova mensagem!',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'explore',
          title: 'Ver mais'
        }
      ]
    }
  });

  try {
    const subscriptions = await db.all('SELECT endpoint, keys FROM subscriptions');
    const results = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys)
        }, payload);
      } catch (error) {
        if (error.statusCode === 410) {
          await db.run('DELETE FROM subscriptions WHERE endpoint = ?', [sub.endpoint]);
        }
      }
    }
    res.json({ message: 'Notificações enviadas' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar notificações' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));
```

Agora o backend oferece rotas para cadastrar o usuário para as notificações e o envio das notificações

## Opções de Notificação Push

Aqui está um exemplo completo de payload para notificações push com todas as opções disponíveis:

```javascript
const payload = JSON.stringify({
  notification: {
    // Propriedades Básicas
    title: "Título da Notificação",     // Título em negrito
    body: "Texto da notificação",       // Corpo da mensagem
    
    // Recursos Visuais
    icon: "/path/to/icon.png",         // Ícone principal (92x92px recomendado)
    badge: "/path/to/badge.png",       // Badge para Android (24x24px)
    image: "/path/to/large-image.jpg", // Imagem grande (Chrome)
    
    // Comportamento
    vibrate: [100, 50, 100],          // Padrão de vibração [vibrar, pausa, vibrar]
    sound: "/path/to/sound.mp3",      // Som personalizado
    tag: "message-group-1",           // ID para agrupar notificações similares
    priority: 1,                      // Prioridade (-2 a 2, 0 é default)
    timestamp: Date.now(),            // Momento da criação
    
    // Ações Interativas
    actions: [
      {
        action: "reply",              // ID único da ação
        title: "Responder",           // Texto do botão
        icon: "/icons/reply.png",     // Ícone do botão (opcional)
        type: "text",                 // Tipo de interação
        placeholder: "Digite aqui"     // Placeholder para input
      },
      {
        action: "close",
        title: "Fechar"
      }
    ],
    
    // Dados Personalizados
    data: {
      url: "https://meusite.com/destino",
      id: "123",
      customData: "qualquer dado"
    },
    
    // Configurações de Texto
    dir: "auto",                      // Direção do texto (ltr, rtl, auto)
    lang: "pt-BR",                    // Idioma
    
    // Configurações Avançadas
    requireInteraction: true,         // Mantém até o usuário interagir
    renotify: false,                  // Reordena notificações do mesmo tipo
    silent: false                     // Notificação silenciosa
  }
});
```

### Detalhamento das Opções

#### Propriedades Básicas

- `title`: Título principal da notificação
- `body`: Texto do corpo da notificação

#### Recursos Visuais

- `icon`: Ícone principal (92x92px recomendado)
- `badge`: Ícone menor para Android (24x24px)
- `image`: Imagem grande (suporte apenas Chrome)

#### Comportamento

- `vibrate`: Array com padrão de vibração em millisegundos
- `sound`: Caminho para arquivo de som
- `tag`: Identificador para agrupar notificações
- `priority`: Nível de prioridade (-2 a 2)
- `timestamp`: Momento de criação da notificação

#### Ações Interativas

```javascript
actions: [{
  action: "ID_ÚNICO",      // Identificador da ação
  title: "Texto Botão",    // Texto exibido
  icon: "caminho/icone",   // Ícone opcional
  type: "text",            // Tipo de interação
  placeholder: "Digite..." // Para inputs de texto
}]
```

#### Dados Personalizados

```javascript
data: {
  // Qualquer dado que queira passar
  url: "https://...",
  id: "123",
  customData: "valor"
}
```

#### Configurações de Texto

- `dir`: Direção do texto
  - `ltr`: Esquerda para direita
  - `rtl`: Direita para esquerda
  - `auto`: Automático
- `lang`: Código do idioma (ex: "pt-BR")

#### Configurações Avançadas

- `requireInteraction`: Se true, a notificação permanece até interação
- `renotify`: Se true, notifica mesmo com tag existente
- `silent`: Se true, não emite som ou vibração

### Compatibilidade

Nem todas as opções são suportadas em todos os navegadores/dispositivos:

- Android: Suporta a maioria das opções
- iOS: Suporte limitado a notificações básicas
- Desktop: Suporte variável dependendo do navegador

### Boas Práticas

1. Sempre forneça `title` e `body`
2. Use `icon` para melhor identificação visual
3. Mantenha `actions` simples e diretas
4. Use `tag` para evitar spam de notificações
5. Configure `requireInteraction` com moderação
