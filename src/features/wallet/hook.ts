import { useGlobalStore } from './store'
import { getAccounts, getChainId, switchNetworkIfNecessary, tryAutoConnect } from './eip1193'
import type { MetaMaskInpageProvider } from '@metamask/providers'


export async function onInternalChainSwitch(
  chainId: string, wallet: EIP6963ProviderDetail
): Promise<string | null> {
  const connectedChainId = await getChainId(wallet.provider)
  if (chainId != null && connectedChainId != chainId) {
    const switched = await switchNetworkIfNecessary(chainId, wallet.provider, false)
    if (!switched.ok) {
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
  attachDisconnectHandler(wallet)
  const { chain } = useGlobalStore.getState()
  const address = await tryAutoConnect(chain, wallet)
  if (address !== null) {
    const { setWalletAddress } = useGlobalStore.getState()
    setWalletAddress(address, wallet)
  }
}

// Helpers — read fresh store state and decide whether the event applies
// to the wallet currently selected by the user. If the user has switched
// to a different wallet (or disconnected entirely), the event is for a
// wallet we no longer track — ignore it.
function isSelectedWallet(wallet: EIP6963ProviderDetail): boolean {
  const { walletProvider } = useGlobalStore.getState()
  return walletProvider?.info?.uuid === wallet.info.uuid
}

function attachAccountChangeHandler(wallet: EIP6963ProviderDetail): void {
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('accountsChanged', async (accounts: string[]) => {
    if (!isSelectedWallet(wallet)) return
    const { chain, setWalletAddress } = useGlobalStore.getState()
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
    if (!isSelectedWallet(wallet)) return
    const { chain, setWalletAddress } = useGlobalStore.getState()
    if (chain == null || _chainId == chain) {
      const accounts = await getAccounts(wallet.provider)
      if (accounts.length > 0) {
        return setWalletAddress(accounts[0], wallet)
      }
    }
    setWalletAddress(null, null)
  })
}

// EIP-1193 `disconnect`: the wallet has become disconnected from all
// chains (user revoked permissions, extension locked, etc.). Mirror
// that in our store so the UI doesn't show a stale "connected" state.
function attachDisconnectHandler(wallet: EIP6963ProviderDetail): void {
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('disconnect', () => {
    if (!isSelectedWallet(wallet)) return
    const { setWalletAddress } = useGlobalStore.getState()
    setWalletAddress(null, null)
  })
}
