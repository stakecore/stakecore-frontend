import { BrowserProvider, Contract } from 'ethers'
import * as C from '../../../constants'


// Each function submits a tx, then awaits one confirmation via tx.wait(1)
// so on-chain reverts surface as exceptions (caught by contractCallAdapter)
// and the returned hash is from a mined transaction the user can verify
// on an explorer.

export async function delegate(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedFlrAdr, C.wrappedFlrAbi, signer)
  const tx = await contract.delegate(C.flareDelegationAdr, args[0])
  await tx.wait(1)
  return tx.hash
}

export async function deposit(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedFlrAdr, C.wrappedFlrAbi, signer)
  const tx = await contract.deposit({ value: args[0] })
  await tx.wait(1)
  return tx.hash
}

export async function withdraw(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.wrappedFlrAdr, C.wrappedFlrAbi, signer)
  const tx = await contract.withdraw(args[0])
  await tx.wait(1)
  return tx.hash
}

export async function claim(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(C.flareFspRewardManagerAdr, C.flareFspRewardManagerAbi, signer)
  const tx = await contract.claim(address, address, args[0], true, [])
  await tx.wait(1)
  return tx.hash
}
