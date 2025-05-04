import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist/js',
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      name: 'WhatsAppOrcamentos',
      fileName: () => 'content.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true,
        globals: {
          chrome: 'chrome'
        }
      }
    }
  }
}) 