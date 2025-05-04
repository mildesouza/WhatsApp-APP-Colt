import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuração separada para content.js
const contentConfig = {
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      name: 'WhatsAppOrcamentos',
      fileName: 'content',
      formats: ['iife']
    },
    outDir: 'dist/js',
    emptyOutDir: false
  }
}

// Configuração principal
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: 'terser',
    target: 'es2018',
    terserOptions: {
      format: {
        comments: false
      },
      compress: {
        drop_console: false
      }
    },
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html')
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]'
          
          if (assetInfo.name === 'src/popup.html') {
            return '[name][extname]'
          }
          
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name][extname]`
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return `images/[name][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
}) 