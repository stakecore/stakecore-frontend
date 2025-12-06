import { Formatter } from "~/utils/misc/formatter"
import { Status, StatusCode } from "~/enums"
import { useGlobalStore } from "~/utils/store/global"
import { requestAccounts, switchNetworkIfNecessary } from "~/utils/eip6963/eip1193"
import type { Eip1193Provider } from "ethers"
import type { IStakeFlowBarAction } from "~/components/types"


export async function ensureProvider(): Promise<[Eip1193Provider | null, StatusCode]> {
  let { walletProvider, setWalletChoiceVisible, chain } = useGlobalStore.getState()
  if (walletProvider == null) {
    setWalletChoiceVisible(true)
    return [null, StatusCode.WALLET_CHOICE_SHOWN]
  }
  if (!await switchNetworkIfNecessary(chain, walletProvider.provider)) return
  const { walletAddress, setWalletAddress } = useGlobalStore.getState()
  if (walletAddress == null) {
    const addresses = await requestAccounts(walletProvider.provider)
    if (!addresses.length) return
    setWalletAddress(addresses[0])
  }
  return [walletProvider.provider, StatusCode.WALLET_PROVIDER_OBTAINED]
}


export async function contractCallAdapter<T>(
  fun: (provider: Eip1193Provider, address: string, args: T) => Promise<any>,
  address: string, args: T
): Promise<Status> {
  const [provider, code] = await ensureProvider()
  if (provider == null) return code
  try {
    await fun(provider, address, args)
    return StatusCode.CONTRACT_CALL_EXECUTED
  } catch (e: any) {
    return e?.message
  }
}

export function actionStatusMessage(status: Status, msg: string): string {
  switch (status) {
    case StatusCode.CONTRACT_CALL_EXECUTED:
      return msg
    case StatusCode.WALLET_CHOICE_SHOWN:
      return `wallet not connected`
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