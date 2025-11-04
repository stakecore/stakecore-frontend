import { useGlobalStore } from '../store/global'
import { getAccounts, getChainId, switchNetworkIfNecessary, tryAutoConnect } from './eip1193'
import type { MetaMaskInpageProvider } from '@metamask/providers'


export async function onInternalChainSwitch(
  chainId: string, wallet: EIP6963ProviderDetail
): Promise<string | null> {
  const connectedChainId = await getChainId(wallet.provider)
  if (chainId != null && connectedChainId != chainId) {
    const switched = await switchNetworkIfNecessary(chainId, wallet.provider, false)
    if (!switched) {
      return null
    }
  }
  const accounts = await getAccounts(wallet.provider)
  if (accounts.length > 0) {
    return accounts[0]
  }
  return null
}

export async function addEip6963Hook(wallet: EIP6963ProviderDetail): Promise<void> {
  attachAccountChangeHandler(wallet)
  attachChainChangeHandler(wallet)
  const { chain } = useGlobalStore.getState()
  const address = await tryAutoConnect(chain, wallet)
  if (address !== null) {
    const { setWalletAddress } = useGlobalStore.getState()
    setWalletAddress(address, wallet)
  }
}

function attachAccountChangeHandler(wallet: EIP6963ProviderDetail): void {
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('accountsChanged', async (accounts: string[]) => {
    const { chain, walletProvider, setWalletAddress } = useGlobalStore.getState()
    if (walletProvider.info.uuid != wallet.info.uuid) return
    const _chainId = await getChainId(wallet.provider)
    if ((chain == null || _chainId == chain) && accounts?.length > 0) {
      setWalletAddress(accounts[0], wallet)
    } else {
      setWalletAddress(null, null)
    }
  })
}

function attachChainChangeHandler(wallet: EIP6963ProviderDetail): void {
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('chainChanged', async _chainId => {
    const { chain, walletProvider, setWalletAddress } = useGlobalStore.getState()
    if (walletProvider.info.uuid != wallet.info.uuid) return
    if (chain == null || _chainId == chain) {
      const accounts = await getAccounts(wallet.provider)
      if (accounts.length > 0) {
        return setWalletAddress(accounts[0], wallet)
      }
    }
    setWalletAddress(null, null)
  })
}