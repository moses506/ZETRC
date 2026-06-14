import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl =
    env.VITE_API_BASE_URL || 'https://twisted-disparity-tingly.ngrok-free.dev';
  const clientApiKey = env.CLIENT_API_KEY;

  const setCommonProxyHeaders = (proxyReq: import('http').ClientRequest) => {
    if (clientApiKey) {
      proxyReq.setHeader('X-Client-Api-Key', clientApiKey);
    }

    proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
  };

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

              setCommonProxyHeaders(proxyReq);

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
              setCommonProxyHeaders(proxyReq);
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
