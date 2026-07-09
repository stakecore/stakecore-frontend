import { Chain } from "~/enums"

import flareBg from "~/assets/images/protocols/flare/symbol.svg?url"
import songbirdBg from "~/assets/images/protocols/songbird/symbol.svg?url"
import avalancheBg from "~/assets/images/protocols/avalanche/symbol.svg?url"
import flareLogo from "~/assets/images/tokens/FLR.svg"
import songbirdLogo from "~/assets/images/tokens/SGB.svg"
import avalancheLogo from "~/assets/images/tokens/AVAX.svg"


// Single source of truth for per-chain identity. Every per-chain lookup —
// name/symbol, hex chain id, wallet-add config, explorer URLs, background
// art, FTSO epoch config — is derived from this record. constants.ts
// re-exports the individual values (FLR_SYMBOL, flareWalletConfig, …) from
// here for backward compatibility, so this module is the one place a new
// chain's identity is defined.
//
// Optional fields encode protocol availability in the type system: Avalanche
// is validator-only, so it has no FSP explorer / wrappedSymbol / epoch.

export interface AddEthereumChainParams {
  chainName: string
  chainId: string
  nativeCurrency: { name: string; decimals: number; symbol: string }
  rpcUrls: string[]
}

export interface ChainExplorers {
  evmAddress?: (address: string) => string
  evmTx?: (hash: string) => string
  fspAddress?: (address: string) => string
  pChainAddress?: (address: string) => string
  pChainTx?: (hash: string) => string
  validator?: (nodeId: string) => string
}

export interface EpochConfig {
  roundDurationMs: number
  firstRoundTimestampMs: number
  rewardEpochDurationRounds: number
}

export interface ChainConfig {
  id: Chain
  slug: string                    // backend string + route segment ('flare')
  name: string                    // 'Flare'
  symbol: string                  // 'FLR'
  wrappedSymbol?: string          // 'WFLR' (FSP chains only)
  decimals: number
  color: string                   // brand colour code
  hrp: string                     // bech32 human-readable part
  chainIdHex: string              // EIP-155 chain id, '0xe'
  walletConfig: AddEthereumChainParams
  background: { image: string; className: string }
  logo: string                    // token svg (activity marquee)
  explorers: ChainExplorers
  epoch?: EpochConfig             // FTSO/FSP chains only
  video?: { fsp?: string; validator?: string }
}

// Explorer bases — internal to this module (only used to build the URL
// helpers below; nothing imports them directly).
const flareEvmExplorer = 'https://flare-explorer.flare.network'
const flareFspExplorer = 'https://flare-systems-explorer.flare.network'
const flarePChainExplorer = 'https://flare.space/dapp/p-chain-explorer'
const songbirdEvmExplorer = 'https://songbird-explorer.flare.network'
const songbirdFspExplorer = 'https://songbird-systems-explorer.flare.network'
const avalancheExplorer = 'https://subnets.avax.network'

export const CHAIN_CONFIG: Record<Chain, ChainConfig> = {
  [Chain.FLARE]: {
    id: Chain.FLARE,
    slug: "flare",
    name: "Flare",
    symbol: "FLR",
    wrappedSymbol: "WFLR",
    decimals: 18,
    color: "#E62058",
    hrp: "flare",
    chainIdHex: "0xe",
    walletConfig: {
      chainName: "Flare Network",
      chainId: "0xe",
      nativeCurrency: { name: "FLR", decimals: 18, symbol: "FLR" },
      rpcUrls: ["https://flare-api.flare.network/ext/C/rpc"],
    },
    background: { image: flareBg, className: "bg-flare" },
    logo: flareLogo,
    explorers: {
      evmAddress: a => `${flareEvmExplorer}/address/${a}`,
      evmTx: h => `${flareEvmExplorer}/tx/${h}`,
      fspAddress: a => `${flareFspExplorer}/providers/fsp/${a}`,
      pChainAddress: a => `${flarePChainExplorer}/address/${a}`,
      pChainTx: h => `${flarePChainExplorer}/tx/${h}`,
      validator: nodeId => `${flarePChainExplorer}/validator/${nodeId}`,
    },
    epoch: { roundDurationMs: 90_000, firstRoundTimestampMs: 1658430000_000, rewardEpochDurationRounds: 3360 },
    video: { fsp: "3_APLXFycOU", validator: "JkYJ5wUi4Vc" },
  },
  [Chain.SONGBIRD]: {
    id: Chain.SONGBIRD,
    slug: "songbird",
    name: "Songbird",
    symbol: "SGB",
    wrappedSymbol: "WSGB",
    decimals: 18,
    color: "#253c4d",
    hrp: "songbird",
    chainIdHex: "0x13",
    walletConfig: {
      chainName: "Songbird Canary Network",
      chainId: "0x13",
      nativeCurrency: { name: "SGB", decimals: 18, symbol: "SGB" },
      rpcUrls: ["https://songbird-api.flare.network/ext/C/rpc"],
    },
    background: { image: songbirdBg, className: "bg-songbird" },
    logo: songbirdLogo,
    explorers: {
      evmAddress: a => `${songbirdEvmExplorer}/address/${a}`,
      evmTx: h => `${songbirdEvmExplorer}/tx/${h}`,
      fspAddress: a => `${songbirdFspExplorer}/providers/fsp/${a}`,
    },
    epoch: { roundDurationMs: 90_000, firstRoundTimestampMs: 1658429955_000, rewardEpochDurationRounds: 3360 },
    video: { fsp: "3_APLXFycOU" },
  },
  [Chain.AVALANCHE]: {
    id: Chain.AVALANCHE,
    slug: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
    color: "#FF394A",
    hrp: "avax",
    chainIdHex: "0xa86a",
    walletConfig: {
      chainName: "Avalanche (C chain)",
      chainId: "0xa86a",
      nativeCurrency: { name: "AVAX", decimals: 18, symbol: "AVAX" },
      rpcUrls: ["https://avalanche-c-chain-rpc.publicnode.com"],
    },
    background: { image: avalancheBg, className: "bg-avalanche" },
    logo: avalancheLogo,
    explorers: {
      pChainAddress: a => `${avalancheExplorer}/p-chain/address/${a}`,
      pChainTx: h => `${avalancheExplorer}/p-chain/tx/${h}`,
      validator: nodeId => `${avalancheExplorer}/validators/${nodeId}`,
    },
    video: { validator: "wRPxDEMgDdM" },
  },
}

// Reverse lookup by EIP-155 hex chain id (as reported by the wallet).
export const CHAIN_BY_HEX: Record<string, ChainConfig> = Object.fromEntries(
  Object.values(CHAIN_CONFIG).map(c => [c.chainIdHex, c])
)

// Ordered list — Object.values order is the enum order (Flare, Songbird,
// Avalanche), which the route/symbol first-match lookups rely on.
export const CHAIN_LIST: ChainConfig[] = Object.values(CHAIN_CONFIG)

// Lookup tolerant of the backend's numeric chain ids (DTO enums are a
// distinct nominal type from Chain, so callers can't index CHAIN_CONFIG
// with them directly). Returns undefined for an unknown chain.
export function chainConfig(id: number): ChainConfig | undefined {
  return CHAIN_CONFIG[id as Chain]
}
