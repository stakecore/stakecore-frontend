import { ensureProvider } from "~/utlits/contracts/utils"
import type { Eip1193Provider } from "ethers"
import { Status, StatusCode } from "~/constants"


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
      return status.toString()
  }
}