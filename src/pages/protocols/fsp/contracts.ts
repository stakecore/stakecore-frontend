import { BrowserProvider, Contract } from 'ethers'


// Per-chain contract addresses/ABIs. The FSP contract flow is identical
// across chains (wrap / unwrap / delegate on the wrapped-native token, claim
// on the reward manager) — only these targets differ.
export interface FspContractConfig {
  wrappedAdr: string
  wrappedAbi: string[]
  rewardManagerAdr: string
  rewardManagerAbi: string[]
  delegationAdr: string
}

export interface FspContractApi {
  delegate: (ethereum: EIP1193Provider, address: string, args: [number]) => Promise<string>
  deposit: (ethereum: EIP1193Provider, address: string, args: [bigint]) => Promise<string>
  withdraw: (ethereum: EIP1193Provider, address: string, args: [bigint]) => Promise<string>
  claim: (ethereum: EIP1193Provider, address: string, args: [number]) => Promise<string>
}

// Each function submits a tx, then awaits one confirmation via tx.wait(1)
// so on-chain reverts surface as exceptions (caught by contractCallAdapter)
// and the returned hash is from a mined transaction the user can verify
// on an explorer.
export function createFspContracts(cfg: FspContractConfig): FspContractApi {
  async function delegate(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
    const provider = new BrowserProvider(ethereum)
    const signer = await provider.getSigner(address)
    const contract = new Contract(cfg.wrappedAdr, cfg.wrappedAbi, signer)
    const tx = await contract.delegate(cfg.delegationAdr, args[0])
    await tx.wait(1)
    return tx.hash
  }

  async function deposit(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
    const provider = new BrowserProvider(ethereum)
    const signer = await provider.getSigner(address)
    const contract = new Contract(cfg.wrappedAdr, cfg.wrappedAbi, signer)
    const tx = await contract.deposit({ value: args[0] })
    await tx.wait(1)
    return tx.hash
  }

  async function withdraw(ethereum: EIP1193Provider, address: string, args: [bigint]): Promise<string> {
    const provider = new BrowserProvider(ethereum)
    const signer = await provider.getSigner(address)
    const contract = new Contract(cfg.wrappedAdr, cfg.wrappedAbi, signer)
    const tx = await contract.withdraw(args[0])
    await tx.wait(1)
    return tx.hash
  }

  async function claim(ethereum: EIP1193Provider, address: string, args: [number]): Promise<string> {
    const provider = new BrowserProvider(ethereum)
    const signer = await provider.getSigner(address)
    const contract = new Contract(cfg.rewardManagerAdr, cfg.rewardManagerAbi, signer)
    const tx = await contract.claim(address, address, args[0], true, [])
    await tx.wait(1)
    return tx.hash
  }

  return { delegate, deposit, withdraw, claim }
}
