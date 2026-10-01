import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // The SSE client opens a same-origin /api/live/stream URL. In dev there is no
  // frontend nginx to proxy it, so forward it to the API from .env the way axios
  // reaches it: under the base URL's path. With VITE_API_BASE_URL=https://host/v1,
  // /api/live/stream → https://host/v1/api/live/stream (the gateway strips /v1);
  // proxying to the bare origin hits an unrouted path and every stream 404s.
  let apiOrigin = null;
  let apiBasePath = '';
  try {
    if (env.VITE_API_BASE_URL) {
      const base = new URL(env.VITE_API_BASE_URL);
      apiOrigin = base.origin;
      apiBasePath = base.pathname.replace(/\/+$/, '');
    }
  } catch {
    apiOrigin = null;
  }

  return {
    plugins: [react(), tailwindcss()],
    esbuild: {
      // Strips console.log/warn/info/debug calls at BUILD TIME in production.
      // console.error is intentionally kept — real runtime errors should still surface.
      // This uses esbuild's "pure" annotation: treated as side-effect-free and removed
      // when the return value is unused (which console calls always are).
      // Has zero effect on `vite dev` — logs work normally during development.
      pure: ['console.log', 'console.warn', 'console.info', 'console.debug'],
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: apiOrigin
      ? {
          proxy: {
            '/api/live': {
              target: apiOrigin,
              changeOrigin: true,
              secure: true,
              rewrite: (path) => `${apiBasePath}${path}`,
              configure: (proxy) => {
                proxy.on('error', (_err, _req, res) => {
                  if (res && !res.headersSent && res.writeHead) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                  }
                  if (res && res.end) {
                    res.end(JSON.stringify({ error: 'Live stream temporarily unavailable' }));
                  }
                });
              },
            },
          },
        }
      : {},
  };
});
