import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
  plugins: [react(), basicSsl()],
  base: '/',
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
