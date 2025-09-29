import { BrowserProvider, Contract } from 'ethers'
import { useGlobalStore } from '../store/global'
import { wrappedFlrAbi, wrappedFlrAdy, flareDelegationAddress, MAX_BIPS } from '../data/constants'


export async function delegate(ethereum: EIP1193Provider): Promise<void> {
  const provider = new BrowserProvider(ethereum)
  const { walletAddress } = useGlobalStore.getState()
  const signer = await provider.getSigner(walletAddress)
  const contract = new Contract(wrappedFlrAdy, wrappedFlrAbi, signer)
  await contract.delegate(flareDelegationAddress, MAX_BIPS)
}