export type ISpecs = ISpec[][]
export type ISpec = {
  title: string
  value: any
  tooltip?: string
}

export type ISummary = {
  asset: string
  apy: string
  delegation: string
  lockup: string
  // True when the validator's term has ended — set by validator
  // summaries only; FSP summaries leave this undefined.
  expired?: boolean
}
