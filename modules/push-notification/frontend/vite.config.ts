import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  ],
});