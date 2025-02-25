# Aprendendo a Configurar um PWA No React

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
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import { VitePWA } from 'vite-plugin-pwa';

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate', // Atualiza o service worker automaticamente
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

   Você pode gerar esses ícones usando ferramentas como [favicon.inbrowser.app](https://favicon.inbrowser.app/tools/favicon-generator).

3. Crie um arquivo `manifest.json` na pasta `public` com o seguinte conteúdo:

```json
{
  "name": "My First App",
  "short_name": "My App",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "description": "My App, Venha Conhecer!"
}
```

---

### **Passo 5: Configurar o `index.html`**

Agora, vamos configurar o arquivo `index.html` para carregar o `manifest.json` e outros metadados do PWA.

1. Abra o arquivo `index.html` na raiz do projeto e adicione o seguinte código dentro da tag `<head>`:

   ```html
   <link rel="manifest" href="/manifest.json" />
   <meta name="theme-color" content="#ffffff" />
   <link rel="icon" href="/favicon.ico" />
   <link rel="apple-touch-icon" href="/icon-192x192.png" />
   ```

   Seu `index.html` deve ficar assim:

   ```html
   <!DOCTYPE html>
   <html lang="pt-BR">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <meta name="description" content="Meu PWA incrível" />
       <link rel="manifest" href="/manifest.json" />
       <meta name="theme-color" content="#ffffff" />
       <link rel="icon" href="/favicon.ico" />
       <link rel="apple-touch-icon" href="/icon-192x192.png" />
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

1. Execute o projeto em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

2. Abra o navegador e acesse `http://localhost:5173`.
3. Abra as ferramentas de desenvolvedor (F12) e vá para a aba **Application**.
4. Verifique se o `manifest.json` está sendo carregado corretamente em **Manifest**.
5. Verifique se o service worker está registrado em **Service Workers**.

---

### **Passo 7: Build e Preview**

Para testar o PWA em um ambiente de produção:

1. Gere o build de produção:

   ```bash
   npm run build
   ```

2. Execute o servidor de preview:

   ```bash
   npm run preview
   ```

3. Acesse `http://localhost:4173` e verifique se o PWA está funcionando corretamente.

---

### **Passo 8: Adicionar um Botão de Instalação (Opcional)**

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

## Referencias

- [vite pwa](https://vite-pwa-org.netlify.app/guide/)
