// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { routeLazy } from './lazy'

const RELOAD_FLAG = 'stakecore:chunk-reload-attempted'

const reload = vi.fn()

beforeEach(() => {
  sessionStorage.clear()
  reload.mockClear()
  // happy-dom's Location is a real class instance; replace only reload so
  // href/hash keep behaving normally.
  Object.defineProperty(window.location, 'reload', { value: reload, configurable: true })
  window.history.replaceState(null, '', '/#/')
})

describe('routeLazy', () => {
  it('returns the module default and clears the retry flag on success', async () => {
    sessionStorage.setItem(RELOAD_FLAG, '1')
    const Component = () => null

    const result = await routeLazy('/songbird/fsp', async () => ({ default: Component }))()

    expect(result).toEqual({ Component })
    expect(sessionStorage.getItem(RELOAD_FLAG)).toBeNull()
    expect(reload).not.toHaveBeenCalled()
  })

  // The regression this file exists for: React Router commits the URL only
  // *after* lazy() resolves, so at the moment the chunk fails the address bar
  // still points at the route the user is leaving. Reloading as-is replays
  // that page and the navigation is silently swallowed.
  it('reloads onto the route being navigated to, not the one being left', async () => {
    const pending = routeLazy('/songbird/fsp', async () => { throw new Error('chunk 504') })()

    // Never settles — the reload takes over.
    await Promise.race([pending, Promise.resolve()])

    expect(reload).toHaveBeenCalledOnce()
    expect(window.location.hash).toBe('#/songbird/fsp')
    expect(sessionStorage.getItem(RELOAD_FLAG)).toBe('1')
  })

  it('keeps the rest of the URL intact when rewriting the hash', async () => {
    window.history.replaceState(null, '', '/sub/?ref=x#/')

    routeLazy('/flare/validator', async () => { throw new Error('chunk 504') })()
    await Promise.resolve()

    expect(window.location.pathname).toBe('/sub/')
    expect(window.location.search).toBe('?ref=x')
    expect(window.location.hash).toBe('#/flare/validator')
  })

  it('rethrows instead of reload-looping when a retry was already attempted', async () => {
    sessionStorage.setItem(RELOAD_FLAG, '1')

    await expect(
      routeLazy('/songbird/fsp', async () => { throw new Error('chunk 504') })()
    ).rejects.toThrow('chunk 504')
    expect(reload).not.toHaveBeenCalled()
  })
})

// Chrome with cookies fully blocked throws SecurityError on any sessionStorage
// access. Every branch of routeLazy touches storage, so an unguarded call
// turns a working browser into one that cannot open a single lazy route.
//
// Blocked by swapping the property for a throwing getter, not by spying on
// Storage.prototype — those spies were observed to silently stop applying
// once earlier tests in this file had used storage, which made these tests
// pass against code that was still broken.
describe('routeLazy with blocked sessionStorage', () => {
  const realDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')

  const blockStorage = () => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() { throw new DOMException('access denied', 'SecurityError') },
    })
    // Self-check, so a technique that stops working fails here rather than
    // turning the assertions below vacuously green.
    expect(() => sessionStorage).toThrow()
  }

  afterEach(() => {
    if (realDescriptor) Object.defineProperty(window, 'sessionStorage', realDescriptor)
  })

  it('still resolves a successfully loaded chunk', async () => {
    // The worst of the three call sites: it clears the retry flag on the
    // *success* path, so a throw there fails a route that loaded perfectly.
    blockStorage()
    const Component = () => null

    const result = await routeLazy('/about', async () => ({ default: Component }))()

    expect(result).toEqual({ Component })
  })

  it('does not auto-reload when the retry attempt cannot be recorded', async () => {
    // The loop hazard: RELOAD_FLAG is the only thing stopping a permanently
    // broken chunk from reloading forever. If the flag can't persist, an
    // automatic reload would repeat on every single load — so surrender to
    // the error UI and its manual Reload button instead.
    blockStorage()

    await expect(
      routeLazy('/songbird/fsp', async () => { throw new Error('chunk 504') })()
    ).rejects.toThrow('chunk 504')
    expect(reload).not.toHaveBeenCalled()
  })
})
