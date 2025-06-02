// filepath: /home/mauriciobenjamin700/projects/my/learning/pwa-learning/react-vite/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
            strategies: 'generateSW', // Alterado para usar generateSW | injectManifest
            // srcDir: 'public',
            // filename: 'sw.js',
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
