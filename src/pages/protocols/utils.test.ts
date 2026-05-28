import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StatusCode } from '~/enums'

// --- Mocks for the store + EIP-1193 helpers --------------------------------
//
// contractCallAdapter / ensureProvider read the wallet store via
// useGlobalStore.getState() and call requestAccounts /
// switchNetworkIfNecessary from features/wallet/eip1193. Both have no
// pure-function shape we could reach without mocking, so we replace
// the modules and configure return values per test.

vi.mock('~/features/wallet/store', () => ({
  useGlobalStore: { getState: vi.fn() },
}))
vi.mock('~/features/wallet/eip1193', () => ({
  requestAccounts: vi.fn(),
  switchNetworkIfNecessary: vi.fn(),
}))

// Import AFTER vi.mock so the SUT picks up the mocked modules.
import {
  actionStatusMessage,
  checkRangeAvailable,
  contractCallAdapter,
  extractFriendlyError,
} from './utils'
import { useGlobalStore } from '~/features/wallet/store'
import { requestAccounts, switchNetworkIfNecessary } from '~/features/wallet/eip1193'

const getState = vi.mocked(useGlobalStore.getState)
const mockedRequestAccounts = vi.mocked(requestAccounts)
const mockedSwitchNetwork = vi.mocked(switchNetworkIfNecessary)

// Minimal store snapshot the SUT actually reads. Each test overrides
// the relevant slice with `withStore({ ... })`.
const baseStore = {
  walletProvider: null as { provider: unknown } | null,
  walletAddress: null as string | null,
  chain: '0x1' as string | null,
  setWalletChoiceVisible: vi.fn(),
  setWalletAddress: vi.fn(),
}
const withStore = (overrides: Partial<typeof baseStore> = {}) => {
  const state = { ...baseStore, ...overrides }
  getState.mockReturnValue(state as never)
  return state
}

beforeEach(() => {
  vi.clearAllMocks()
  withStore() // default to "no wallet"
})

// --- extractFriendlyError --------------------------------------------------

describe('extractFriendlyError', () => {
  it('returns "unknown error" for null / undefined', () => {
    expect(extractFriendlyError(null)).toBe('unknown error')
    expect(extractFriendlyError(undefined)).toBe('unknown error')
  })

  it('maps EIP-1193 4001 and ethers ACTION_REJECTED to a wallet-rejection label', () => {
    expect(extractFriendlyError({ code: 4001 })).toBe('rejected in wallet')
    expect(extractFriendlyError({ code: 'ACTION_REJECTED' })).toBe('rejected in wallet')
  })

  it('maps -32002 to the pending-request message', () => {
    expect(extractFriendlyError({ code: -32002 })).toBe(
      'wallet has a pending request — open it to approve or reject',
    )
  })

  it('maps -32603 to the internal-error message', () => {
    expect(extractFriendlyError({ code: -32603 })).toBe(
      'wallet returned an internal error — please try again',
    )
  })

  it('maps 4100 to the unauthorized message', () => {
    expect(extractFriendlyError({ code: 4100 })).toBe('wallet has not granted account permission')
  })

  it('maps 4900 / 4901 to a disconnected message', () => {
    expect(extractFriendlyError({ code: 4900 })).toBe('wallet is disconnected')
    expect(extractFriendlyError({ code: 4901 })).toBe('wallet is disconnected')
  })

  it('maps ethers INSUFFICIENT_FUNDS to a gas-not-enough label', () => {
    expect(extractFriendlyError({ code: 'INSUFFICIENT_FUNDS' })).toBe(
      'insufficient funds for gas + transaction value',
    )
  })

  it('formats CALL_EXCEPTION with the revert reason when ethers exposes one', () => {
    expect(extractFriendlyError({ code: 'CALL_EXCEPTION', reason: 'NOT_OWNER' })).toBe(
      'reverted: NOT_OWNER',
    )
  })

  it('returns a bare "reverted on-chain" message when CALL_EXCEPTION has no reason', () => {
    expect(extractFriendlyError({ code: 'CALL_EXCEPTION' })).toBe('transaction reverted on-chain')
  })

  it('falls back to ethers shortMessage when no specific code matches', () => {
    expect(extractFriendlyError({ shortMessage: 'nonce too low' })).toBe('nonce too low')
  })

  it('digs into nested .info.error and .error shapes for the underlying code', () => {
    expect(extractFriendlyError({ info: { error: { code: 4001 } } })).toBe('rejected in wallet')
    expect(extractFriendlyError({ error: { code: -32002 } })).toBe(
      'wallet has a pending request — open it to approve or reject',
    )
  })

  it('final-fallbacks to Formatter.error of message', () => {
    // Formatter.error passes generic strings through unchanged.
    expect(extractFriendlyError({ message: 'something else entirely' })).toBe(
      'something else entirely',
    )
  })
})

// --- actionStatusMessage --------------------------------------------------

