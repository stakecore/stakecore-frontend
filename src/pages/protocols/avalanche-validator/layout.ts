import type { IStakeFlow } from "~/components/types"
import logo from "~/assets/images/tokens/AVAX.svg"
import { Eip1193Provider } from "ethers"
import { contractCallAdapter } from "../utils"

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
  symbol: 'AVAX (C)',
  logo,
  actions: {
    down: {
      ...NotImplemented,
      name: 'Move from C chain to P chain',
    },
    up: {
      ...NotImplemented,
      name: 'Move from P chain to C chain',
    }

  },
  maxButton: true
}, {
  symbol: 'AVAX (P)',
  logo,
  actions: {
    down: {
      ...NotImplemented,
      name: 'Stake AVAX on the P-Chain',
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
