export const MAX_BIPS = 10_000

// flare fsp

export const wrappedFlrAdy = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d'
export const wrappedFlrAbi = ['function delegate(address,uint256)']

export const flareDelegationAddress = '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0'

export const flareEvmExplorer = 'https://flare-explorer.flare.network'
export const flareFspExplorer = 'https://flare-systems-explorer.flare.network'

export const flareEvmUrl = (address: string) => `${flareEvmExplorer}/address/${address}`
export const flareFspUrl = (address: string) => `${flareEvmExplorer}/providers/fsp/${address}`

// flare validator

export const flarePChainExplorer = 'https://flare.space/dapp/p-chain-explorer'

export const flareValidatorUrl = (nodeId: string) => `${flarePChainExplorer}/validator/NodeID-${nodeId}`

// avalanche validator

export const avalancheExplorer = 'https://subnets.avax.network'
export const avalancheValidatorUrl = (nodeId: string) => `${avalancheExplorer}/validators/${nodeId}`
export const avalancheTransactionUrl = (transaction: string) => `${avalancheExplorer}/p-chain/tx/${transaction}`

export const avalancheDelegatorMinLockup = 1209600
export const avalancheDelegatorMaxLockup = 31536000

// style

export const FLARE_COLOR_CODE = '#E62058'
export const AVALANCHE_COLOR_CODE = '#FF394A'
export const SONGBIRD_COLOR_CODE = '#253c4d'

// temp

export const chainUrl = 'flare-api.flare.network'
export const chainId = '0xe'

export const chainConfig = {
  chainName: 'Flare Network',
  chainId,
  nativeCurrency: {
    name: 'FLR',
    decimals: 18,
    symbol: 'FLR'
  },
  rpcUrls: [`https://${chainUrl}/ext/C/rpc`]
}
