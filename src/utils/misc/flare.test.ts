import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FspEpoch, FTSO_CHAIN_CONFIG } from './flare'
import { Chain } from '~/enums'

// Both Flare + Songbird configs share roundDurationMs = 90_000 and
// rewardEpochDurationRounds = 3360. The two chains differ only in their
// firstRoundTimestampMs — pulling those into local constants keeps the
// arithmetic explicit in each assertion.
const FLARE_FIRST = FTSO_CHAIN_CONFIG[Chain.FLARE].firstRoundTimestampMs
const SONGBIRD_FIRST = FTSO_CHAIN_CONFIG[Chain.SONGBIRD].firstRoundTimestampMs
const ROUND_MS = 90_000
const EPOCH_ROUNDS = 3360

// --- timestamp / round conversions ----------------------------------------

describe('FspEpoch.roundToTimestamp', () => {
  it('returns the first-round timestamp for round 0', () => {
    expect(FspEpoch.roundToTimestamp(Chain.FLARE, 0)).toBe(FLARE_FIRST)
    expect(FspEpoch.roundToTimestamp(Chain.SONGBIRD, 0)).toBe(SONGBIRD_FIRST)
  })

  it('advances by roundDurationMs per round', () => {
    expect(FspEpoch.roundToTimestamp(Chain.FLARE, 1)).toBe(FLARE_FIRST + ROUND_MS)
    expect(FspEpoch.roundToTimestamp(Chain.FLARE, 100)).toBe(FLARE_FIRST + 100 * ROUND_MS)
  })
})

describe('FspEpoch.timestampToRound', () => {
  it('returns 0 at the first-round timestamp', () => {
    expect(FspEpoch.timestampToRound(Chain.FLARE, FLARE_FIRST)).toBe(0)
  })

  it('floors to the round whose window contains the timestamp', () => {
    // 1ms before the second round still belongs to round 0.
    expect(FspEpoch.timestampToRound(Chain.FLARE, FLARE_FIRST + ROUND_MS - 1)).toBe(0)
    // Exactly on the boundary is the next round.
    expect(FspEpoch.timestampToRound(Chain.FLARE, FLARE_FIRST + ROUND_MS)).toBe(1)
  })

  it('round-trips with roundToTimestamp', () => {
    const round = 12345
    const ts = FspEpoch.roundToTimestamp(Chain.FLARE, round)
    expect(FspEpoch.timestampToRound(Chain.FLARE, ts)).toBe(round)
  })
})

// --- ms-until / ms-after --------------------------------------------------

describe('FspEpoch.msUntilRound / msAfterRound', () => {
  beforeAll(() => { vi.useFakeTimers() })
  afterAll(() => { vi.useRealTimers() })

  it('msUntilRound returns the gap from now to the round start', () => {
    // Pretend now is exactly at the start of round 0.
    vi.setSystemTime(FLARE_FIRST)
    expect(FspEpoch.msUntilRound(Chain.FLARE, 1)).toBe(ROUND_MS)
    expect(FspEpoch.msUntilRound(Chain.FLARE, 10)).toBe(10 * ROUND_MS)
  })

  it('msUntilRound clamps to 0 when the round is already in the past', () => {
    vi.setSystemTime(FLARE_FIRST + 5 * ROUND_MS)
    expect(FspEpoch.msUntilRound(Chain.FLARE, 1)).toBe(0)
    expect(FspEpoch.msUntilRound(Chain.FLARE, 0)).toBe(0)
  })

  it('msAfterRound returns the gap from the round start to now', () => {
    vi.setSystemTime(FLARE_FIRST + 5 * ROUND_MS + 1000)
    expect(FspEpoch.msAfterRound(Chain.FLARE, 5)).toBe(1000)
    expect(FspEpoch.msAfterRound(Chain.FLARE, 0)).toBe(5 * ROUND_MS + 1000)
  })

  it('msAfterRound clamps to 0 when the round is still in the future', () => {
    vi.setSystemTime(FLARE_FIRST)
    expect(FspEpoch.msAfterRound(Chain.FLARE, 10)).toBe(0)
  })
})

// --- reward epoch math ----------------------------------------------------

describe('FspEpoch.roundToRewardEpoch', () => {
  it('groups every 3360 rounds into one reward epoch', () => {
    expect(FspEpoch.roundToRewardEpoch(Chain.FLARE, 0)).toBe(0)
    expect(FspEpoch.roundToRewardEpoch(Chain.FLARE, EPOCH_ROUNDS - 1)).toBe(0)
    expect(FspEpoch.roundToRewardEpoch(Chain.FLARE, EPOCH_ROUNDS)).toBe(1)
    expect(FspEpoch.roundToRewardEpoch(Chain.FLARE, 5 * EPOCH_ROUNDS + 10)).toBe(5)
  })
})

describe('FspEpoch.msUntilRewardEpoch', () => {
  beforeAll(() => { vi.useFakeTimers() })
  afterAll(() => { vi.useRealTimers() })

  it('returns the ms until the round at epoch * 3360 starts', () => {
    vi.setSystemTime(FLARE_FIRST)
    // Reward epoch 1 starts at round 3360 → 3360 × 90_000 ms from t=0.
    expect(FspEpoch.msUntilRewardEpoch(Chain.FLARE, 1)).toBe(EPOCH_ROUNDS * ROUND_MS)
  })
})

describe('FspEpoch.currentRewardEpoch', () => {
  beforeAll(() => { vi.useFakeTimers() })
  afterAll(() => { vi.useRealTimers() })

  it('returns the reward epoch containing "now"', () => {
    // Set "now" to mid-way through reward epoch 7.
    const sevenAndAHalf = FLARE_FIRST + (7 * EPOCH_ROUNDS + 1000) * ROUND_MS
    vi.setSystemTime(sevenAndAHalf)
    expect(FspEpoch.currentRewardEpoch(Chain.FLARE)).toBe(7)
  })
})
