import { describe, it, expect, vi, beforeEach } from 'vitest'

// Same mock shape as the flare-fsp contracts test — see that file for
// the rationale. Kept duplicated rather than shared so each test file
// stays self-contained and the per-network constants are obvious at
// the call site.

const MOCK_HASH = '0xMOCKHASH'

type ContractRef = {
  address: string
  abi: unknown
  calls: Record<string, unknown[][]>
}
const contractRefs: ContractRef[] = []

vi.mock('ethers', () => {
  const BrowserProvider = vi.fn().mockImplementation(() => ({
    getSigner: vi.fn().mockResolvedValue({ _signer: true }),
  }))
  const Contract = vi.fn().mockImplementation((address: string, abi: unknown) => {
    const ref: ContractRef = { address, abi, calls: {} }
    contractRefs.push(ref)
    return new Proxy({}, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined
        return (...args: unknown[]) => {
          if (!ref.calls[prop]) ref.calls[prop] = []
          ref.calls[prop].push(args)
          return Promise.resolve({
            hash: MOCK_HASH,
            wait: vi.fn().mockResolvedValue(undefined),
          })
        }
      },
    })
  })
  return { BrowserProvider, Contract }
})

import { claim, delegate, deposit, withdraw } from './contracts'
import {
  songbirdDelegationAdr,
  songbirdFspRewardManagerAbi,
  songbirdFspRewardManagerAdr,
  wrappedSgbAbi,
  wrappedSgbAdr,
} from '~/constants'

const fakeEthereum = { provider: 'fake' } as never

beforeEach(() => {
  contractRefs.length = 0
})

// --- delegate --------------------------------------------------------

describe('songbird-fsp / delegate', () => {
  it('builds the WSGB contract with the right address + ABI', async () => {
    await delegate(fakeEthereum, '0xabc', [5_000])
    expect(contractRefs).toHaveLength(1)
    expect(contractRefs[0].address).toBe(wrappedSgbAdr)
    expect(contractRefs[0].abi).toBe(wrappedSgbAbi)
  })

  it('calls .delegate(songbirdDelegationAdr, bips) — the Songbird address, not the Flare one', async () => {
    // Regression: an earlier revision passed flareDelegationAdr here
    // (the two happened to be the same address, so on-chain behavior
    // was identical, but the code was wrong).
    await delegate(fakeEthereum, '0xabc', [5_000])
    expect(contractRefs[0].calls.delegate).toEqual([[songbirdDelegationAdr, 5_000]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await delegate(fakeEthereum, '0xabc', [10_000])
    expect(hash).toBe(MOCK_HASH)
  })
})

// --- deposit ---------------------------------------------------------

describe('songbird-fsp / deposit', () => {
  it('builds the WSGB contract', async () => {
    await deposit(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].address).toBe(wrappedSgbAdr)
    expect(contractRefs[0].abi).toBe(wrappedSgbAbi)
  })

  it('forwards the bigint amount via the { value } overrides object', async () => {
    await deposit(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].calls.deposit).toEqual([[{ value: 100n }]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await deposit(fakeEthereum, '0xabc', [100n])
    expect(hash).toBe(MOCK_HASH)
  })
})

// --- withdraw --------------------------------------------------------

describe('songbird-fsp / withdraw', () => {
  it('builds the WSGB contract', async () => {
    await withdraw(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].address).toBe(wrappedSgbAdr)
    expect(contractRefs[0].abi).toBe(wrappedSgbAbi)
  })

  it('forwards the bigint amount positionally', async () => {
    await withdraw(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].calls.withdraw).toEqual([[100n]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await withdraw(fakeEthereum, '0xabc', [100n])
    expect(hash).toBe(MOCK_HASH)
  })
})

// --- claim ----------------------------------------------------------

describe('songbird-fsp / claim', () => {
  it('builds the Songbird reward-manager contract, not the WSGB contract', async () => {
    await claim(fakeEthereum, '0xabc', [42])
    expect(contractRefs[0].address).toBe(songbirdFspRewardManagerAdr)
    expect(contractRefs[0].abi).toBe(songbirdFspRewardManagerAbi)
  })

  it('calls .claim(owner, recipient, rewardEpochId, true, []) with the address as both owner and recipient', async () => {
    await claim(fakeEthereum, '0xabc', [42])
    expect(contractRefs[0].calls.claim).toEqual([['0xabc', '0xabc', 42, true, []]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await claim(fakeEthereum, '0xabc', [42])
    expect(hash).toBe(MOCK_HASH)
  })
})
