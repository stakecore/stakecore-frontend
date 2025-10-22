import type { Status } from "~/constants"


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
  layout: IStakeFlowLayoutPart[]
  data: IStakeFlowDataPart[]
}

type ActionMethod = (address: string, balance: number, value: number) => Promise<Status>
type ActionMessage = (status: Status, address: string, balance: number, value: number) => string

export type IStakeFlowBarAction = {
  active: false
} | {
  active: true
  name: string
  method: ActionMethod
  message: ActionMessage
  ok: (status: Status) => boolean
}

export interface IStakeFlowLayoutPart {
  symbol: string
  logo: string
  actions: {
    down: IStakeFlowBarAction
    up: IStakeFlowBarAction
  }
  maxButton: boolean
}
export interface IStakeFlowDataPart {
  address: string
  balance: number
  price: number
  conversions: (((x: number) => number) | null)[]
  fixedInputValue: number | null
}