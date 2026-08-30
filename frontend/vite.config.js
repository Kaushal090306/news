import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/news-sitemap.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/sitemap.xml': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/robots.txt': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
