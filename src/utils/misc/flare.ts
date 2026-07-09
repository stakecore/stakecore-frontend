import { Chain } from "~/enums"
import { CHAIN_CONFIG } from "~/config/chains"

// Epoch parameters for the FTSO chains (Flare + Songbird), sourced from the
// shared chain config so the timestamps live in exactly one place.
export const FTSO_CHAIN_CONFIG = {
  [Chain.SONGBIRD]: CHAIN_CONFIG[Chain.SONGBIRD].epoch!,
  [Chain.FLARE]: CHAIN_CONFIG[Chain.FLARE].epoch!,
}

export namespace FspEpoch {

  export function currentRewardEpoch(chain: Chain): number {
    return timestampToRewardEpoch(chain, Date.now())
  }

  export function roundToTimestamp(chain: Chain, roundId: number): number {
    const fchain = chain as keyof typeof FTSO_CHAIN_CONFIG
    const { firstRoundTimestampMs, roundDurationMs } = FTSO_CHAIN_CONFIG[fchain]
    return firstRoundTimestampMs + roundId * roundDurationMs
  }
  export function timestampToRound(chain: Chain, timestamp: number): number {
    const fchain = chain as keyof typeof FTSO_CHAIN_CONFIG
    const { firstRoundTimestampMs, roundDurationMs } = FTSO_CHAIN_CONFIG[fchain]
    return Math.floor((timestamp - firstRoundTimestampMs) / roundDurationMs)
  }

  export function msUntilRound(chain: Chain, roundId: number): number {
    return Math.max(roundToTimestamp(chain, roundId) - Date.now(), 0)
  }
  export function msAfterRound(chain: Chain, roundId: number): number {
    return Math.max(Date.now() - roundToTimestamp(chain, roundId), 0)
  }
  export function msUntilRewardEpoch(chain: Chain, epoch: number): number {
    const fchain = chain as keyof typeof FTSO_CHAIN_CONFIG
    const { rewardEpochDurationRounds } = FTSO_CHAIN_CONFIG[fchain]
    return msUntilRound(chain, epoch * rewardEpochDurationRounds)
  }

  export function roundToRewardEpoch(chain: Chain, roundId: number): number {
    const fchain = chain as keyof typeof FTSO_CHAIN_CONFIG
    const { rewardEpochDurationRounds } = FTSO_CHAIN_CONFIG[fchain]
    return Math.floor(roundId / rewardEpochDurationRounds)
  }

  export function timestampToRewardEpoch(chain: Chain, timestamp: number): number {
    return roundToRewardEpoch(chain, timestampToRound(chain, timestamp))
  }
}