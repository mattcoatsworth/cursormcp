import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: 'VITE_',
  define: {
    'process.env': process.env
  },
  plugins: [react()],
  envDir: '.',
  server: {
    port: 5174,
    strictPort: true,
    host: true
  }
})
