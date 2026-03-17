import type { ISummary, ISpecs } from "~/components/types"
import type { AvalancheValidatorInfoDto } from "~/backendApi"

export type AvalancheData = {
  base: AvalancheValidatorInfoDto
  summary: ISummary
  specs: ISpecs
  graphics: IGraphics
  delegation: IDelegation
}

export type IGraphics = {
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
  validatorLink: any
}

type IMeterBar = {
  percent: number
  amount?: string
}