describe('actionStatusMessage', () => {
  it('returns the success message verbatim on CONTRACT_CALL_EXECUTED', () => {
    expect(actionStatusMessage(StatusCode.CONTRACT_CALL_EXECUTED, 'Wrapped 5 FLR')).toBe(
      'Wrapped 5 FLR',
    )
  })

  it('reports "wallet not connected" when the picker was just shown', () => {
    expect(actionStatusMessage(StatusCode.WALLET_CHOICE_SHOWN, 'irrelevant')).toBe(
      'wallet not connected',
    )
  })

  it('reports "network switch was rejected" when the user declined chain swap', () => {
    expect(actionStatusMessage(StatusCode.CHAIN_SWITCH_REJECTED, 'irrelevant')).toBe(
      'network switch was rejected',
    )
  })

  it('reports "account access was rejected" when the user declined account request', () => {
    expect(actionStatusMessage(StatusCode.ACCOUNT_REQUEST_REJECTED, 'irrelevant')).toBe(
      'account access was rejected',
    )
  })

  it('passes raw error strings through Formatter.error in the default branch', () => {
    // String status — unrecognised StatusCode → default branch
    expect(actionStatusMessage('insufficient funds for gas + transaction value', 'msg')).toBe(
      'insufficient funds for gas + transaction value',
    )
  })
})

// --- checkRangeAvailable --------------------------------------------------

describe('checkRangeAvailable', () => {
  it('returns the available value when min <= max', () => {
    expect(checkRangeAvailable(0, 100, '50 FLR')).toBe('50 FLR')
    expect(checkRangeAvailable(5, 5, 'anything')).toBe('anything')
  })

  it('returns "Unavailable" when min > max (the range is degenerate)', () => {
    expect(checkRangeAvailable(10, 5, '50 FLR')).toBe('Unavailable')
  })
})

// --- contractCallAdapter -------------------------------------------------

describe('contractCallAdapter', () => {
  const fakeProvider = { provider: {} }

  it('returns WALLET_CHOICE_SHOWN and surfaces the picker when no wallet is connected', async () => {
    const state = withStore({ walletProvider: null })
    const fn = vi.fn()
    const result = await contractCallAdapter(fn, '0xabc', [])
    expect(result).toEqual({ status: StatusCode.WALLET_CHOICE_SHOWN })
    expect(state.setWalletChoiceVisible).toHaveBeenCalledWith(true)
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns CHAIN_SWITCH_REJECTED when the user declines the network swap', async () => {
    withStore({ walletProvider: fakeProvider, walletAddress: '0xabc' })
    mockedSwitchNetwork.mockResolvedValue(false)
    const fn = vi.fn()
    const result = await contractCallAdapter(fn, '0xabc', [])
    expect(result).toEqual({ status: StatusCode.CHAIN_SWITCH_REJECTED })
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns ACCOUNT_REQUEST_REJECTED when the wallet has no addresses for us', async () => {
    withStore({ walletProvider: fakeProvider, walletAddress: null })
    mockedSwitchNetwork.mockResolvedValue(true)
    mockedRequestAccounts.mockResolvedValue([])
    const fn = vi.fn()
    const result = await contractCallAdapter(fn, '0xabc', [])
    expect(result).toEqual({ status: StatusCode.ACCOUNT_REQUEST_REJECTED })
    expect(fn).not.toHaveBeenCalled()
  })

  it('returns CONTRACT_CALL_EXECUTED + hash on the happy path', async () => {
    withStore({ walletProvider: fakeProvider, walletAddress: '0xabc' })
    mockedSwitchNetwork.mockResolvedValue(true)
    const fn = vi.fn().mockResolvedValue('0xdeadbeef')
    const result = await contractCallAdapter(fn, '0xabc', [42] as unknown as never)
    expect(result).toEqual({ status: StatusCode.CONTRACT_CALL_EXECUTED, hash: '0xdeadbeef' })
    expect(fn).toHaveBeenCalledWith(fakeProvider.provider, '0xabc', [42])
  })

  it('maps a thrown user rejection to a friendly status string (no hash)', async () => {
    withStore({ walletProvider: fakeProvider, walletAddress: '0xabc' })
    mockedSwitchNetwork.mockResolvedValue(true)
    const fn = vi.fn().mockRejectedValue({ code: 4001 })
    const result = await contractCallAdapter(fn, '0xabc', [])
    expect(result).toEqual({ status: 'rejected in wallet' })
  })

  it('requests accounts + stores the first one when walletAddress is initially null', async () => {
    const state = withStore({ walletProvider: fakeProvider, walletAddress: null })
    mockedSwitchNetwork.mockResolvedValue(true)
    mockedRequestAccounts.mockResolvedValue(['0xnew'])
    const fn = vi.fn().mockResolvedValue('0xhash')
    await contractCallAdapter(fn, '0xnew', [])
    expect(state.setWalletAddress).toHaveBeenCalledWith('0xnew')
    expect(fn).toHaveBeenCalled()
  })
})
