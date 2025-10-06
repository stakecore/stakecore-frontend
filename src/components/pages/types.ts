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