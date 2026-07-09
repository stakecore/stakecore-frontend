import { Chain } from "~/enums"
import { CHAIN_CONFIG, CHAIN_BY_HEX, CHAIN_LIST, type AddEthereumChainParams } from "~/config/chains"

export function chainFromRoute(route: string): Chain {
  // First-match wins in enum order (flare, songbird, avalanche).
  return CHAIN_LIST.find(c => route.includes(c.slug))?.id ?? null
}

export function chainIdToConfig(chainId: string | null): AddEthereumChainParams | null {
  if (chainId == null) return null
  return CHAIN_BY_HEX[chainId]?.walletConfig ?? null
}

export function symbolToChain(token: string): Chain {
  // Substring match, so wrapped variants resolve to the base chain
  // (WFLR → FLARE). Returns undefined (not null) when nothing matches.
  return CHAIN_LIST.find(c => token.includes(c.symbol))?.id
}

export function chainToChainId(chain: Chain): string | null {
  return CHAIN_CONFIG[chain]?.chainIdHex ?? null
}

export function chainToSymbol(chain: Chain): string | null {
  return CHAIN_CONFIG[chain]?.symbol ?? null
}
