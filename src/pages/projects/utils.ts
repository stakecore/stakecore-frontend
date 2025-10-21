import { ensureProvider } from "~/utlits/contracts/utils"
import type { Eip1193Provider } from "ethers"


export async function contractCallAdapter<T>(
  fun: (provider: Eip1193Provider, address: string, args: T) => Promise<any>,
  address: string, args: T
): Promise<boolean> {
  const provider = await ensureProvider()
  if (provider == null) return false
  try {
    await fun(provider, address, args)
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}