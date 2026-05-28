import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAccounts,
  getChainId,
  personalSign,
  requestAccounts,
  switchNetworkIfNecessary,
  tryAutoConnect,
} from './eip1193'

// Tiny fake EIP-1193 provider. We don't need a full implementation — only
// `.request({ method, params })`, which is what every helper here hits.
type Req = { method: string; params?: unknown[] }
const provider = () => {
  const request = vi.fn<(req: Req) => Promise<unknown>>()
  return { request }
}

// Strict-mode silencer for type punning — most helpers expect
// EIP1193Provider, but the structural shape we mock is `{ request }`.
const asProvider = <T>(p: T) => p as never

beforeEach(() => {
  vi.clearAllMocks()
})

// --- getChainId / getAccounts / requestAccounts -----------------------

describe('getChainId', () => {
  it('returns the chain id string when the wallet responds', async () => {
    const p = provider()
    p.request.mockResolvedValue('0xe')
    await expect(getChainId(asProvider(p))).resolves.toBe('0xe')
    expect(p.request).toHaveBeenCalledWith({ method: 'eth_chainId', params: [] })
  })

  it('swallows errors and returns an empty string', async () => {
    const p = provider()
    p.request.mockRejectedValue({ code: 4001 })
    await expect(getChainId(asProvider(p))).resolves.toBe('')
  })
})

describe('getAccounts', () => {
  it('returns the array of accounts when the wallet responds', async () => {
    const p = provider()
    p.request.mockResolvedValue(['0xabc', '0xdef'])
    await expect(getAccounts(asProvider(p))).resolves.toEqual(['0xabc', '0xdef'])
    expect(p.request).toHaveBeenCalledWith({ method: 'eth_accounts', params: [] })
  })

  it('swallows errors and returns an empty array', async () => {
    const p = provider()
    p.request.mockRejectedValue(new Error('locked'))
    await expect(getAccounts(asProvider(p))).resolves.toEqual([])
  })
})

