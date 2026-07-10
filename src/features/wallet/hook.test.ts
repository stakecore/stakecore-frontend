import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks for the wallet store + EIP-1193 RPC helpers ----------------
//
// hook.ts reads the wallet store via useGlobalStore.getState() and calls
// the EIP-1193 RPC helpers it imports from ./eip1193. Both are swapped
// out per test so we never touch a real wallet.

vi.mock('./store', () => ({
  useGlobalStore: { getState: vi.fn() },
}))
vi.mock('./eip1193', () => ({
  getAccounts: vi.fn(),
  getChainId: vi.fn(),
  switchNetworkIfNecessary: vi.fn(),
  tryAutoConnect: vi.fn(),
}))

// Import the SUT + mocks AFTER vi.mock so module references resolve to
// the mocked versions.
import { addEip6963Hook, onInternalChainSwitch } from './hook'
import { useGlobalStore } from './store'
import { getAccounts, getChainId, switchNetworkIfNecessary, tryAutoConnect } from './eip1193'

const getState = vi.mocked(useGlobalStore.getState)
const mockedGetAccounts = vi.mocked(getAccounts)
const mockedGetChainId = vi.mocked(getChainId)
const mockedSwitchNetwork = vi.mocked(switchNetworkIfNecessary)
const mockedTryAutoConnect = vi.mocked(tryAutoConnect)

const baseStore = {
  walletProvider: null as { info: { uuid: string }, provider: unknown } | null,
  walletAddress: null as string | null,
  chain: null as string | null,
  setWalletChoiceVisible: vi.fn(),
  setWalletAddress: vi.fn(),
}
const withStore = (overrides: Partial<typeof baseStore> = {}) => {
  const state = { ...baseStore, ...overrides }
  getState.mockReturnValue(state as never)
  return state
}

// Tiny helper that builds a fake EIP-6963 wallet detail whose
// provider.on(event, cb) records the cb so tests can fire it later.
const fakeWallet = (uuid = 'wallet-1') => {
  const onCallbacks = new Map<string, (...args: unknown[]) => unknown>()
  const wallet = {
    info: { uuid, name: 'fake', icon: '', rdns: 'fake' },
    provider: {
      on: vi.fn((event: string, cb: (...args: unknown[]) => unknown) => {
        onCallbacks.set(event, cb)
      }),
      request: vi.fn(),
    },
  }
  return { wallet, onCallbacks }
}

beforeEach(() => {
  vi.clearAllMocks()
  withStore()
})

// --- onInternalChainSwitch --------------------------------------------

describe('onInternalChainSwitch', () => {
  it('returns the first account when the wallet is already on the target chain (no switch attempt)', async () => {
    mockedGetChainId.mockResolvedValue('0xe')
    mockedGetAccounts.mockResolvedValue(['0xabc'])
    const { wallet } = fakeWallet()
    await expect(onInternalChainSwitch('0xe', wallet as never)).resolves.toBe('0xabc')
    expect(mockedSwitchNetwork).not.toHaveBeenCalled()
  })

  it('switches network when chain differs, then returns the first account', async () => {
    mockedGetChainId.mockResolvedValue('0x1')
    mockedSwitchNetwork.mockResolvedValue({ ok: true, value: undefined })
    mockedGetAccounts.mockResolvedValue(['0xabc'])
    const { wallet } = fakeWallet()
    await expect(onInternalChainSwitch('0xe', wallet as never)).resolves.toBe('0xabc')
    // Network switch is called with addChain=false (the SUT passes false
    // here so the picker doesn't surprise-add a chain mid-route-change).
    expect(mockedSwitchNetwork).toHaveBeenCalledWith('0xe', wallet.provider, false)
  })

  it('returns null when the network switch is rejected', async () => {
    mockedGetChainId.mockResolvedValue('0x1')
    mockedSwitchNetwork.mockResolvedValue({ ok: false, error: { code: 4001 } })
    const { wallet } = fakeWallet()
    await expect(onInternalChainSwitch('0xe', wallet as never)).resolves.toBeNull()
    expect(mockedGetAccounts).not.toHaveBeenCalled()
  })

  it('returns null when the wallet has no accounts on the target chain', async () => {
    mockedGetChainId.mockResolvedValue('0xe')
    mockedGetAccounts.mockResolvedValue([])
    const { wallet } = fakeWallet()
    await expect(onInternalChainSwitch('0xe', wallet as never)).resolves.toBeNull()
  })
})

// --- addEip6963Hook ----------------------------------------------------

