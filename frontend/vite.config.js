import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
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
})
