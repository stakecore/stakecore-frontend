import type { Chain } from "~/enums"
import { CHAIN_CONFIG, CHAIN_BY_HEX, CHAIN_LIST, type AddEthereumChainParams } from "~/config/chains"

// Signatures below spell out the "no match" case each function already
// returns (and its tests already assert). They previously claimed to return a
// plain Chain, so every caller was implicitly promised a value that isn't
// there on /, /about and /contact.
export function chainFromRoute(route: string): Chain | null {
  // First-match wins in enum order (flare, songbird, avalanche).
  return CHAIN_LIST.find(c => route.includes(c.slug))?.id ?? null
}

export function chainIdToConfig(chainId: string | null): AddEthereumChainParams | null {
  if (chainId == null) return null
  return CHAIN_BY_HEX[chainId]?.walletConfig ?? null
}

export function symbolToChain(token: string): Chain | undefined {
  // Substring match, so wrapped variants resolve to the base chain
  // (WFLR → FLARE). Returns undefined (not null) when nothing matches.
  return CHAIN_LIST.find(c => token.includes(c.symbol))?.id
}

// Both accept null so the chainFromRoute result can be piped straight in —
// the optional-chain already handles it, and the tests cover it.
export function chainToChainId(chain: Chain | null): string | null {
  return CHAIN_CONFIG[chain as Chain]?.chainIdHex ?? null
}

export function chainToSymbol(chain: Chain | null): string | null {
  return CHAIN_CONFIG[chain as Chain]?.symbol ?? null
}
