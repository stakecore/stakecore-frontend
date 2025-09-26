export const MAX_BIPS = 10_000

export const chainUrl = 'flare-api.flare.network'
export const chainId = '0xe'

export const wrappedFlrAdy = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d'
export const wrappedFlrAbi = ['function delegate(address,uint256)']

export const delegationAddress = '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0'
export const validatorNodeId = 'KiAUisCU8UvXGnMRiUvoeyWneSdUm987'

export const delegationLink = `https://flare-explorer.flare.network/address/${delegationAddress}`
export const validatorLink = `https://flare.space/dapp/p-chain-explorer/validator/NodeID-${validatorNodeId}`

export const avalancheValidatorNodeId = 'NodeID-6kHEKvCMAK3WSChsrVXfLDujyKizshbS6'
export const avalancheValidatorLink = `https://subnets.avax.network/validators/${avalancheValidatorNodeId}`


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
