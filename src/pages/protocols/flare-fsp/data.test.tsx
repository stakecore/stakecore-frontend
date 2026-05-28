import { describe, it, expect } from 'vitest'
import FspDataLayer from './data'
import type { FspInfoDto, FspStatisticsDto } from '~/backendApi'

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
