import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for all assets > 1kB
    compression({
      algorithms: ['gzip'],
      include: /\.(js|css|html|svg|json)$/,
      threshold: 1024,
    }),
    // Brotli compression (smaller than gzip, supported by all modern browsers)
    compression({
      algorithms: ['brotliCompress'],
      include: /\.(js|css|html|svg|json)$/,
      threshold: 1024,
    }),
  ],
  build: {
    // Increase chunk warning limit (Firebase SDK is large)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Manual chunk splitting for stable long-term caching (function form required by Rollup types)
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/canvas-confetti') ||
            id.includes('node_modules/html-to-image')
          ) {
            return 'vendor-ui';
          }
        },
        // Deterministic hashed filenames for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Don't inline assets — keep them as separate hashed files for caching
    assetsInlineLimit: 0,
    // No sourcemaps in prod
    sourcemap: false,
    // Target modern browsers — enables smaller bundle output
    target: 'es2020',
  },
})

