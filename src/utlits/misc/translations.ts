import { flareChainConfig, flareChainId, songbirdChainConfig, songbirdChainId } from "../data/constants"

export function chainFromRoute(route: string): string | null {
  let chain = null
  if (route.includes('flare')) {
    chain = 'flare'
  } else if (route.includes('songbird')) {
    chain = 'songbird'
  } else if (route.includes('avalanche')) {
    chain = 'avalanche'
  }
  return chain
}

export function chainIdToConfig(chainId: string | null): any {
  if (chainId == flareChainId) {
    return flareChainConfig
  } else if (chainId = songbirdChainId) {
    return songbirdChainConfig
  } else {
    return null
  }
}

export function tokenToNetwork(token: string): any {
  if (token.includes('FLR')) {
    return 'flare'
  } else if (token.includes('SGB')) {
    return 'songbird'
  } else if (token.includes('AVAX')) {
    return 'avalanche'
  }
}