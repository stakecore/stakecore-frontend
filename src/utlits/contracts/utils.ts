import { useGlobalStore } from "../store/global"
import { requestAccounts, switchNetworkIfNecessary } from "../eip6963/eip1193"
import { delegate as _delegate } from "./flare"
import { Eip1193Provider } from "ethers"


export async function ensureProvider(): Promise<Eip1193Provider | undefined> {
  let { walletProvider, setWalletVisible } = useGlobalStore.getState()
  if (walletProvider == null) {
    setWalletVisible(true)
    return
  }
  if (!await switchNetworkIfNecessary(walletProvider.provider)) return
  const { walletAddress, setWalletAddress } = useGlobalStore.getState()
  if (walletAddress == null) {
    const addresses = await requestAccounts(walletProvider.provider)
    if (!addresses.length) return
    setWalletAddress(addresses[0])
  }
  return walletProvider.provider
}