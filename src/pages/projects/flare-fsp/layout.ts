import type { IStakeFlow, IStakeFlowBarAction } from "~/components/types"
import { StatusCode } from "~/constants"
import { actionStatusMessage, contractCallAdapter } from "../utils"
import { expbigint } from "~/utlits/misc/bigint"
import { claim, delegate, deposit, withdraw } from "~/utlits/contracts/flare"
import { FLR_DECIMALS, FLR_SYMBOL, MAX_BIPS, WFLR_SYMBOL } from '~/utlits/data/constants'
import { flareDelegationAdr } from "~/utlits/data/constants"
import { Formatter } from "~/utlits/misc/formatter"
import logo from '~/assets/images/networks/FLR.webp'


export const FLR_TO_WFLR_FACTOR = (x: number) => x
export const WFLR_TO_FLR_FACTOR = (x: number) => x

const tobips = (balance: number, amount: number) => {
  return Math.min(MAX_BIPS, Math.ceil(MAX_BIPS * Math.floor(amount / balance)))
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
    deposit, address, [expbigint(value, FLR_DECIMALS)]),
  ok: (status) => status == StatusCode.CONTRACT_CALL_EXECUTED,
  message: (status, address, _, value) => actionStatusMessage(
    status, `address ${Formatter.address(address)} successfully deposited ${value} WFLR`
  )
}

const awithdraw: IStakeFlowBarAction = {
  active: true,
  name: 'withdraw',
  method: (address, _, value) => contractCallAdapter(
    withdraw, address, [expbigint(value, FLR_DECIMALS)]),
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
    symbol: FLR_SYMBOL, logo,
    actions: { down: adeposit, up: awithdraw },
    maxButton: true
  },
  {
    symbol: WFLR_SYMBOL, logo,
    actions: { down: adelegate, up: aclaim },
    maxButton: true
  },
  {
    symbol: 'DELEGATED',
    actions: { down: { active: false }, up: { active: false } },
    maxButton: false
  }
]