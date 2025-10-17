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

export interface InvestFlowConfig {
  staked: number
  tokens: {
    symbol: string
    logoUrl: string
    balance: number
    price: number
    arrows: {
      up: boolean
      down: boolean
    }
    ireturn: (number | null)[]
  }[]
}