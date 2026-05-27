import { BrowserProvider, Contract } from 'ethers'
import * as C from '../../../constants'


// Mirror of flare-fsp/contracts.ts for the Songbird SSP.
// Each function submits + waits one confirmation, returning the hash.

export async function delegate(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedSgbAdr, C.wrappedSgbAbi, signer)
  const tx = await contract.delegate(C.flareDelegationAdr, args[0])
  await tx.wait(1)
  return tx.hash
}

export async function deposit(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedSgbAdr, C.wrappedSgbAbi, signer)
  const tx = await contract.deposit({ value: args[0] })
  await tx.wait(1)
  return tx.hash
}

export async function withdraw(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedSgbAdr, C.wrappedSgbAbi, signer)
  const tx = await contract.withdraw(args[0])
  await tx.wait(1)
  return tx.hash
}

export async function claim(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.songbirdFspRewardManagerAdr, C.songbirdFspRewardManagerAbi, signer)
  const tx = await contract.claim(address, address, args[0], true, [])
  await tx.wait(1)
  return tx.hash
}
