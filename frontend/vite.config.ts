import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
