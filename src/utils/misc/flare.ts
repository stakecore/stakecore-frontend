import { Chain } from "~/enums"
import { CHAIN_CONFIG, type EpochConfig } from "~/config/chains"

// Epoch parameters for the FTSO chains (Flare + Songbird), sourced from the
// shared chain config so the timestamps live in exactly one place.
export const FTSO_CHAIN_CONFIG = {
  [Chain.SONGBIRD]: CHAIN_CONFIG[Chain.SONGBIRD].epoch!,
  [Chain.FLARE]: CHAIN_CONFIG[Chain.FLARE].epoch!,
}

// Single guarded lookup instead of a `chain as keyof …` cast scattered at
// every call site. FTSO only exists on Flare + Songbird, so a non-FTSO chain
// (Avalanche) throws an explicit error rather than silently destructuring
// `undefined`.
function ftsoConfig(chain: Chain): EpochConfig {
  const cfg = FTSO_CHAIN_CONFIG[chain as keyof typeof FTSO_CHAIN_CONFIG]
  if (cfg == null) {
    throw new Error(`FspEpoch: no FTSO config for chain ${chain} — FTSO is Flare/Songbird only`)
  }
  return cfg
}

export namespace FspEpoch {

  export function currentRewardEpoch(chain: Chain): number {
    return timestampToRewardEpoch(chain, Date.now())
  }

  export function roundToTimestamp(chain: Chain, roundId: number): number {
    const { firstRoundTimestampMs, roundDurationMs } = ftsoConfig(chain)
    return firstRoundTimestampMs + roundId * roundDurationMs
  }
  export function timestampToRound(chain: Chain, timestamp: number): number {
    const { firstRoundTimestampMs, roundDurationMs } = ftsoConfig(chain)
    return Math.floor((timestamp - firstRoundTimestampMs) / roundDurationMs)
  }

  export function msUntilRound(chain: Chain, roundId: number): number {
    return Math.max(roundToTimestamp(chain, roundId) - Date.now(), 0)
  }
  export function msAfterRound(chain: Chain, roundId: number): number {
    return Math.max(Date.now() - roundToTimestamp(chain, roundId), 0)
  }
  export function msUntilRewardEpoch(chain: Chain, epoch: number): number {
    const { rewardEpochDurationRounds } = ftsoConfig(chain)
    return msUntilRound(chain, epoch * rewardEpochDurationRounds)
  }

  export function roundToRewardEpoch(chain: Chain, roundId: number): number {
    const { rewardEpochDurationRounds } = ftsoConfig(chain)
    return Math.floor(roundId / rewardEpochDurationRounds)
  }

  export function timestampToRewardEpoch(chain: Chain, timestamp: number): number {
    return roundToRewardEpoch(chain, timestampToRound(chain, timestamp))
  }
}