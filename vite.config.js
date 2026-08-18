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

// `text/plain` and `text/markdown` have no in-band way to declare an encoding
// the way HTML does with <meta charset>, so a response that omits the charset
// parameter leaves the reader guessing: browsers fall back to windows-1252 and
// every em dash in llms.txt and the markdown mirrors renders as mojibake.
//
// GitHub Pages sends `; charset=utf-8` for both extensions, so production is
// unaffected — Vite's static middleware is what drops it. This exists so local
// preview matches what ships, and a file that reads as garbage locally is
// genuinely broken rather than an artifact of the server we test against.
const utf8TextTypes = () => {
  const middleware = (req, res, next) => {
    if (!/\.(md|txt)(?:$|\?)/.test(req.url ?? '')) return next()

    const withCharset = value =>
      typeof value === 'string' && !/charset=/i.test(value) ? `${value}; charset=utf-8` : value

    // Both APIs have to be patched, and neither alone is enough.
    //
    // sirv, which serves these files, sets the type through writeHead(status,
    // headers) — that is the only path on HTTP/2, where the compat layer sends
    // the headers immediately and a later setHeader is too late to matter.
    // Over HTTP/1.1 something downstream re-sets Content-Type via setHeader
    // after writeHead, which still lands because h1 flushes headers lazily —
    // and that call would strip the charset straight back off.
    //
    // Browsers negotiate h2 here (basic-ssl serves TLS), so patching only
    // setHeader fixes the protocol the test client happens to use while
    // leaving the one a human hits still broken.
    const writeHead = res.writeHead.bind(res)
    res.writeHead = (...args) => {
      const headers = args.at(-1)
      if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase() === 'content-type') headers[key] = withCharset(headers[key])
        }
      }
      return writeHead(...args)
    }

    const setHeader = res.setHeader.bind(res)
    res.setHeader = (name, value) =>
      setHeader(name, String(name).toLowerCase() === 'content-type' ? withCharset(value) : value)

    next()
  }

  return {
    name: 'stakecore-utf8-text-types',
    // Registered directly, not through the returned-function form, so the
    // patch is in place before Vite's own static middleware runs.
    configureServer: server => { server.middlewares.use(middleware) },
    configurePreviewServer: server => { server.middlewares.use(middleware) }
  }
}

export default defineConfig({
  plugins: [react(), basicSsl(), openapiSchema(), utf8TextTypes()],
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
