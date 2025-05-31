import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true, // Permite que o Vite sirva o aplicativo em qualquer endereço IP
    strictPort: true, // Garante que o Vite use a porta especificada (3000) e não tente outra porta se essa estiver ocupada
    open: true, // Abre o navegador automaticamente quando o servidor é iniciado
    allowedHosts: true, // Permite que o Vite sirva o aplicativo em qualquer host
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o service worker automaticamente
    }),
  ],
});
