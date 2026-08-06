// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { safeSession } from './safeStorage'

// Blocking is done by replacing the `sessionStorage` property with a throwing
// getter rather than by spying on Storage.prototype. Two reasons: it mirrors
// what Chrome actually does when cookies are fully blocked (the *property
// access* raises SecurityError, before any method runs), and prototype spies
// were observed to silently stop taking effect once other tests in the same
// file had already touched storage — which quietly turns these into tests
// that assert nothing.
const realDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')

const blockStorage = () => {
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    get() { throw new DOMException('access denied', 'SecurityError') },
  })
  // Self-check: prove the block is live, so a technique that stops working
  // fails loudly here instead of turning every assertion below green.
  expect(() => sessionStorage).toThrow()
}

const restoreStorage = () => {
  if (realDescriptor) Object.defineProperty(window, 'sessionStorage', realDescriptor)
}

beforeEach(() => sessionStorage.clear())
afterEach(restoreStorage)

describe('safeSession with working storage', () => {
  it('round-trips a value', () => {
    safeSession.set('k', 'v')
    expect(safeSession.get('k')).toBe('v')
  })

  it('reports a successful write', () => {
    expect(safeSession.set('k', 'v')).toBe(true)
  })

  it('returns null for a key that was never set', () => {
    expect(safeSession.get('absent')).toBeNull()
  })

  it('removes a value', () => {
    safeSession.set('k', 'v')
    safeSession.remove('k')
    expect(safeSession.get('k')).toBeNull()
  })
})

describe('safeSession with blocked storage', () => {
  it('reads as null instead of throwing', () => {
    blockStorage()
    expect(() => safeSession.get('k')).not.toThrow()
    expect(safeSession.get('k')).toBeNull()
  })

  it('reports a failed write rather than throwing', () => {
    // This boolean is the whole point: callers recording a decision they must
    // read back later need to know it didn't persist.
    blockStorage()
    expect(() => safeSession.set('k', 'v')).not.toThrow()
    expect(safeSession.set('k', 'v')).toBe(false)
  })

  it('removes without throwing', () => {
    blockStorage()
    expect(() => safeSession.remove('k')).not.toThrow()
  })

  it('recovers once storage becomes reachable again', () => {
    // Guards against caching the storage reference at module scope, which
    // would strand the helper in its failed state.
    blockStorage()
    expect(safeSession.set('k', 'v')).toBe(false)
    restoreStorage()
    expect(safeSession.set('k', 'v')).toBe(true)
    expect(safeSession.get('k')).toBe('v')
  })
})
