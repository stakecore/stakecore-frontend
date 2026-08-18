import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'


// Publishes the repo-root openapi.json at /openapi.json, which /AGENTS.md
// links as the machine-readable schema for the public API.
//
// Emitted from the root file rather than copied into public/ on purpose: a
// copy in public/ is a second source of truth that `pnpm openapi-gen` does not
// update, so it would drift from the schema the frontend client is generated
// from — and drift silently, since nothing reads it at build time. `serve`
// wires the same file into the dev/preview middleware so the e2e spec tests
// the artifact rather than a fixture.
const openapiSchema = () => {
  const source = path.resolve(__dirname, 'openapi.json')
  return {
    name: 'stakecore-openapi-schema',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'openapi.json',
        source: fs.readFileSync(source, 'utf8')
      })
    },
    // Preview needs no hook: it serves dist/, where generateBundle already
    // wrote the file. Only the dev server, which never runs a bundle, does.
    configureServer(server) {
      server.middlewares.use('/openapi.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(fs.readFileSync(source, 'utf8'))
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), basicSsl(), openapiSchema()],
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
