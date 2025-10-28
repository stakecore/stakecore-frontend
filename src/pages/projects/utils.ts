import { ensureProvider } from "~/utlits/contracts/utils"
import { Formatter } from "~/utlits/misc/formatter"
import { Status, StatusCode } from "~/constants"
import type { Eip1193Provider } from "ethers"
import type { IStakeFlowBarAction } from "~/components/types"


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

export function injectActionArg(action: IStakeFlowBarAction, args: any) {
  if (!action.active) return
  const mod = action as any as { original: any }
  if (mod.original == null) mod.original = action.method
  action.method = (address, _1, _2) => mod.original(address, _1, _2, args)
}