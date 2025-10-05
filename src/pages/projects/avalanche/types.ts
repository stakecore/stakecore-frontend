import { AvalancheInfoDto } from "~/backendApi"

export type AvalancheData = {
  base: AvalancheInfoDto
  summary: ISummary
  specs: ISpecs
  graphics: IGraphics
  delegation: IDelegation
}

export type ISpecs = ISpec[][]
export type ISpec = {
  title: string
  value: any
  tooltip?: string
}

export type ISummary = {
  asset: string
  apy: string
  risk: string
  lockup: string
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