import { describe, it, expect } from 'vitest'
import {
  chainFromRoute,
  chainIdToConfig,
  chainToChainId,
  chainToSymbol,
  symbolToChain,
} from './translations'
import { Chain } from '~/enums'
import {
  AVAX_SYMBOL,
  FLR_SYMBOL,
  SGB_SYMBOL,
  WFLR_SYMBOL,
  WSGB_SYMBOL,
  avalancheChainId,
  avalancheWalletConfig,
  flareChainId,
  flareWalletConfig,
  songbirdChainId,
  songbirdWalletConfig,
} from '~/constants'

// --- chainFromRoute -------------------------------------------------------

describe('chainFromRoute', () => {
  it('maps each protocol-route prefix to the right Chain enum value', () => {
    expect(chainFromRoute('/flare/validator')).toBe(Chain.FLARE)
    expect(chainFromRoute('/flare/fsp')).toBe(Chain.FLARE)
    expect(chainFromRoute('/songbird/fsp')).toBe(Chain.SONGBIRD)
    expect(chainFromRoute('/avalanche/validator')).toBe(Chain.AVALANCHE)
  })

  it('returns null for routes that match no chain keyword', () => {
    expect(chainFromRoute('/')).toBeNull()
    expect(chainFromRoute('/about')).toBeNull()
    expect(chainFromRoute('/contact')).toBeNull()
  })

  it('first-match wins (flare is checked before songbird before avalanche)', () => {
    expect(chainFromRoute('/flare-and-songbird-and-avalanche')).toBe(Chain.FLARE)
  })
})

// --- chainIdToConfig ------------------------------------------------------
//
// Used by switchNetworkIfNecessary's fallback to wallet_addEthereumChain.
// A previous version of this function had `chainId = C.songbirdChainId`
// (assignment, not comparison), so any non-Flare id silently returned the
// Songbird config — including Avalanche. The Avalanche branch was also
// missing entirely. These tests pin the corrected behaviour.

describe('chainIdToConfig', () => {
  it('returns the Flare wallet config for the Flare chain id', () => {
    expect(chainIdToConfig(flareChainId)).toBe(flareWalletConfig)
  })

  it('returns the Songbird wallet config for the Songbird chain id', () => {
    expect(chainIdToConfig(songbirdChainId)).toBe(songbirdWalletConfig)
  })

  it('returns the Avalanche wallet config for the Avalanche chain id', () => {
    // Regression: the original implementation lacked an Avalanche
    // branch + used `=` in the Songbird check, so Avalanche silently
    // received the Songbird config.
    expect(chainIdToConfig(avalancheChainId)).toBe(avalancheWalletConfig)
  })

  it('returns null for unknown chain ids', () => {
    expect(chainIdToConfig('0x1')).toBeNull()       // Ethereum mainnet
    expect(chainIdToConfig('0xdeadbeef')).toBeNull()
  })

  it('returns null for null input (no chain selected)', () => {
    expect(chainIdToConfig(null)).toBeNull()
  })
})

// --- symbolToChain --------------------------------------------------------
//
// Matches by token-string `.includes()` — so wrapped variants resolve to
// the same chain as the base token (WFLR → FLARE, WSGB → SONGBIRD).

describe('symbolToChain', () => {
  it('maps base tokens to their chain', () => {
    expect(symbolToChain(FLR_SYMBOL)).toBe(Chain.FLARE)
    expect(symbolToChain(SGB_SYMBOL)).toBe(Chain.SONGBIRD)
    expect(symbolToChain(AVAX_SYMBOL)).toBe(Chain.AVALANCHE)
  })

  it('maps wrapped variants to the same chain (substring match)', () => {
    expect(symbolToChain(WFLR_SYMBOL)).toBe(Chain.FLARE)   // 'WFLR' includes 'FLR'
    expect(symbolToChain(WSGB_SYMBOL)).toBe(Chain.SONGBIRD) // 'WSGB' includes 'SGB'
  })

  it('returns undefined for tokens that match no chain', () => {
    expect(symbolToChain('ETH')).toBeUndefined()
    expect(symbolToChain('')).toBeUndefined()
  })
})

// --- chainToChainId -------------------------------------------------------

describe('chainToChainId', () => {
  it('round-trips Chain enum values to their hex chain ids', () => {
    expect(chainToChainId(Chain.FLARE)).toBe(flareChainId)
    expect(chainToChainId(Chain.SONGBIRD)).toBe(songbirdChainId)
    expect(chainToChainId(Chain.AVALANCHE)).toBe(avalancheChainId)
  })

  it('returns null for an unrecognised Chain value', () => {
    expect(chainToChainId(99 as Chain)).toBeNull()
    expect(chainToChainId(null as never)).toBeNull()
  })
})

// --- chainToSymbol --------------------------------------------------------

describe('chainToSymbol', () => {
  it('round-trips Chain enum values to their base symbol', () => {
    expect(chainToSymbol(Chain.FLARE)).toBe(FLR_SYMBOL)
    expect(chainToSymbol(Chain.SONGBIRD)).toBe(SGB_SYMBOL)
    expect(chainToSymbol(Chain.AVALANCHE)).toBe(AVAX_SYMBOL)
  })

  it('returns null for an unrecognised Chain value', () => {
    expect(chainToSymbol(99 as Chain)).toBeNull()
  })
})

// --- Cross-function invariants -------------------------------------------
//
// The maps should be consistent end-to-end: any chain id we know about
// should round-trip through (id → Chain → id) without changing.

describe('chain mapping round-trip', () => {
  it.each([
    ['Flare', flareChainId, Chain.FLARE],
    ['Songbird', songbirdChainId, Chain.SONGBIRD],
    ['Avalanche', avalancheChainId, Chain.AVALANCHE],
  ])('%s: chainIdToConfig + chainToChainId agree on the chain id', (_name, chainId, chain) => {
    expect(chainToChainId(chain)).toBe(chainId)
    expect(chainIdToConfig(chainId)).not.toBeNull()
  })
})
