import FLR from "~/assets/images/tokens/FLR.svg"
import { Eip1193Provider } from "ethers"
import { contractCallAdapter } from "../utils"
import type { IStakeFlow } from "~/components/types"

export const C_TO_P_FACTOR = (x: number) => x - 0.1
export const P_TO_C_FACTOR = (x: number) => x - 0.2

const notImplemented = (provider: Eip1193Provider, address: string, args: any) => {
  throw new Error('Not Implemented')
}

const NotImplemented = {
  active: true,
  ok: () => false,
  message: () => 'Not Implemented!',
  method: (address, _, value) => contractCallAdapter(
    notImplemented, address, value)
}

export const DELEGATE_FLOW_LAYOUT: IStakeFlow['layout'] = [{
  symbol: 'FLR (C)',
  logo: FLR,
  actions: {
    down: {
      ...NotImplemented,
      name: 'Move FLR from C chain to P chain',
    },
    up: {
      ...NotImplemented,
      name: 'Move FLR from P chain to C chain',
    }

  },
  maxButton: true
}, {
  symbol: 'FLR (P)',
  logo: FLR,
  actions: {
    down: {
      ...NotImplemented,
      name: 'Stake FLR on the P-Chain',
    },
    up: { active: false }
  },
  maxButton: true
}, {
  symbol: 'DELEGATED',
  actions: {
    down: { active: false },
    up: { active: false }
  },
  maxButton: false
}]
