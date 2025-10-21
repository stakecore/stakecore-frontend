import type { FlareDelegationTimeSeriesDto, FlareFspInfoDto } from "~/backendApi"
import type { ISummary, ISpecs } from "~/components/types"


export type FlareData = {
  base: FlareFspInfoDto
  summary: ISummary
  specs: ISpecs
}

export type FlareGraphics = {
  delegations: FlareDelegationTimeSeriesDto

}

export interface FlareFspDelegatorInfo {
  nat: {
    address: string
    balance: number
    price: number
  }
  wnat: {
    address: string
    balance: number
    price: number
  }
  delegated: number
  rewards: number
}