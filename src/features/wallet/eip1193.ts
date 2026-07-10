import { chainIdToConfig } from "../../utils/misc/translations"


// Result of a user-initiated wallet action. The read-only query helpers
// below (getChainId / getAccounts) still degrade to sentinels ('' / []) —
// their callers don't surface failures, so "couldn't read it" is a fine
// silent fallback. The *actions* (requestAccounts / personalSign /
// switchNetworkIfNecessary) instead return this discriminated result so the
// UI can tell "user rejected" (4001) from "wallet disconnected" (4900) from
// "RPC down", via extractFriendlyError(result.error).
// Note: a single shape with optional value/error rather than a discriminated
// union — this project compiles with strictNullChecks off, where TS won't
// narrow a boolean discriminant to the `ok: false` member, so `.error` on a
// narrowed union is inaccessible. Optional fields keep both readable; callers
// gate on `.ok`. Constructors below only ever set the field for their branch.
export type WalletResult<T> = {
  ok: boolean
  value?: T
  error?: unknown
}

export async function getChainId(
  ethereum: EIP1193Provider
): Promise<string> {
  try {
    const id = await ethereum.request({
      "method": "eth_chainId",
      "params": []
    })
    return id as string
  } catch (err: any) {
    return ''
  }
}

export async function getAccounts(
  ethereum: EIP1193Provider
): Promise<string[]> {
  try {
    const accounts = await ethereum.request({
      method: 'eth_accounts',
      params: []
    })
    return accounts as string[]
  } catch (err: any) {
    return []
  }
}

export async function requestAccounts(
  ethereum: EIP1193Provider
): Promise<WalletResult<string[]>> {
  try {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
      params: []
    })
    return { ok: true, value: accounts as string[] }
  } catch (error) {
    return { ok: false, error }
  }
}

export async function personalSign(
  message: string,
  address: string,
  ethereum: EIP1193Provider
): Promise<WalletResult<string>> {
  try {
    const sig = await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })
    return { ok: true, value: sig as string }
  } catch (error) {
    return { ok: false, error }
  }
}

export async function tryAutoConnect(chainId: string, detail: EIP6963ProviderDetail): Promise<string | null> {
  const _chainId = await getChainId(detail.provider)
  if (chainId == null || _chainId == chainId) {
    const accounts = await getAccounts(detail.provider)
    if (accounts?.length) {
      return accounts[0]
    }
  }
  return null
}

export async function switchNetworkIfNecessary(
  chainId: string | null,
  ethereum: EIP1193Provider,
  addChain = true
): Promise<WalletResult<void>> {
  const _chainId = await getChainId(ethereum)
  if (chainId != null && chainId != _chainId) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      })
    } catch (err: any) {
      // Chain not added to MetaMask
      if (err.code === 4902 && addChain) {
        try {
          // EIP-3085 expects the chain config fields (chainId, chainName,
          // rpcUrls, nativeCurrency) at the top level of params[0]. The
          // wallet config objects in constants.ts already have exactly that
          // shape, so spread them directly — nesting them under a made-up
          // `chainConfig` key made the wallet reject the request as invalid.
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainIdToConfig(chainId)],
          })
        } catch (addErr) {
          console.error(addErr)
          return { ok: false, error: addErr }
        }
      } else {
        console.error(err)
        return { ok: false, error: err }
      }
    }
  }
  return { ok: true, value: undefined }
}
