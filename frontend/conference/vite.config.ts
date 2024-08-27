import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),basicSsl()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080/api',
      '/socket': "ws://localhost:8080"
      // '/socket': "wss://conference.fly.dev"
    },
  },
})
