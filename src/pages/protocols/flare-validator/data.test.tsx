import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock unixnow so the lockup math is deterministic. Pretend "now" is a
// round timestamp so the leftover-seconds calculation is easy to reason
// about across test cases.
const NOW = 1_700_000_000 // unix seconds, arbitrary fixed point
vi.mock('~/utils/misc/time', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/misc/time')>()
  return { ...actual, unixnow: () => NOW }
})

import { FlareValidatorDataAccess } from './data'
import type { AvalancheValidatorInfoDto } from '~/backendApi'

const infoOf = (overrides: Partial<AvalancheValidatorInfoDto> = {}): AvalancheValidatorInfoDto => ({
  apy: 0.07,
  minimumDelegated: 25,
  validatorAvailableCapacity: 1_000_000,
  validatorEndTime: NOW + 90 * 86_400, // 90 days of lockup available
  ...overrides,
} as AvalancheValidatorInfoDto)

beforeEach(() => {
  vi.clearAllMocks()
})

// --- getSummary --------------------------------------------------------

describe('FlareValidatorDataAccess.getSummary', () => {
  it("uses 'FLR' as the asset symbol", () => {
    expect(FlareValidatorDataAccess.getSummary(infoOf()).asset).toBe('FLR')
  })

  it('formats the APY through Formatter.percent', () => {
    expect(FlareValidatorDataAccess.getSummary(infoOf({ apy: 0.075 })).apy).toBe('7.5%')
  })

  it('renders the delegation range when min <= capacity', () => {
    const out = FlareValidatorDataAccess.getSummary(infoOf({
      minimumDelegated: 25,
      validatorAvailableCapacity: 1_000_000,
    }))
    expect(out.delegation).toBe('25 to 1M')
  })

  it('reports delegation as "Unavailable" when the capacity is exhausted (min > available)', () => {
    const out = FlareValidatorDataAccess.getSummary(infoOf({
      minimumDelegated: 1_000_000,
      validatorAvailableCapacity: 100,
    }))
    expect(out.delegation).toBe('Unavailable')
  })

  it('renders the lockup range when leftover >= 14 days', () => {
    // 90 days of lockup available — leftover is well above the 14d floor.
    const out = FlareValidatorDataAccess.getSummary(infoOf({
      validatorEndTime: NOW + 90 * 86_400,
    }))
    expect(out.lockup).toBe('14 to 90 days')
  })

  it('reports lockup as "Unavailable" when leftover is below 14 days', () => {
    const out = FlareValidatorDataAccess.getSummary(infoOf({
      validatorEndTime: NOW + 7 * 86_400, // only a week left
    }))
    expect(out.lockup).toBe('Unavailable')
  })
})
