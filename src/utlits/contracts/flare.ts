import { BrowserProvider, Contract } from 'ethers'
import { wrappedFlrAbi, wrappedFlrAdy, flareDelegationAddress, MAX_BIPS } from '../data/constants'
import { sleep } from '../misc/time'


export async function delegate(ethereum: EIP1193Provider, address: string, args: []): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdy, wrappedFlrAbi, signer)
  await contract.delegate(flareDelegationAddress, MAX_BIPS)
}

export async function deposit(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<void> {
  await sleep(5_000)
  return
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdy, wrappedFlrAbi, signer)
  await contract.deposit({ value: args[0] })
}

export async function withdraw(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdy, wrappedFlrAbi, signer)
  await contract.withdraw(args[0])
}