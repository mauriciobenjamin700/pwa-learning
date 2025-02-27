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

---

### **Passo 1: Criar um Projeto React com Vite e TypeScript**

Se você já tem um projeto, pule para o **Passo 2**.

1. Abra o terminal e execute o seguinte comando para criar um novo projeto:

   ```bash
   npm create vite@latest meu-pwa --template react-ts
   ```

2. Navegue até a pasta do projeto:

   ```bash
   cd meu-pwa
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

### **Passo 3: Configurar o `vite.config.ts`**

Agora, vamos configurar o plugin no arquivo `vite.config.ts`.

1. Abra o arquivo `vite.config.ts` e adicione a configuração do PWA:

    ```typescript
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
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Separa bibliotecas grandes em chunks separados
              react: ['react', 'react-dom'],
              vendor: ['lodash', 'axios'],
            },
          },
        },
        chunkSizeWarningLimit: 1000, // Aumenta o limite de aviso para 1000 KB
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate', // Atualiza o service worker automaticamente
          includeAssets: ['**/*.{js,css,html,ico,png,svg}'], // Inclui todos os arquivos CSS, JS, ícones, etc.
          manifest: {
            name: 'NOME_DO_SEU_PWA',
            short_name: 'APELIDO DO SEU PWA',
            description: 'DESCRIÇÃO DO SEU PWA',
            theme_color: '#ffffff',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Aumenta o limite para 5 MB

            globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Cache de arquivos CSS, JS, ícones, etc.
            runtimeCaching: [
              {
                urlPattern: /\.(css|js)$/, // Cache de CSS e JS
                handler: 'StaleWhileRevalidate', // Usa a versão em cache, mas busca atualizações
                options: {
                  cacheName: 'assets-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
                  },
                },
              },
              {
                urlPattern: /^https:\/\/api\.seusite\.com\/.*/, // Cache de APIs externas (opcional)
                handler: 'NetworkFirst', // Prioriza a rede, mas usa o cache se offline
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24, // 1 dia
                  },
                },
              },
            ],
          },
          devOptions: {
            enabled: false, // Desabilita o PWA no modo de desenvolvimento
          },
        }),
      ],
    });
    ```

2. Salve o arquivo.

---

### **Passo 4: Adicionar Ícones e Manifest**

Para que o PWA funcione corretamente, você precisa adicionar ícones e um arquivo `manifest.json`.

1. Crie uma pasta chamada `public` na raiz do projeto (se ainda não existir).
2. Adicione os ícones na pasta `public`:
   - `pwa-192x192.png` (192x192 pixels)
   - `pwa-512x512.png` (512x512 pixels)
   - `apple-touch-icon.png`
   - `favicon.ico`

   Você pode gerar esses ícones usando ferramentas como [favicon.inbrowser.app](https://favicon.inbrowser.app/tools/favicon-generator).

---

### **Passo 5: Configurar o `index.html`**

Agora, vamos configurar o arquivo `index.html` para carregar o `manifest.json` e outros metadados do PWA.

1. Abra o arquivo `index.html` na raiz do projeto e adicione o seguinte código dentro da tag `<head>`:

   ```html
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="description" content="Meu PWA incrível" />
   ```

   Seu `index.html` deve ficar assim:

   ```html
   <!DOCTYPE html>
   <html lang="pt-BR">
     <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#ffffff" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="description" content="Meu PWA incrível" />
      <title>Meu PWA</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

---

### **Passo 6: Testar o PWA**

Agora que tudo está configurado, vamos testar o PWA.

1. Execute o projeto em modo de pre-visualização:

   ```bash
   npm run build
   npm run preview
   ```

2. Abra o navegador e acesse `http://localhost:5173`.
3. Abra as ferramentas de desenvolvedor (F12) e vá para a aba **Application**.
4. Verifique se o `manifest.json` está sendo carregado corretamente em **Manifest**.
5. Verifique se o service worker está registrado em **Service Workers**.

---

### **Passo 7: Adicionar um Botão de Instalação (Opcional)**

Para permitir que os usuários instalem o PWA, você pode adicionar um botão de instalação. Crie um componente `InstallButton.tsx`:

```tsx
import { useEffect, useState } from 'react';

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou a instalação');
        } else {
          console.log('Usuário recusou a instalação');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <button onClick={handleInstallClick} disabled={!deferredPrompt}>
      Instalar App
    </button>
  );
}

export default InstallButton;
```

Adicione o componente em sua aplicação para permitir a instalação.

---

### **Passo 9: Publicar o PWA**

Quando estiver pronto, publique seu PWA em um servidor que suporte HTTPS (obrigatório para PWAs). Serviços como Vercel, Netlify ou GitHub Pages são ótimas opções.

---

## Novos Projetos

- [Offline Mode](./modules/offline-mode/)
- [Push Notifications](./modules/push-notification/)

## Referencias

- [vite pwa](https://vite-pwa-org.netlify.app/guide/)
- [web.dev](https://web.dev/learn/pwa/welcome?hl=pt-br)
- [Mozilla push notification](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Re-engageable_Notifications_Push)