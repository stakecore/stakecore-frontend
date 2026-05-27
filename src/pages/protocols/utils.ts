import { Formatter } from "~/utils/misc/formatter"
import { Status, StatusCode } from "~/enums"
import { useGlobalStore } from "~/utils/store/global"
import { requestAccounts, switchNetworkIfNecessary } from "~/utils/eip6963/eip1193"
import type { Eip1193Provider } from "ethers"
import type { IStakeFlowBarAction } from "~/components/types"


// Result of a contract call attempt. `status` is always present (success
// code or error message). `hash` is set when the transaction was actually
// mined (StatusCode.CONTRACT_CALL_EXECUTED) so callers can build an
// explorer link.
export type ContractCallResult = {
  status: Status
  hash?: string
}

export async function ensureProvider(): Promise<[Eip1193Provider | null, StatusCode]> {
  const { walletProvider, setWalletChoiceVisible, chain } = useGlobalStore.getState()
  if (walletProvider == null) {
    setWalletChoiceVisible(true)
    return [null, StatusCode.WALLET_CHOICE_SHOWN]
  }
  if (!await switchNetworkIfNecessary(chain, walletProvider.provider)) {
    return [null, StatusCode.CHAIN_SWITCH_REJECTED]
  }
  const { walletAddress, setWalletAddress } = useGlobalStore.getState()
  if (walletAddress == null) {
    const addresses = await requestAccounts(walletProvider.provider)
    if (!addresses.length) {
      return [null, StatusCode.ACCOUNT_REQUEST_REJECTED]
    }
    setWalletAddress(addresses[0])
  }
  return [walletProvider.provider, StatusCode.WALLET_PROVIDER_OBTAINED]
}


// Wraps a contract function (which submits + waits + returns a tx hash)
// with the wallet plumbing + error handling. Returns a ContractCallResult
// so callers can both check the status code AND access the on-chain hash
// to render explorer links.
export async function contractCallAdapter<T>(
  fun: (provider: Eip1193Provider, address: string, args: T) => Promise<string>,
  address: string, args: T
): Promise<ContractCallResult> {
  const [provider, code] = await ensureProvider()
  if (provider == null) return { status: code }
  try {
    const hash = await fun(provider, address, args)
    return { status: StatusCode.CONTRACT_CALL_EXECUTED, hash }
  } catch (e: any) {
    return { status: extractFriendlyError(e) }
  }
}

// Maps the most common error shapes from EIP-1193 wallets and ethers
// into short, user-readable strings. Anything not recognised falls back
// to the underlying message — never throws, never crashes.
//
// Standard codes covered:
//   EIP-1193: 4001 (rejected), 4100 (unauthorized), 4900 (disconnected)
//   JSON-RPC: -32002 (pending), -32603 (internal)
//   ethers:   ACTION_REJECTED, INSUFFICIENT_FUNDS, UNPREDICTABLE_GAS_LIMIT,
//             CALL_EXCEPTION (revert), NETWORK_ERROR
export function extractFriendlyError(e: any): string {
  if (e == null) return 'unknown error'

  // Wallets sometimes nest the original error under .info.error or .error.
  const inner = e?.info?.error ?? e?.error ?? e
  const code = inner?.code ?? e?.code

  // User-rejected paths.
  if (code === 4001 || code === 'ACTION_REJECTED') {
    return 'rejected in wallet'
  }
  // Pending request — wallet already has one open.
  if (code === -32002) {
    return 'wallet has a pending request — open it to approve or reject'
  }
  // Wallet returned an internal error (often transient).
  if (code === -32603) {
    return 'wallet returned an internal error — please try again'
  }
  // Unauthorized — wallet has not granted account permission.
  if (code === 4100) {
    return 'wallet has not granted account permission'
  }
  // Wallet disconnected from all chains.
  if (code === 4900 || code === 4901) {
    return 'wallet is disconnected'
  }
  // Insufficient funds for gas + value.
  if (code === 'INSUFFICIENT_FUNDS') {
    return 'insufficient funds for gas + transaction value'
  }
  // On-chain revert — ethers exposes the reason at .reason / .shortMessage.
  if (code === 'CALL_EXCEPTION' || e?.reason) {
    return e?.reason ? `reverted: ${e.reason}` : 'transaction reverted on-chain'
  }
  // Generic ethers short message (v6) — usually the most useful summary.
  if (e?.shortMessage) return e.shortMessage

  // Final fallback to the raw message, trimmed.
  return Formatter.error(e?.message ?? String(e))
}

export function actionStatusMessage(status: Status, msg: string): string {
  switch (status) {
    case StatusCode.CONTRACT_CALL_EXECUTED:
      return msg
    case StatusCode.WALLET_CHOICE_SHOWN:
      return 'wallet not connected'
    case StatusCode.CHAIN_SWITCH_REJECTED:
      return 'network switch was rejected'
    case StatusCode.ACCOUNT_REQUEST_REJECTED:
      return 'account access was rejected'
    default:
      return Formatter.error(status as string)
  }
}

export function injectActionArg(action: IStakeFlowBarAction, arg: any) {
  if (!action.active) return
  const mod = action as any as { original: any }
  if (mod.original == null) mod.original = action.method
  action.method = (address, _1, _2) => mod.original(address, _1, _2, arg)
}

// this is specifically made for flare and avalanche info summary component
export function checkRangeAvailable(min: number, max: number, available: string): string {
  return min <= max ? available : 'Unavailable'
}
