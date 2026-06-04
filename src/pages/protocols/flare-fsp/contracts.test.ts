import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- ethers mock ------------------------------------------------------
//
// We replace the BrowserProvider + Contract constructors so the tests
// never touch a real wallet / RPC. Each Contract instance records:
//   - the constructor (address, abi) — to assert we hit the right
//     on-chain target with the right interface
//   - per-method invocations (the args list) — to assert the call site
//     forwarded the right arguments
//
// Every method on the mocked contract resolves to a transaction with a
// stable hash and a no-op .wait(1), so the SUT can `await tx.wait(1)`
// and then return `tx.hash`.

const MOCK_HASH = '0xMOCKHASH'

type ContractRef = {
  address: string
  abi: unknown
  calls: Record<string, unknown[][]>
}
const contractRefs: ContractRef[] = []

vi.mock('ethers', () => {
  // Plain function declarations (not `vi.fn().mockImplementation(...)`)
  // because vitest 4 won't `new` a vi.fn whose impl is an arrow
  // function. The tests assert through `contractRefs` anyway, so the
  // call-tracking that vi.fn would add isn't needed.
  function BrowserProvider() {
    return {
      getSigner: () => Promise.resolve({ _signer: true }),
    }
  }
  function Contract(address: string, abi: unknown) {
    const ref: ContractRef = { address, abi, calls: {} }
    contractRefs.push(ref)
    // Proxy: every method call records its args and resolves to a fake tx.
    return new Proxy({}, {
      get: (_, prop: string | symbol) => {
        if (typeof prop !== 'string') return undefined
        return (...args: unknown[]) => {
          if (!ref.calls[prop]) ref.calls[prop] = []
          ref.calls[prop].push(args)
          return Promise.resolve({
            hash: MOCK_HASH,
            wait: () => Promise.resolve(undefined),
          })
        }
      },
    })
  }
  return { BrowserProvider, Contract }
})

// Import AFTER vi.mock so the SUT picks up the mocked ethers.
import { claim, delegate, deposit, withdraw } from './contracts'
import {
  flareDelegationAdr,
  flareFspRewardManagerAbi,
  flareFspRewardManagerAdr,
  wrappedFlrAbi,
  wrappedFlrAdr,
} from '~/constants'

const fakeEthereum = { provider: 'fake' } as never

beforeEach(() => {
  contractRefs.length = 0
})

// --- delegate --------------------------------------------------------

describe('flare-fsp / delegate', () => {
  it('builds the WFLR contract with the right address + ABI', async () => {
    await delegate(fakeEthereum, '0xabc', [5_000])
    expect(contractRefs).toHaveLength(1)
    expect(contractRefs[0].address).toBe(wrappedFlrAdr)
    expect(contractRefs[0].abi).toBe(wrappedFlrAbi)
  })

  it('calls .delegate(flareDelegationAdr, bips) with the supplied bips', async () => {
    await delegate(fakeEthereum, '0xabc', [5_000])
    expect(contractRefs[0].calls.delegate).toEqual([[flareDelegationAdr, 5_000]])
  })

  it('returns the on-chain hash after waiting for confirmation', async () => {
    const hash = await delegate(fakeEthereum, '0xabc', [10_000])
    expect(hash).toBe(MOCK_HASH)
  })
})

// --- deposit ---------------------------------------------------------

describe('flare-fsp / deposit', () => {
  it('builds the WFLR contract', async () => {
    await deposit(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].address).toBe(wrappedFlrAdr)
    expect(contractRefs[0].abi).toBe(wrappedFlrAbi)
  })

  it('forwards the bigint amount via the { value } overrides object', async () => {
    // ethers payable txs take the value via the trailing overrides arg.
    await deposit(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].calls.deposit).toEqual([[{ value: 100n }]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await deposit(fakeEthereum, '0xabc', [100n])
    expect(hash).toBe(MOCK_HASH)
  })
})

// --- withdraw --------------------------------------------------------

describe('flare-fsp / withdraw', () => {
  it('builds the WFLR contract', async () => {
    await withdraw(fakeEthereum, '0xabc', [100n])
    expect(contractRefs[0].address).toBe(wrappedFlrAdr)
    expect(contractRefs[0].abi).toBe(wrappedFlrAbi)
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

describe('flare-fsp / claim', () => {
  it('builds the reward-manager contract, not the WFLR contract', async () => {
    await claim(fakeEthereum, '0xabc', [42])
    expect(contractRefs[0].address).toBe(flareFspRewardManagerAdr)
    expect(contractRefs[0].abi).toBe(flareFspRewardManagerAbi)
  })

  it('calls .claim(owner, recipient, rewardEpochId, true, []) with the address as both owner and recipient', async () => {
    // The contract claims everything up to + including rewardEpochId, so
    // passing the latest epoch from claimableEpochs is the intended use.
    await claim(fakeEthereum, '0xabc', [42])
    expect(contractRefs[0].calls.claim).toEqual([['0xabc', '0xabc', 42, true, []]])
  })

  it('returns the on-chain hash', async () => {
    const hash = await claim(fakeEthereum, '0xabc', [42])
    expect(hash).toBe(MOCK_HASH)
  })
})
