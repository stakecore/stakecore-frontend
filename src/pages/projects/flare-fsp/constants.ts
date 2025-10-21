import type { IStakeFlow } from "~/components/types"
import { contractCallAdapter } from "../utils"
import { expbigint } from "~/utlits/misc/bigint"
import { delegate, deposit, withdraw } from "~/utlits/contracts/flare"


export const FLR_TO_WFLR_FACTOR = (x: number) => x
export const WFLR_TO_FLR_FACTOR = (x: number) => x

const _delegate = (address: string, value: number) => contractCallAdapter(delegate, address, [])
const _deposit = (address: string, value: number) => contractCallAdapter(deposit, address, [expbigint(value, 18)])
const _withdraw = (address: string, value: number) => contractCallAdapter(withdraw, address, [expbigint(value, 18)])

export const DELEGATE_FLOW_LAYOUT: IStakeFlow['layout'] = {
  tokens: [{
    symbol: 'FLR',
    logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FFLR_logo.png&w=96&q=75',
    actions: { down: _deposit, up: _withdraw }
  }, {
    symbol: 'WFLR',
    logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FFLR_logo.png&w=96&q=75',
    actions: { down: _delegate, up: null }
  }]
}