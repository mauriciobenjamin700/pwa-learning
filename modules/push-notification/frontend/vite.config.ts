import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
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
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        start_url: '/',
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
        cacheId: "1.0.0", // ID do cache
        clientsClaim: true, // Força o service worker a assumir o controle imediatamente
        skipWaiting: true, // Ignora a espera e ativa o novo service worker imediatamente
      },
      devOptions: {
        enabled: true, // Desabilita o PWA no modo de desenvolvimento
      },
    }),
  ],
});