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

export interface IStakeFlow {
  layout: IStakeFlowLayout
  data: IStakeFlowData
}

type StakeAction = (address: string, amount: number) => Promise<boolean>

interface IStakeFlowLayout {
  tokens: {
    symbol: string
    logoUrl: string
    actions: {
      down: StakeAction | null
      up: StakeAction | null
    }
  }[]
}

interface IStakeFlowData {
  staked: number
  tokens: {
    address: string
    balance: number
    price: number
    stakeReturn: (((x: number) => number) | null)[]
  }[]
}