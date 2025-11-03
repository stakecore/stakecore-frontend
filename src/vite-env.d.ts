/// <reference types="vite/client" />
interface EIP6963ProviderInfo {
  walletId: string
  uuid: string
  name: string
  icon: string
}

// Represents the structure of an Ethereum provider based on the EIP-1193 standard.
interface EIP1193Provider {
  isStatus?: boolean
  host?: string
  path?: string
  sendAsync?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void
  send?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void
  request: (request: { method: string, params?: Array<unknown> }) => Promise<unknown>
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EIP1193Provider
}

// This type represents the structure of an event dispatched by a wallet to announce its presence based on EIP-6963.
type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo,
    provider: EIP1193Provider
  }
}

// Global interface for storing the internal component state
interface GlobalState {
  walletProvider: EIP6963ProviderDetail | null
  setWalletProvider: (provider: EIP6963ProviderDetail) => void
  walletAddress: string | null
  setWalletAddress: (address: string, provider?: EIP6963ProviderDetail) => void
  walletChoiceVisible: boolean
  setWalletChoiceVisible: (visible: boolean) => void
  chain: string | null
  setChain: (chain: string | null) => void
}

// Global interface for storing the external browser wallet state.
interface ExternalState {
  walletProviders: EIP6963ProviderDetail[]
}