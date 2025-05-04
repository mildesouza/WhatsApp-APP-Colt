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
        },
        inlineDynamicImports: true,
        manualChunks: undefined,
        compact: true,
        minifyInternalExports: true
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  }
}) 