describe('addEip6963Hook — auto-connect', () => {
  it('calls setWalletAddress(address, wallet) when tryAutoConnect succeeds', async () => {
    const state = withStore({ chain: '0xe' })
    mockedTryAutoConnect.mockResolvedValue('0xabc')
    const { wallet } = fakeWallet()
    await addEip6963Hook(wallet as never)
    expect(mockedTryAutoConnect).toHaveBeenCalledWith('0xe', wallet)
    expect(state.setWalletAddress).toHaveBeenCalledWith('0xabc', wallet)
  })

  it('does NOT touch setWalletAddress when auto-connect returns null', async () => {
    const state = withStore({ chain: '0xe' })
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet } = fakeWallet()
    await addEip6963Hook(wallet as never)
    expect(state.setWalletAddress).not.toHaveBeenCalled()
  })

  it('registers the three EIP-1193 event handlers on the wallet provider', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet } = fakeWallet()
    await addEip6963Hook(wallet as never)
    const events = wallet.provider.on.mock.calls.map(c => c[0])
    expect(events).toContain('accountsChanged')
    expect(events).toContain('chainChanged')
    expect(events).toContain('disconnect')
  })
})

// --- accountsChanged handler ------------------------------------------

describe('accountsChanged handler', () => {
  it('is a no-op when the event fires for a wallet other than the currently selected one', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    // Store says a different wallet is selected.
    const state = withStore({ walletProvider: { info: { uuid: 'wallet-2' }, provider: {} } })
    await onCallbacks.get('accountsChanged')!(['0xabc'])
    expect(state.setWalletAddress).not.toHaveBeenCalled()
  })

  it('updates walletAddress to the first account when the new chain matches', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    mockedGetChainId.mockResolvedValue('0xe')
    await onCallbacks.get('accountsChanged')!(['0xnew', '0xother'])
    expect(state.setWalletAddress).toHaveBeenCalledWith('0xnew', wallet)
  })

  it('clears walletAddress when the event delivers an empty accounts array', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    mockedGetChainId.mockResolvedValue('0xe')
    await onCallbacks.get('accountsChanged')!([])
    expect(state.setWalletAddress).toHaveBeenCalledWith(null, null)
  })

  it('clears walletAddress when the wallet is on a different chain than the route', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    mockedGetChainId.mockResolvedValue('0x1') // wallet on Ethereum mainnet, route is Flare
    await onCallbacks.get('accountsChanged')!(['0xabc'])
    expect(state.setWalletAddress).toHaveBeenCalledWith(null, null)
  })
})

// --- chainChanged handler ---------------------------------------------

describe('chainChanged handler', () => {
  it('is a no-op when fired for a non-selected wallet', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({ walletProvider: { info: { uuid: 'wallet-2' }, provider: {} } })
    await onCallbacks.get('chainChanged')!('0x1')
    expect(state.setWalletAddress).not.toHaveBeenCalled()
  })

  it('updates walletAddress to the first account when the new chainId matches the route chain', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    mockedGetAccounts.mockResolvedValue(['0xabc'])
    await onCallbacks.get('chainChanged')!('0xe')
    expect(state.setWalletAddress).toHaveBeenCalledWith('0xabc', wallet)
  })

  it('clears walletAddress when the new chainId does NOT match the route', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    await onCallbacks.get('chainChanged')!('0x1')
    expect(state.setWalletAddress).toHaveBeenCalledWith(null, null)
  })

  it('clears walletAddress when the chain matches but the wallet exposes no accounts', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
      chain: '0xe',
    })
    mockedGetAccounts.mockResolvedValue([])
    await onCallbacks.get('chainChanged')!('0xe')
    expect(state.setWalletAddress).toHaveBeenCalledWith(null, null)
  })
})

// --- disconnect handler -----------------------------------------------

describe('disconnect handler', () => {
  it('is a no-op when fired for a non-selected wallet', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({ walletProvider: { info: { uuid: 'wallet-2' }, provider: {} } })
    await onCallbacks.get('disconnect')!()
    expect(state.setWalletAddress).not.toHaveBeenCalled()
  })

  it('clears walletAddress when the currently-selected wallet disconnects', async () => {
    mockedTryAutoConnect.mockResolvedValue(null)
    const { wallet, onCallbacks } = fakeWallet('wallet-1')
    await addEip6963Hook(wallet as never)
    const state = withStore({
      walletProvider: { info: { uuid: 'wallet-1' }, provider: {} },
    })
    await onCallbacks.get('disconnect')!()
    expect(state.setWalletAddress).toHaveBeenCalledWith(null, null)
  })
})
