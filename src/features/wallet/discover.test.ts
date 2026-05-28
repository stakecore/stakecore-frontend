// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ------------------------------------------------------------
//
// 1) Capture useSyncExternalStore's subscribe argument so we can exercise
//    it directly without a full React render context.
// 2) Replace addEip6963Hook so we don't pull the whole wallet store + 1193
//    helpers into this test — discover.ts's only job is the EIP-6963
//    event plumbing.

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, useSyncExternalStore: vi.fn() }
})
vi.mock('./hook', () => ({
  addEip6963Hook: vi.fn().mockResolvedValue(undefined),
}))

import { useSyncExternalStore } from 'react'
import { useExternalStore } from './discover'
import { externalState } from './discoverStore'
import { addEip6963Hook } from './hook'

const mockedUseSync = vi.mocked(useSyncExternalStore)
const mockedAddHook = vi.mocked(addEip6963Hook)

// Helper to construct a fake EIP-6963 announcement event. Real wallets
// dispatch a CustomEvent('eip6963:announceProvider', { detail }). The
// SUT only reads `event.detail`, so we don't need a full CustomEvent.
const announceEvent = (uuid: string, name = 'fake-wallet') =>
  new CustomEvent('eip6963:announceProvider', {
    detail: {
      info: { uuid, name, icon: '', rdns: name },
      provider: { request: vi.fn() },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
  // vi.clearAllMocks() wipes call history but Vitest's docs aren't
  // explicit about implementations on mocks set via .mockResolvedValue
  // at factory time — re-apply each test to be safe.
  mockedAddHook.mockResolvedValue(undefined)
  // externalState is module-level, so wipe between tests.
  externalState.walletProviders.length = 0
})

// Tiny helper to flush the microtask queue plus one macrotask cycle —
// the announcement handler is async (awaits addEip6963Hook before
// invoking the rerender callback), so a single `await Promise.resolve()`
// isn't always enough to see the post-await side effects.
const flush = async () => {
  // Pump multiple times to be robust to chained microtask continuations.
  for (let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0))
}

// --- subscribe wiring -------------------------------------------------

describe('useExternalStore — subscribe', () => {
  it('attaches a window listener for "eip6963:announceProvider" and dispatches "eip6963:requestProvider"', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    useExternalStore()
    const [subscribe] = mockedUseSync.mock.calls[0]
    subscribe(() => {})
    expect(addSpy).toHaveBeenCalledWith('eip6963:announceProvider', expect.any(Function))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'eip6963:requestProvider' }))
    addSpy.mockRestore()
    dispatchSpy.mockRestore()
  })

  it('returns a teardown function that removes the listener', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    useExternalStore()
    const [subscribe] = mockedUseSync.mock.calls[0]
    const teardown = subscribe(() => {})
    teardown!()
    expect(removeSpy).toHaveBeenCalledWith('eip6963:announceProvider', expect.any(Function))
    removeSpy.mockRestore()
  })
})

// --- announcement handling ---------------------------------------------

describe('useExternalStore — announcement event', () => {
  // Helper: subscribe and capture the addEventListener callback so we
  // can invoke it directly. happy-dom's dispatchEvent doesn't reliably
  // await an async listener's post-await continuation in our setup,
  // and we want to assert on the rerender call.
  const captureListener = (rerender: () => void) => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    useExternalStore()
    const [subscribe] = mockedUseSync.mock.calls[0]
    subscribe(rerender)
    const call = addSpy.mock.calls.find(c => c[0] === 'eip6963:announceProvider')!
    addSpy.mockRestore()
    return call[1] as (e: Event) => Promise<void>
  }

  it('appends the announced provider to externalState and invokes the rerender callback', async () => {
    const rerender = vi.fn()
    const listener = captureListener(rerender)
    await listener(announceEvent('wallet-1'))
    expect(externalState.walletProviders).toHaveLength(1)
    expect(externalState.walletProviders[0].info.uuid).toBe('wallet-1')
    expect(mockedAddHook).toHaveBeenCalledTimes(1)
    expect(rerender).toHaveBeenCalledTimes(1)
  })

  it('deduplicates by uuid — re-announcing the same wallet is a no-op', async () => {
    const rerender = vi.fn()
    const listener = captureListener(rerender)
    await listener(announceEvent('wallet-1'))
    await listener(announceEvent('wallet-1'))
    expect(externalState.walletProviders).toHaveLength(1)
    expect(mockedAddHook).toHaveBeenCalledTimes(1)
    expect(rerender).toHaveBeenCalledTimes(1)
  })

  it('accepts multiple distinct wallets and notifies once per new uuid', async () => {
    const rerender = vi.fn()
    const listener = captureListener(rerender)
    await listener(announceEvent('wallet-1'))
    await listener(announceEvent('wallet-2'))
    expect(externalState.walletProviders.map(w => w.info.uuid)).toEqual(['wallet-1', 'wallet-2'])
    expect(rerender).toHaveBeenCalledTimes(2)
  })
})

// --- getSnapshot / getServerSnapshot -----------------------------------

describe('useExternalStore — snapshot getters', () => {
  it('returns the live externalState reference for both client + server snapshots', () => {
    useExternalStore()
    const [, getSnapshot, getServerSnapshot] = mockedUseSync.mock.calls[0]
    expect(getSnapshot()).toBe(externalState)
    expect(getServerSnapshot!()).toBe(externalState)
  })
})
