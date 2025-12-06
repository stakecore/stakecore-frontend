import type { IStakeFlow, IStakeFlowBarAction } from "~/components/types"
import { StatusCode } from "~/enums"
import { expbigint } from "~/utils/misc/bigint"
import * as C from '~/constants'
import { flareDelegationAdr } from "~/constants"
import { Formatter } from "~/utils/misc/formatter"
import { actionStatusMessage, contractCallAdapter } from "../utils"
import { claim, delegate, deposit, withdraw } from "./contracts"
import FLR from '~/assets/images/networks/FLR.svg'
import WFLR from '~/assets/images/networks/WFLR.svg'


export const FLR_TO_WFLR_FACTOR = (x: number) => x
export const WFLR_TO_FLR_FACTOR = (x: number) => x

const tobips = (balance: number, amount: number) => {
  return Math.min(C.MAX_BIPS, Math.ceil(C.MAX_BIPS * Math.floor(amount / balance)))
}

const adelegate: IStakeFlowBarAction = {
  active: true,
  name: 'delegate',
  method: (address, balance, value) => contractCallAdapter(
    delegate, address, [tobips(balance, value)]),
  ok: (status) => status == StatusCode.CONTRACT_CALL_EXECUTED,
  message: (status, address, _, value) => actionStatusMessage(
    status, `address ${Formatter.address(address)} successfully delegated ${value} WFLR to ${flareDelegationAdr} (StakeCore)`
  )
}

const adeposit: IStakeFlowBarAction = {
  active: true,
  name: 'deposit',
  method: (address, _, value) => contractCallAdapter(
    deposit, address, [expbigint(value, C.FLR_DECIMALS)]),
  ok: (status) => status == StatusCode.CONTRACT_CALL_EXECUTED,
  message: (status, address, _, value) => actionStatusMessage(
    status, `address ${Formatter.address(address)} successfully deposited ${value} WFLR`
  )
}

const awithdraw: IStakeFlowBarAction = {
  active: true,
  name: 'withdraw',
  method: (address, _, value) => contractCallAdapter(
    withdraw, address, [expbigint(value, C.FLR_DECIMALS)]),
  ok: (status) => status == StatusCode.CONTRACT_CALL_EXECUTED,
  message: (status, address, _, value) => actionStatusMessage(
    status, `address ${Formatter.address(address)} successfully withdrew ${value} FLR`
  )
}

const aclaim: IStakeFlowBarAction = {
  active: true,
  name: 'claim',
  method: (address, _1, _2, epoch: number) => contractCallAdapter(claim, address, [epoch]),
  ok: (status) => status == StatusCode.CONTRACT_CALL_EXECUTED,
  message: (status, address, _, value) => actionStatusMessage(
    status, `address ${Formatter.address(address)} successfully claimed ${value} WFLR`
  )
}

export const DELEGATE_FLOW_LAYOUT: IStakeFlow['layout'] = [
  {
    symbol: C.FLR_SYMBOL, logo: FLR,
    actions: { down: adeposit, up: awithdraw },
    maxButton: true
  },
  {
    symbol: C.WFLR_SYMBOL, logo: WFLR,
    actions: { down: adelegate, up: aclaim },
    maxButton: true
  },
  {
    symbol: 'DELEGATED',
    actions: { down: { active: false }, up: { active: false } },
    maxButton: false
  }
]