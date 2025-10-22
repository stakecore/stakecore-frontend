import { useGlobalStore } from "../store/global"
import { requestAccounts, switchNetworkIfNecessary } from "../eip6963/eip1193"
import { delegate as _delegate } from "./flare"
import { Eip1193Provider } from "ethers"
import { StatusCode } from "~/constants"


export async function ensureProvider(): Promise<[Eip1193Provider | null, StatusCode]> {
  let { walletProvider, setWalletChoiceVisible } = useGlobalStore.getState()
  if (walletProvider == null) {
    setWalletChoiceVisible(true)
    return [null, StatusCode.WALLET_CHOICE_SHOWN]
  }
  if (!await switchNetworkIfNecessary(walletProvider.provider)) return
  const { walletAddress, setWalletAddress } = useGlobalStore.getState()
  if (walletAddress == null) {
    const addresses = await requestAccounts(walletProvider.provider)
    if (!addresses.length) return
    setWalletAddress(addresses[0])
  }
  return [walletProvider.provider, StatusCode.WALLET_PROVIDER_OBTAINED]
}