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
    validatorLeftoverCapacity: IMeterBar
    validatorLeftoverDuration: IMeterBar
  }
  countdown: {
    endTime: Date
  }
}

export type IDelegation = {
  validatorLink: any
}

type IMeterBar = {
  percent: number
  amount?: string
}