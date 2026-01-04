import { Chain } from "~/enums"
import  * as C from "../../constants"

export function chainFromRoute(route: string): Chain {
  let chain = null
  if (route.includes('flare')) {
    chain = Chain.FLARE
  } else if (route.includes('songbird')) {
    chain = Chain.SONGBIRD
  } else if (route.includes('avalanche')) {
    chain = Chain.AVALANCHE
  }
  return chain
}

export function chainIdToConfig(chainId: string | null): any {
  if (chainId == C.flareChainId) {
    return C.flareWalletConfig
  } else if (chainId = C.songbirdChainId) {
    return C.songbirdWalletConfig
  } else {
    return null
  }
}

export function symbolToChain(token: string): Chain {
  if (token.includes(C.FLR_SYMBOL)) {
    return Chain.FLARE
  } else if (token.includes(C.SGB_SYMBOL)) {
    return Chain.SONGBIRD
  } else if (token.includes(C.AVAX_SYMBOL)) {
    return Chain.AVALANCHE
  }
}

export function chainToChainId(chain: Chain): string | null {
  if (chain == Chain.FLARE) {
    return C.flareChainId
  } else if (chain == Chain.SONGBIRD) {
    return C.songbirdChainId
  } else if (chain == Chain.AVALANCHE) {
    return C.avalancheChainId
  } else {
    return null
  }
}

export function chainToSymbol(chain: Chain): string | null {
  if (chain == Chain.FLARE) {
    return C.FLR_SYMBOL
  } else if (chain == Chain.SONGBIRD) {
    return C.SGB_SYMBOL
  } else if (chain == Chain.AVALANCHE) {
    return C.AVAX_SYMBOL
  } else {
    return null
  }
}
