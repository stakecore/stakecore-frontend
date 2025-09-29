export type AvalancheData = {
  base: BaseData
  summary: ISummary
  specs: ISpecs
  graphics: IGraphics
}

export type BaseData = {
  validatorNodeId: string
  validatorTransaction: string
  apy: number
  risk: string
  validatorFee: number
  validatorStake: number
  validatorCapacity: number
  validatorStartTime: number
  validatorEndTime: number
  totalDelegators: number
  totalDelegated: number
  validatorUptime: number
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
  validatorUptime: IMeterBar
  validatorLeftoverCapacity: IMeterBar
  validatorLeftoverDuration: IMeterBar
}

type IMeterBar = {
  percent: number
  amount?: string
}