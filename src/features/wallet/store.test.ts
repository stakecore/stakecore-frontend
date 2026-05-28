import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalStore } from './store'

// Capture the store's initial state once; reset to it between tests so
// each one starts from a known clean slate. Zustand stores persist
// across tests in the same module, so without this reset, mutations
// from one test leak into the next.
const initial = useGlobalStore.getState()

beforeEach(() => {
  useGlobalStore.setState({
    walletProvider: null,
    walletAddress: null,
    walletChoiceVisible: false,
    chain: null,
  })
})

describe('useGlobalStore — initial state', () => {
  it('starts with everything nulled / collapsed', () => {
    // Use the captured initial reference for invariants we want pinned.
    expect(initial.walletProvider).toBeNull()
    expect(initial.walletAddress).toBeNull()
    expect(initial.walletChoiceVisible).toBe(false)
    expect(initial.chain).toBeNull()
  })

  it('exposes setter functions for each piece of state', () => {
    expect(typeof initial.setWalletProvider).toBe('function')
    expect(typeof initial.setWalletAddress).toBe('function')
    expect(typeof initial.setWalletChoiceVisible).toBe('function')
    expect(typeof initial.setChain).toBe('function')
  })
})

describe('setWalletProvider', () => {
  it('sets walletProvider to the supplied detail', () => {
    const detail = { info: { uuid: 'w-1' } } as never
    useGlobalStore.getState().setWalletProvider(detail)
    expect(useGlobalStore.getState().walletProvider).toBe(detail)
  })
})

describe('setWalletAddress', () => {
  it('updates only walletAddress when no provider arg is passed (provider stays)', () => {
    const provider = { info: { uuid: 'w-1' } } as never
    useGlobalStore.setState({ walletProvider: provider })
    useGlobalStore.getState().setWalletAddress('0xabc')
    const s = useGlobalStore.getState()
    expect(s.walletAddress).toBe('0xabc')
    expect(s.walletProvider).toBe(provider) // unchanged
  })

  it('updates both walletAddress and walletProvider when both are supplied', () => {
    const newProvider = { info: { uuid: 'w-2' } } as never
    useGlobalStore.getState().setWalletAddress('0xdef', newProvider)
    const s = useGlobalStore.getState()
    expect(s.walletAddress).toBe('0xdef')
    expect(s.walletProvider).toBe(newProvider)
  })

  it('clears walletProvider when explicitly passed null (different from "no arg")', () => {
    // The hook.ts disconnect handler calls setWalletAddress(null, null).
    // That must wipe the provider too — `null` is distinguished from
    // `undefined` ("no arg, keep current") in the setter implementation.
    useGlobalStore.setState({ walletProvider: { info: { uuid: 'w-1' } } as never })
    useGlobalStore.getState().setWalletAddress(null as never, null as never)
    const s = useGlobalStore.getState()
    expect(s.walletAddress).toBeNull()
    expect(s.walletProvider).toBeNull()
  })
})

describe('setWalletChoiceVisible', () => {
  it('toggles between true and false', () => {
    useGlobalStore.getState().setWalletChoiceVisible(true)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(true)
    useGlobalStore.getState().setWalletChoiceVisible(false)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(false)
  })
})

describe('setChain', () => {
  it('updates chain to a chainId string', () => {
    useGlobalStore.getState().setChain('0xe')
    expect(useGlobalStore.getState().chain).toBe('0xe')
  })

  it('accepts null to clear the chain (route is not chain-scoped)', () => {
    useGlobalStore.setState({ chain: '0xe' })
    useGlobalStore.getState().setChain(null)
    expect(useGlobalStore.getState().chain).toBeNull()
  })
})
