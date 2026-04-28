import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const learnerCookie =
  'lite_user=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0bnQiOiJlZHVjb3JlJiUxIiwidXNlcl9pZCI6MSwiZW1haWwiOiJhZG1pbjFAc2VjLmNvbSIsImNvbXBhbnkiOm51bGwsImNpZCI6IiIsInRudF9leHAiOiIyMDI3LTAyLTE1IiwidG50X2dyYWNlX3BlcmlvZF9sYXN0X2RhdGUiOiIyMDI3LTAyLTIwIiwidG50X2dyYWNlX3BlcmlvZF9yZW1haW5pbmdfZGF5cyI6MzA0LCJ0bnRfZGF5c190b19leHBpcnkiOjI5OSwidG50X2lzX2FnZW50IjpudWxsLCJ0bnRfc3RhdHVzIjoiQWN0aXZlIiwiZXhwIjoxNzc2ODU3OTY2fQ.0wjBb_kZDFTeOExGc0AVMyhkS4euGBXHmYSgic1iDt0'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl =
    env.VITE_API_BASE_URL || 'https://twisted-disparity-tingly.ngrok-free.dev';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/zetrc-api': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zetrc-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const requestPath = proxyReq.path ?? '';
              const targetUrl = new URL(requestPath, apiBaseUrl);
              const modelParam =
                targetUrl.searchParams.get('Model') ?? targetUrl.searchParams.get('model');

              proxyReq.setHeader('Cookie', learnerCookie);
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');

              if (modelParam) {
                proxyReq.setHeader('Model', modelParam);
              }
            });
          },
        },
        '/zetrc-media': {
          target: apiBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zetrc-media/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Cookie', learnerCookie);
              proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  };
});
