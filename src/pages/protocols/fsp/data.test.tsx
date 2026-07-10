import { describe, it, expect } from 'vitest'
import FspDataLayer from './data'
import {
  flareEvmAddressUrl, flareFspAddressUrl,
  songbirdEvmAddressUrl, songbirdFspAddressUrl,
} from '~/constants'
import type { FspInfoDto, FspStatisticsDto } from '~/backendApi'
import type { ILink } from '../types'

// Builders keep the test bodies focused on the inputs that actually
// drive the assertion. Real backend DTOs have many fields the SUT
// doesn't read; we pass through only what it touches.

const infoOf = (overrides: Partial<FspInfoDto> = {}): FspInfoDto => ({
  apy: 0.05,
  providerFee: 0.2,
  delegationAddress: '0x0000000000000000000000000000000000000001',
  identityAddress: '0x0000000000000000000000000000000000000002',
  ...overrides,
} as FspInfoDto)

const statsOf = (apys: { rewardEpoch: number; apy: number }[]): FspStatisticsDto =>
  ({ apys: { result: apys } } as FspStatisticsDto)

// --- extractSummary -------------------------------------------------------

describe('FspDataLayer.extractSummary', () => {
  it("uses 'WFLR' as the asset symbol for the Flare chain", () => {
    const out = FspDataLayer.extractSummary('flare', infoOf(), statsOf([]))
    expect(out.asset).toBe('WFLR')
  })

  it("uses 'WSGB' as the asset symbol for any non-Flare chain (Songbird)", () => {
    const out = FspDataLayer.extractSummary('songbird', infoOf(), statsOf([]))
    expect(out.asset).toBe('WSGB')
  })

  it('reports delegation and lockup as "No Limit" — FSP has neither', () => {
    const out = FspDataLayer.extractSummary('flare', infoOf(), statsOf([]))
    expect(out.delegation).toBe('No Limit')
    expect(out.lockup).toBe('No Limit')
  })

  it("falls back to info.apy when statistics carries no APY history", () => {
    // Backend's info.apy is `0.04` here; statistics.apys.result is empty.
    const out = FspDataLayer.extractSummary('flare', infoOf({ apy: 0.04 }), statsOf([]))
    expect(out.apy).toBe('4%')
  })

  it('prefers the last APY entry from statistics.apys.result over info.apy', () => {
    // Backend's info.apy is one epoch behind the chart's latest point.
    // Card should match the chart — the most recent entry.
    const out = FspDataLayer.extractSummary(
      'flare',
      infoOf({ apy: 0.04 }),       // would render as 4%
      statsOf([                     // latest is 0.075 (= 7.5% exactly in IEEE-754)
        { rewardEpoch: 1, apy: 0.04 },
        { rewardEpoch: 2, apy: 0.06 },
        { rewardEpoch: 3, apy: 0.075 },
      ]),
    )
    expect(out.apy).toBe('7.5%')
  })
})

// --- extractSpecs ---------------------------------------------------------
//
// Now that the data layer returns { url, hash } (not <HashLink> JSX) the
// explorer URLs are directly assertable — this guards the regression where
// the Songbird page linked into the Flare explorers.

describe('FspDataLayer.extractSpecs', () => {
  const linkFor = (chain: string, title: string, info: FspInfoDto): ILink =>
    FspDataLayer.extractSpecs(chain, info).flat().find(s => s.title === title)!.value as ILink

  it('links the Flare specs to the Flare explorers', () => {
    const info = infoOf()
    expect(linkFor('flare', 'Delegation Address', info).url).toBe(flareEvmAddressUrl(info.delegationAddress))
    expect(linkFor('flare', 'Identity Address', info).url).toBe(flareFspAddressUrl(info.identityAddress))
  })

  it('links the Songbird specs to the Songbird explorers, not the Flare ones', () => {
    const info = infoOf()
    expect(linkFor('songbird', 'Delegation Address', info).url).toBe(songbirdEvmAddressUrl(info.delegationAddress))
    expect(linkFor('songbird', 'Identity Address', info).url).toBe(songbirdFspAddressUrl(info.identityAddress))
  })
})
