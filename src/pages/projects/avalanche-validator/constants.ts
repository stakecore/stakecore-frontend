import type { IStakeFlow } from "~/components/types"

export const C_TO_P_FACTOR = (x: number) => x - 0.1
export const P_TO_C_FACTOR = (x: number) => x - 0.2

export const DELEGATE_FLOW_LAYOUT: IStakeFlow['layout'] = {
  tokens: [{
    symbol: 'AVAX (C)',
    logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FAVAX_logo.png&w=96&q=75',
    arrows: { down: true, up: true }
  }, {
    symbol: 'AVAX (P)',
    logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FAVAX_logo.png&w=96&q=75',
    arrows: { down: true, up: false }
  }]
}