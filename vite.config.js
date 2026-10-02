import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/signal': {
        target: 'ws://localhost:8787',
        ws: true,
      },
      '/api': 'http://localhost:8787',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