describe('requestAccounts', () => {
  it('returns the array of accounts when the user approves', async () => {
    const p = provider()
    p.request.mockResolvedValue(['0xabc'])
    await expect(requestAccounts(asProvider(p))).resolves.toEqual(['0xabc'])
    expect(p.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts', params: [] })
  })

  it('returns an empty array on user rejection / failure', async () => {
    const p = provider()
    p.request.mockRejectedValue({ code: 4001 })
    await expect(requestAccounts(asProvider(p))).resolves.toEqual([])
  })
})

// --- personalSign ------------------------------------------------------

describe('personalSign', () => {
  it('forwards the message + address as params and returns the signature', async () => {
    const p = provider()
    p.request.mockResolvedValue('0xdeadbeef')
    await expect(personalSign('hello', '0xabc', asProvider(p))).resolves.toBe('0xdeadbeef')
    expect(p.request).toHaveBeenCalledWith({
      method: 'personal_sign',
      params: ['hello', '0xabc'],
    })
  })

  it('returns null when the wallet rejects the signature request', async () => {
    const p = provider()
    p.request.mockRejectedValue({ code: 4001 })
    await expect(personalSign('hello', '0xabc', asProvider(p))).resolves.toBeNull()
  })
})

// --- tryAutoConnect ----------------------------------------------------
//
// Composite helper: reads the current chainId, only fetches accounts when
// the chain matches (or no expected chain is passed), returns the first
// account or null.

describe('tryAutoConnect', () => {
  // Each handler dispatches by method name so the test reads as a wallet
  // state, not a sequence of unrelated mock returns.
  const dispatchProvider = (handlers: Record<string, () => Promise<unknown>>) => {
    const p = provider()
    p.request.mockImplementation((req: Req) => {
      const h = handlers[req.method]
      if (!h) throw new Error(`unmocked method: ${req.method}`)
      return h()
    })
    return p
  }

  it('returns the first account when the wallet is already on the expected chain', async () => {
    const p = dispatchProvider({
      eth_chainId: async () => '0xe',
      eth_accounts: async () => ['0xabc', '0xdef'],
    })
    await expect(tryAutoConnect('0xe', { provider: p } as never)).resolves.toBe('0xabc')
  })

  it('returns null when the wallet is on a different chain than requested', async () => {
    const p = dispatchProvider({
      eth_chainId: async () => '0x1',
      eth_accounts: async () => ['0xabc'],
    })
    await expect(tryAutoConnect('0xe', { provider: p } as never)).resolves.toBeNull()
  })

  it('ignores the chainId check when chainId argument is null', async () => {
    const p = dispatchProvider({
      eth_chainId: async () => '0x1',
      eth_accounts: async () => ['0xabc'],
    })
    await expect(tryAutoConnect(null as never, { provider: p } as never)).resolves.toBe('0xabc')
  })

  it('returns null when the wallet exposes no accounts on the matching chain', async () => {
    const p = dispatchProvider({
      eth_chainId: async () => '0xe',
      eth_accounts: async () => [],
    })
    await expect(tryAutoConnect('0xe', { provider: p } as never)).resolves.toBeNull()
  })
})

// --- switchNetworkIfNecessary -----------------------------------------
//
// Most-complicated composite. Short-circuits when already on the target
// chain; on mismatch tries `wallet_switchEthereumChain`; on 4902 falls
// back to `wallet_addEthereumChain` (unless addChain=false). Returns
// boolean — true on success or no-op, false on irrecoverable failure.

describe('switchNetworkIfNecessary', () => {
  const make = (handlers: Record<string, ((req: Req) => Promise<unknown>) | 'throw4902'>) => {
    const p = provider()
    p.request.mockImplementation(async (req: Req) => {
      const h = handlers[req.method]
      if (h === 'throw4902') throw { code: 4902 }
      if (!h) throw new Error(`unmocked method: ${req.method}`)
      return h(req)
    })
    return p
  }

  it('returns true immediately when already on the target chain (no switch attempt)', async () => {
    const p = make({ eth_chainId: async () => '0xe' })
    await expect(switchNetworkIfNecessary('0xe', asProvider(p))).resolves.toBe(true)
    expect(p.request).toHaveBeenCalledTimes(1) // only the chainId probe
  })

  it('returns true when chainId is null (no target — skip the switch entirely)', async () => {
    const p = make({ eth_chainId: async () => '0x1' })
    await expect(switchNetworkIfNecessary(null, asProvider(p))).resolves.toBe(true)
    expect(p.request).toHaveBeenCalledTimes(1)
  })

  it('issues wallet_switchEthereumChain and returns true on a clean switch', async () => {
    const p = make({
      eth_chainId: async () => '0x1',
      wallet_switchEthereumChain: async () => null,
    })
    await expect(switchNetworkIfNecessary('0xe', asProvider(p))).resolves.toBe(true)
    expect(p.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xe' }],
    })
  })

  it('falls back to wallet_addEthereumChain on a 4902 (chain unknown) error', async () => {
    const p = make({
      eth_chainId: async () => '0x1',
      wallet_switchEthereumChain: 'throw4902',
      wallet_addEthereumChain: async () => null,
    })
    await expect(switchNetworkIfNecessary('0xe', asProvider(p))).resolves.toBe(true)
    // Verify the add call happened with the chain config payload.
    expect(p.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'wallet_addEthereumChain',
    }))
  })

  it('returns false when add-chain also fails (final irrecoverable)', async () => {
    const p = make({
      eth_chainId: async () => '0x1',
      wallet_switchEthereumChain: 'throw4902',
      wallet_addEthereumChain: () => Promise.reject(new Error('user rejected add')),
    })
    // Silence the console.error the SUT emits.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(switchNetworkIfNecessary('0xe', asProvider(p))).resolves.toBe(false)
    errSpy.mockRestore()
  })

  it('returns false when addChain=false and switch fails with 4902 (no fallback)', async () => {
    const p = make({
      eth_chainId: async () => '0x1',
      wallet_switchEthereumChain: 'throw4902',
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(switchNetworkIfNecessary('0xe', asProvider(p), false)).resolves.toBe(false)
    expect(p.request).not.toHaveBeenCalledWith(expect.objectContaining({
      method: 'wallet_addEthereumChain',
    }))
    errSpy.mockRestore()
  })

  it('returns false on user-rejection (4001) of the initial switch', async () => {
    const p = make({
      eth_chainId: async () => '0x1',
      wallet_switchEthereumChain: () => Promise.reject({ code: 4001 }),
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(switchNetworkIfNecessary('0xe', asProvider(p))).resolves.toBe(false)
    errSpy.mockRestore()
  })
})
