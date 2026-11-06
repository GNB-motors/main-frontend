import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// three's DRACOLoader builds its default decoder URLs with
// `new URL('../libs/draco/...', import.meta.url)`. Vite turns each of those
// into an emitted asset - about 837 kB of JS (draco_decoder.js plus two
// draco_wasm_wrapper.js copies) - that this app never fetches: Vehicle360
// calls dracoLoader.setDecoderPath('/draco/') and ships its own decoder in
// public/draco/. Point the defaults at /draco/ so the assets are not emitted
// and the bundle budget measures the code the browser can actually run.
function dracoDecoderPaths() {
  return {
    name: 'draco-decoder-paths',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g, '/').includes('three/examples/jsm/loaders/DRACOLoader.js'))
        return null;
      const patched = code.replace(
        /new URL\(\s*'\.\.\/libs\/draco\/(?:gltf\/)?([^']+)'\s*,\s*import\.meta\.url\s*\)\.toString\(\)/g,
        (_match, file) => `'/draco/${file}'`,
      );
      return patched === code ? null : { code: patched, map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  // In dev, proxy API calls (including SSE) through Vite. The production API
  // does not allow local browser origins. Preserve the configured base path:
  // /api/auth/login → https://host/v1/api/auth/login when the base ends in /v1.
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
    plugins: [react(), tailwindcss(), dracoDecoderPaths()],
    ...(command === 'serve' && apiOrigin
      ? { define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('') } }
      : {}),
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
            '/api': {
              target: apiOrigin,
              changeOrigin: true,
              secure: true,
              timeout: 120000,
              proxyTimeout: 120000,
              rewrite: (path) => `${apiBasePath}${path}`,
              configure: (proxy) => {
                // This is a server-to-server request; the upstream must not
                // receive the browser's local Origin and reject it via CORS.
                proxy.on('proxyReq', (proxyReq) => {
                  proxyReq.removeHeader('origin');
                });
                proxy.on('error', (_err, _req, res) => {
                  if (res && !res.headersSent && res.writeHead) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                  }
                  if (res && res.end) {
                    res.end(JSON.stringify({ error: 'API temporarily unavailable' }));
                  }
                });
              },
            },
          },
        }
      : {},
  };
});
