export const MAX_BIPS = 10_000

// flare

export const FLR_DECIMALS = 18
export const FLR_SYMBOL = 'FLR'
export const WFLR_SYMBOL = 'WFLR'

export const AVAX_DECIMALS = 18
export const AVAX_SYMBOL = 'AVAX'


// flare fsp

export const wrappedFlrAdr = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d'
export const wrappedFlrAbi = [
  'function delegate(address,uint256)',
  'function deposit() payable',
  'function withdraw(uint256)'
]

export const fspRewardManagerAdr = '0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B'
export const fspRewardManagerAbi = [
  'function claim(address,address,uint24,bool,(bytes32[],(uint24,bytes20,uint120,uint8))[])'
]

export const flareEvmExplorer = 'https://flare-explorer.flare.network'
export const flareFspExplorer = 'https://flare-systems-explorer.flare.network'

export const flareEvmUrl = (address: string) => `${flareEvmExplorer}/address/${address}`
export const flareFspUrl = (address: string) => `${flareEvmExplorer}/providers/fsp/${address}`

export const flareDelegationAdr = '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0'
export const flareValidatorAdr = '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e'

// flare validator

export const flarePChainExplorer = 'https://flare.space/dapp/p-chain-explorer'

export const flareValidatorUrl = (nodeId: string) => `${flarePChainExplorer}/validator/NodeID-${nodeId}`

// avalanche validator

export const avalancheExplorer = 'https://subnets.avax.network'
export const avalancheValidatorUrl = (nodeId: string) => `${avalancheExplorer}/validators/${nodeId}`
export const avalanchePChainTransactionUrl = (transaction: string) => `${avalancheExplorer}/p-chain/tx/${transaction}`
export const avalanchePChainAddressUrl = (address: string) =>`${avalancheExplorer}/p-chain/address/${address}`

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
