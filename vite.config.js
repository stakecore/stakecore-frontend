import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/',
  // The devcontainer publishes 5173 and 4173 to the host
  // (.devcontainer/docker-compose.yaml). Vite binds loopback by default,
  // which inside a container means the container's own loopback — the
  // published port would then reach an interface with nothing listening on
  // it and refuse the connection. `host: true` binds all interfaces, which
  // is also what makes the dev server reachable from a phone on the LAN.
  //
  // strictPort because the published mapping is for these exact numbers:
  // Vite's default hunt for the next free port would leave the server
  // running on 5174, unpublished and unreachable, while reporting success.
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  // Vitest's default include is `**/*.{test,spec}.*`, which would swallow the
  // Playwright specs in e2e/. Unit tests are co-located next to their source,
  // so scoping to src/ states the existing convention and keeps the two
  // runners from fighting over the same files.
  test: {
    include: ['src/**/*.test.{ts,tsx}']
  }
})
