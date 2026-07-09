import { Chain } from "~/enums"
import * as C from "~/constants"

import flareBg from "~/assets/images/protocols/flare/symbol.svg?url"
import songbirdBg from "~/assets/images/protocols/songbird/symbol.svg?url"
import avalancheBg from "~/assets/images/protocols/avalanche/symbol.svg?url"
import flareLogo from "~/assets/images/tokens/FLR.svg"
import songbirdLogo from "~/assets/images/tokens/SGB.svg"
import avalancheLogo from "~/assets/images/tokens/AVAX.svg"


// Single source of truth for per-chain identity. Every per-chain lookup —
// name/symbol, hex chain id, wallet-add config, explorer URLs, background
// art, FTSO epoch config — is derived from this record instead of the
// hand-written if/else hubs that used to live across constants.ts,
// translations.ts, layout/root.tsx and recentActivity.tsx.
//
// The primitive values (URL builders, wallet configs, colours, epoch
// configs) still live in constants.ts; this module composes them, so there
// is no literal duplication and nothing to drift. Optional fields encode
// protocol availability in the type system: Avalanche is validator-only, so
// it has no FSP explorer / wrappedSymbol / epoch.

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

export const CHAIN_CONFIG: Record<Chain, ChainConfig> = {
  [Chain.FLARE]: {
    id: Chain.FLARE,
    slug: "flare",
    name: C.CHAIN_NAME[Chain.FLARE],
    symbol: C.FLR_SYMBOL,
    wrappedSymbol: C.WFLR_SYMBOL,
    decimals: C.FLR_DECIMALS,
    color: C.FLARE_COLOR_CODE,
    hrp: C.HRP.flare,
    chainIdHex: C.flareChainId,
    walletConfig: C.flareWalletConfig,
    background: { image: flareBg, className: "bg-flare" },
    logo: flareLogo,
    explorers: {
      evmAddress: C.flareEvmAddressUrl,
      evmTx: C.flareEvmTransactionUrl,
      fspAddress: C.flareFspAddressUrl,
      pChainAddress: C.flarePChainAddressUrl,
      pChainTx: C.flarePChainTransactionUrl,
      validator: C.flareValidatorUrl,
    },
    epoch: C.flareEpochConfig,
    video: { fsp: C.FLARE_FSP_VIDEO_ID, validator: C.FLARE_VALIDATOR_VIDEO_ID },
  },
  [Chain.SONGBIRD]: {
    id: Chain.SONGBIRD,
    slug: "songbird",
    name: C.CHAIN_NAME[Chain.SONGBIRD],
    symbol: C.SGB_SYMBOL,
    wrappedSymbol: C.WSGB_SYMBOL,
    decimals: C.SGB_DECIMALS,
    color: C.SONGBIRD_COLOR_CODE,
    hrp: C.HRP.songbird,
    chainIdHex: C.songbirdChainId,
    walletConfig: C.songbirdWalletConfig,
    background: { image: songbirdBg, className: "bg-songbird" },
    logo: songbirdLogo,
    explorers: {
      evmAddress: C.songbirdEvmAddressUrl,
      evmTx: C.songbirdEvmTransactionUrl,
      fspAddress: C.songbirdFspAddressUrl,
    },
    epoch: C.songbirdEpochConfig,
    video: { fsp: C.SONGBIRD_FSP_VIDEO_ID },
  },
  [Chain.AVALANCHE]: {
    id: Chain.AVALANCHE,
    slug: "avalanche",
    name: C.CHAIN_NAME[Chain.AVALANCHE],
    symbol: C.AVAX_SYMBOL,
    decimals: C.AVAX_DECIMALS,
    color: C.AVALANCHE_COLOR_CODE,
    hrp: C.HRP.avalanche,
    chainIdHex: C.avalancheChainId,
    walletConfig: C.avalancheWalletConfig,
    background: { image: avalancheBg, className: "bg-avalanche" },
    logo: avalancheLogo,
    explorers: {
      pChainAddress: C.avalanchePChainAddressUrl,
      pChainTx: C.avalanchePChainTransactionUrl,
      validator: C.avalancheValidatorUrl,
    },
    video: { validator: C.AVALANCHE_VALIDATOR_VIDEO_ID },
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
