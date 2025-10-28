import { BrowserProvider, Contract } from 'ethers'
import { wrappedFlrAbi, wrappedFlrAdr, flareDelegationAdr, fspRewardManagerAdr, fspRewardManagerAbi, flareValidatorAdr } from '../data/constants'


export async function delegate(ethereum: EIP1193Provider, address: string, args: [number]): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdr, wrappedFlrAbi, signer)
  await contract.delegate(flareDelegationAdr, args[0])
}

export async function deposit(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdr, wrappedFlrAbi, signer)
  await contract.deposit({ value: args[0] })
}

export async function withdraw(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(wrappedFlrAdr, wrappedFlrAbi, signer)
  await contract.withdraw(args[0])
}

export async function claim(ethereum: EIP1193Provider, address: string, args: [number]): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner(address)
  const contract = new Contract(fspRewardManagerAdr, fspRewardManagerAbi, signer)
  await contract.claim(address, address, args[0], true, [])
}