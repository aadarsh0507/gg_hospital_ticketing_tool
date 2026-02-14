import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Ensure non-`public/` static assets still get shipped into `dist/`
    viteStaticCopy({
      targets: [
        { src: 'icons/*', dest: 'icons' },
        { src: 'assets/logo.png', dest: 'assets' },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache everything Vite emits (plus our copied static assets)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
      },
      manifest: {
        name: 'GG Hospital Ticketing Tool',
        short_name: 'GG Ticketing',
        description: 'Hospital ticketing and concierge dashboard',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      // Lets you test PWA behavior during `vite dev`
      devOptions: {
        enabled: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Suppress connection errors and return a proper error response
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Backend server is not available. Please ensure the backend is running on port 3001.',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
              }));
            }
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            // Log proxy requests in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
            }
          });
        },
      },
    },
  },
});
