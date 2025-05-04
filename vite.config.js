import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2018',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.html'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (['popup', 'content'].includes(chunkInfo.name)) {
            return 'js/[name].js'
          }
          return 'js/[name]-[hash].js'
        },
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]'
          
          if (assetInfo.name === 'src/popup.html') {
            return 'popup.html'
          }
          
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name][extname]`
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return `images/[name][extname]`
          }
          if (/\.(html)$/.test(assetInfo.name)) {
            return `[name][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      }
    },
  }
}) 