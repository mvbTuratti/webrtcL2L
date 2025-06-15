import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ }),basicSsl()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080/api',
      '/socket':{
        ws: true,
        target: "ws://localhost:4000",
      } 
      // '/socket': "wss://conference.fly.dev"
    },
  },
})
