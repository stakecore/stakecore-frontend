export const MAX_BIPS = 10_000

// tokens

export const FLR_DECIMALS = 18
export const FLR_SYMBOL = 'FLR'
export const WFLR_SYMBOL = 'WFLR'

export const SGB_DECIMALS = 18
export const SGB_SYMBOL = 'SGB'
export const WSGB_SYMBOL = 'WSGB'

export const AVAX_DECIMALS = 18
export const AVAX_SYMBOL = 'AVAX'

// flare fsp

export const wrappedFlrAdr = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d'
export const wrappedFlrAbi = [
  'function delegate(address,uint256)',
  'function deposit() payable',
  'function withdraw(uint256)'
]

export const flareFspRewardManagerAdr = '0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B'
export const flareFspRewardManagerAbi = [
  'function claim(address,address,uint24,bool,(bytes32[],(uint24,bytes20,uint120,uint8))[])'
]

export const flareEvmExplorer = 'https://flare-explorer.flare.network'
export const flareFspExplorer = 'https://flare-systems-explorer.flare.network'

export const flareEvmAddressUrl = (address: string) => `${flareEvmExplorer}/address/${address}`
export const flareEvmTransactionUrl = (hash: string) => `${flareEvmExplorer}/tx/${hash}`

export const flareFspAddressUrl = (address: string) => `${flareEvmExplorer}/providers/fsp/${address}`

export const flareDelegationAdr = '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0'

export const flareChainUrl = 'https://flare-api.flare.network/ext/C/rpc'
export const flareChainId = '0xe'

export const flareWalletConfig = {
  chainName: 'Flare Network',
  chainId: flareChainId,
  nativeCurrency: {
    name: FLR_SYMBOL,
    decimals: FLR_DECIMALS,
    symbol: FLR_SYMBOL
  },
  rpcUrls: [flareChainUrl]
}

export const flareEpochConfig = {
  roundDurationMs: 90_000,
  firstRoundTimestampMs: 1658430000_000,
  rewardEpochDurationRounds: 3360
}

// songbird fsp

export const wrappedSgbAdr = '0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED'
export const wrappedSgbAbi = wrappedFlrAbi

export const songbirdFspRewardManagerAdr = '0xE26AD68b17224951b5740F33926Cc438764eB9a7'
export const songbirdFspRewardManagerAbi = flareFspRewardManagerAbi

export const songbirdEvmExplorer = 'https://songbird-explorer.flare.network'
export const songbirdFspExplorer = 'https://songbird-systems-explorer.flare.network'

export const songbirdEvmAddressUrl = (address: string) => `${songbirdEvmExplorer}/address/${address}`
export const songbirdEvmTransactionUrl = (hash: string) => `${songbirdEvmExplorer}/tx/${hash}`

export const songbirdFspAddressUrl = (address: string) => `${songbirdEvmExplorer}/providers/fsp/${address}`

export const songbirdDelegationAdr = '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0'

export const songbirdChainUrl = 'https://songbird-api.flare.network/ext/C/rpc'
export const songbirdChainId = '0x13'

export const songbirdWalletConfig = {
  chainName: 'Songbird Canary Network',
  chainId: songbirdChainId,
  nativeCurrency: {
    name: SGB_SYMBOL,
    decimals: SGB_DECIMALS,
    symbol: SGB_SYMBOL
  },
  rpcUrls: [songbirdChainUrl]
}

export const songbirdEpochConfig = {
  roundDurationMs: 90_000,
  firstRoundTimestampMs: 1658429955_000,
  rewardEpochDurationRounds: 3360
}

// flare validator

export const flareValidatorAdr = '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e'

export const flarePChainExplorer = 'https://flare.space/dapp/p-chain-explorer'

export const flareValidatorUrl = (nodeId: string) => `${flarePChainExplorer}/validator/${nodeId}`
export const flarePChainAddressUrl = (address: string) => `${flarePChainExplorer}/address/${address}`
export const flarePChainTransactionUrl = (transaction: string) => `${flarePChainExplorer}/tx/${transaction}`

// avalanche validator

export const avalancheExplorer = 'https://subnets.avax.network'
export const avalancheValidatorUrl = (nodeId: string) => `${avalancheExplorer}/validators/${nodeId}`
export const avalanchePChainTransactionUrl = (transaction: string) => `${avalancheExplorer}/p-chain/tx/${transaction}`
export const avalanchePChainAddressUrl = (address: string) => `${avalancheExplorer}/p-chain/address/${address}`

export const avalancheDelegatorMinLockup = 1209600
export const avalancheDelegatorMaxLockup = 31536000

export const avalancheChainId = '0xa86a'
export const avalancheChainUrl = 'https://avalanche-c-chain-rpc.publicnode.com'

export const avalancheWalletConfig = {
  chainName: 'Avalanche (C chain)',
  chainId: avalancheChainId,
  nativeCurrency: {
    name: AVAX_SYMBOL,
    decimals: AVAX_DECIMALS,
    symbol: AVAX_SYMBOL
  },
  rpcUrls: [avalancheChainUrl]
}

// style

export const FLARE_COLOR_CODE = '#E62058'
export const AVALANCHE_COLOR_CODE = '#FF394A'
export const SONGBIRD_COLOR_CODE = '#253c4d'

// hrps

export const HRP = {
  avalanche: "avax",
  songbird: "songbird",
  flare: "flare",
}