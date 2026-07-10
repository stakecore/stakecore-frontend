import type { ISummary, ISpecs, ILink } from "../types"
import type { PChainValidatorInfoDto } from "~/backendApi"

// Shared shape for a single validator's page data, used by both the Flare
// and Avalanche validator routes.
export type ValidatorData = {
  base: PChainValidatorInfoDto
  summary: ISummary
  specs: ISpecs
  graphics: IGraphics
  delegation: IDelegation
}

export type IGraphics = {
  // Context block at the top of the statistics card — small stats row
  // (delegators, networkShare) plus a stacked-bar capacity breakdown.
  // networkShare is a 0..1 ratio; capacity amounts are absolute, in
  // the chain's native token.
  stats: {
    delegators: number
    networkShare: number
    capacity: {
      asset: string
      ownedStake: number
      delegated: number
      available: number
    }
  }
  meterBar: {
    validatorUptime: IMeterBar
    validatorConnectedPChain: IMeterBar
    validatorConnectedCChain: IMeterBar
    validatorConnectedXChain: IMeterBar
  }
  countdown: {
    startTimeMs: number
    endTimeMs: number
  }
}

export type IDelegation = {
  validatorLink: ILink
}

type IMeterBar = {
  percent: number
  amount?: string
}
