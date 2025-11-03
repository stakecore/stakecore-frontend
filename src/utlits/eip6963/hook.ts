import { useGlobalStore } from '../store/global'
import { getAccounts, getChainId, tryAutoConnect } from './eip1193'
import type { MetaMaskInpageProvider } from '@metamask/providers'


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
  const { setWalletAddress, chain } = useGlobalStore.getState()
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('accountsChanged', async (accounts: string[]) => {
    const _chainId = await getChainId(wallet.provider)
    if ((chain == null || _chainId == chain) && accounts?.length > 0) {
      setWalletAddress(accounts[0], wallet)
    } else {
      setWalletAddress(null, null)
    }
  })
}

function attachChainChangeHandler(wallet: EIP6963ProviderDetail): void {
  const { setWalletAddress, chain } = useGlobalStore.getState()
  const metamask = wallet.provider as MetaMaskInpageProvider
  metamask?.on('chainChanged', async _chainId => {
    if (_chainId === chain) {
      const accounts = await getAccounts(wallet.provider)
      if (accounts.length > 0) {
        return setWalletAddress(accounts[0], wallet)
      }
    }
    setWalletAddress(null, null)
  })
}