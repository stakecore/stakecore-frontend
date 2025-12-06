import { chainIdToConfig } from "../misc/translations"

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
): Promise<string[]> {
  try {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
      params: []
    })
    return accounts as string[]
  } catch (err: any) {
    return []
  }
}

export async function personalSign(
  message: string,
  address: string,
  ethereum: EIP1193Provider
): Promise<string> {
  try {
    const sig = await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    })
    return sig as string
  } catch (err: any) {
    return null
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
): Promise<boolean> {
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
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainConfig: chainIdToConfig(chainId),
              blockExplorerUrls: null
            }],
          })
        } catch (err: any) {
          console.error(err)
          return false
        }
      } else {
        console.error(err)
        return false
      }
    }
  }
  return true
}