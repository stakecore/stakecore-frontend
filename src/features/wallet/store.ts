import { create } from 'zustand'


// Wallet + chain-session store shape. (Was a global ambient in vite-env.d.ts;
// co-located here so changes have an import trail.)
export interface GlobalState {
  walletProvider: EIP6963ProviderDetail | null
  setWalletProvider: (provider: EIP6963ProviderDetail) => void
  walletAddress: string | null
  // null clears the session — the disconnect / rejected-switch paths call
  // setWalletAddress(null, null) to drop the address and the provider
  // together. The signature used to say `string`, which made those the one
  // set of call sites the type checker couldn't see.
  setWalletAddress: (address: string | null, provider?: EIP6963ProviderDetail | null) => void
  walletChoiceVisible: boolean
  setWalletChoiceVisible: (visible: boolean) => void
  chain: string | null
  setChain: (chain: string | null) => void
}

export const useGlobalStore = create<GlobalState>((set) => ({
  walletProvider: null,
  setWalletProvider: (provider: EIP6963ProviderDetail) => set({ walletProvider: provider }),
  walletAddress: null,
  setWalletAddress: (address: string | null, provider?: EIP6963ProviderDetail | null) => set(state => ({
    walletAddress: address,
    walletProvider: (provider === undefined) ? state.walletProvider : provider
  })),
  walletChoiceVisible: false,
  setWalletChoiceVisible: (visible: boolean) => set({ walletChoiceVisible: visible }),
  chain: null,
  setChain: (chain: string | null) => set({ chain })
}))