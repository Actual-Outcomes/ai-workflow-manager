import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@core': path.resolve(__dirname, './src/core')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
})

