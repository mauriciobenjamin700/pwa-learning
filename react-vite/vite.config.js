import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
    preview: {
        port: 3000,
        host: true,
        strictPort: true,
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Meu App PWA', // NOME DO APLICATIVO
                description: 'Um aplicativo incrível feito com React e Vite',
                lang: 'pt-BR', // LINGUAGEM DO APLICATIVO
                short_name: 'Meu App', // NOME QUE APARECE NO MENU DO CELULAR
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
            }
        })
    ],
});
