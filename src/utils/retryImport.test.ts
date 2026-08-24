// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest'
import { retryImport, moduleUrlFrom } from './retryImport'

const CHUNK = 'https://stakecore.org/assets/fsp-stats-Cackad8D.js'
const fetchFailure = () => new TypeError(`Failed to fetch dynamically imported module: ${CHUNK}`)
// Injected so the retries don't actually wait; the backoff itself is not the
// thing under test.
const nap = () => Promise.resolve()

describe('moduleUrlFrom', () => {
  it('recovers the URL from every engine that puts one in the message', () => {
    expect(moduleUrlFrom(new TypeError(`Failed to fetch dynamically imported module: ${CHUNK}`))).toBe(CHUNK)
    expect(moduleUrlFrom(new TypeError(`error loading dynamically imported module: ${CHUNK}`))).toBe(CHUNK)
    expect(moduleUrlFrom(new TypeError(`Unable to preload CSS for ${CHUNK}`))).toBe(CHUNK)
  })

  // Safari says only "Importing a module script failed." — no URL, so there is
  // nothing to cache-bust and the retry has to be skipped rather than spun.
  it('returns undefined when the message carries no URL', () => {
    expect(moduleUrlFrom(new TypeError('Importing a module script failed.'))).toBeUndefined()
    expect(moduleUrlFrom(new Error('Cannot read properties of undefined'))).toBeUndefined()
    expect(moduleUrlFrom(null)).toBeUndefined()
  })
})

describe('retryImport', () => {
  it('resolves the module and never reaches for the importer when the first try works', async () => {
    const mod = { default: 'ok' }
    const importer = vi.fn()

    await expect(retryImport(async () => mod, { importer, sleep: nap })).resolves.toBe(mod)
    expect(importer).not.toHaveBeenCalled()
  })

  it('re-imports through a cache-busted URL after a failed fetch', async () => {
    const mod = { default: 'ok' }
    const importer = vi.fn(async (_url: string) => mod)

    const result = await retryImport<typeof mod>(
      async () => { throw fetchFailure() },
      { importer, sleep: nap },
    )

    expect(result).toBe(mod)
    expect(importer).toHaveBeenCalledOnce()
    expect(importer.mock.calls[0]?.[0]).toMatch(/^https:\/\/stakecore\.org\/assets\/fsp-stats-Cackad8D\.js\?/)
  })

  // The measured reason this module exists: Chromium records a failed module
  // fetch against its URL and every later import of that exact URL replays the
  // failure without a network request. Three imports of a 503'd chunk produced
  // one request. So each attempt must ask for a URL the module map has never
  // seen, or the retry is a no-op.
  it('gives every attempt a URL the module map has not seen', async () => {
    const importer = vi.fn(async (_url: string) => { throw fetchFailure() })

    await expect(retryImport(
      async () => { throw fetchFailure() },
      { attempts: 3, importer, sleep: nap },
    )).rejects.toThrow()

    const urls = importer.mock.calls.map(c => c[0])
    expect(urls).toHaveLength(3)
    expect(new Set(urls).size).toBe(3)
  })

  it('rethrows the original error once the attempts are spent', async () => {
    const original = fetchFailure()

    await expect(retryImport(
      async () => { throw original },
      { attempts: 2, importer: async () => { throw new TypeError('a later, less useful error') }, sleep: nap },
    )).rejects.toBe(original)
  })

  it('does not retry an error with no recoverable URL', async () => {
    const importer = vi.fn()
    const factory = vi.fn(async () => { throw new Error('Importing a module script failed.') })

    await expect(retryImport(factory, { importer, sleep: nap })).rejects.toThrow('Importing a module script failed.')
    expect(factory).toHaveBeenCalledOnce()
    expect(importer).not.toHaveBeenCalled()
  })

  it('appends to an existing query string instead of replacing it', async () => {
    const importer = vi.fn(async (_url: string) => ({ default: 'ok' }))

    await retryImport(
      async () => { throw new TypeError('Failed to fetch dynamically imported module: https://x.dev/a.js?v=2') },
      { importer, sleep: nap },
    )

    expect(importer.mock.calls[0]?.[0]).toContain('?v=2&')
  })
})
