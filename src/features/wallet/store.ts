import { create } from 'zustand'


// Wallet + chain-session store shape. (Was a global ambient in vite-env.d.ts;
// co-located here so changes have an import trail.)
export interface GlobalState {
  walletProvider: EIP6963ProviderDetail | null
  setWalletProvider: (provider: EIP6963ProviderDetail) => void
  walletAddress: string | null
  setWalletAddress: (address: string, provider?: EIP6963ProviderDetail) => void
  walletChoiceVisible: boolean
  setWalletChoiceVisible: (visible: boolean) => void
  chain: string | null
  setChain: (chain: string | null) => void
}

export const useGlobalStore = create<GlobalState>((set) => ({
  walletProvider: null,
  setWalletProvider: (provider: EIP6963ProviderDetail) => set({ walletProvider: provider }),
  walletAddress: null,
  setWalletAddress: (address: string, provider?: EIP6963ProviderDetail) => set(state => ({
    walletAddress: address,
    walletProvider: (provider === undefined) ? state.walletProvider : provider
  })),
  walletChoiceVisible: false,
  setWalletChoiceVisible: (visible: boolean) => set({ walletChoiceVisible: visible }),
  chain: null,
  setChain: (chain: string | null) => set({ chain })
}))