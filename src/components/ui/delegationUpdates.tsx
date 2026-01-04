import React from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, DelegationDto } from "~/backendApi"
import * as C from "~/constants"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "../utils/links"
import avalanche from "../../assets/images/tokens/AVAX.svg"
import flare from "../../assets/images/tokens/FLR.svg"
import songbird from "../../assets/images/tokens/SGB.svg"


function chainToLogoUrl(chain: DelegationDto.chain): string {
  if (chain == DelegationDto.chain._0) {
    return flare
  } else if (chain == DelegationDto.chain._1) {
    return songbird
  } else {
    return avalanche
  }
}

function chainToTransactionUrl(
  chain: DelegationDto.chain,
  protocol: DelegationDto.protocol,
  hash: string
): string {
  if (chain == DelegationDto.chain._0) {
    if (protocol == DelegationDto.protocol._0) {
      return C.flareEvmTransactionUrl(hash)
    } else if (protocol == DelegationDto.protocol._1) {
      return C.flarePChainTransactionUrl(hash)
    } else {
      throw Error(`Invalid protocol ${chain}:${protocol}`)
    }
  } else if (chain == DelegationDto.chain._1) {
    return C.songbirdEvmTransactionUrl(hash)
  } else if (chain == DelegationDto.chain._2) {
    return C.avalanchePChainTransactionUrl(hash)
  } else {
    throw Error(`Invalid protocol ${chain}:${protocol}`)
  }
}

function chainToSymbol(chain: DelegationDto.chain): string {
  if (chain == DelegationDto.chain._0) {
    return 'FLR'
  } else if (chain == DelegationDto.chain._1) {
    return 'SGB'
  } else {
    return 'AVAX'
  }
}

function resolveProtocolName(protocol: DelegationDto.protocol): string {
  if (protocol == DelegationDto.protocol._0) {
    return 'FSP'
  } else if (protocol == DelegationDto.protocol._1) {
    return 'Validator'
  }
}

const NumberDiff = ({ text, value }: { text: string, value: number }) => {
  if (value > 0) {
    return <span style={{ color: '#50e3c2' }}>+{text}</span>
  } else if (value < 0) {
    return <span style={{ color: '#ff3e55' }}>{text}</span>
  } else {
    return <span style={{ color: 'white' }}>0</span>
  }
}

const DelegationUpdates = ({ data, isLoading, error }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {

  let delegations: DelegationDto[] | null = null
  if (data?.data != null) {
    delegations = data.data.delegations
  } else if (isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  } else {
    console.log(String(error)) // should not hapen
  }

  return <>
    <div className="delegation-updates">
      <div>Token</div>
      <div>Protocol</div>
      <div>Transaction</div>
      <div>Delegated</div>
      <div>Timestamp</div>
      {delegations.map((delegation, i) => {
        const logo = chainToLogoUrl(delegation.chain)
        const url = chainToTransactionUrl(delegation.chain, delegation.protocol, delegation.transaction)
        const delegated = Formatter.number(delegation.delegated)
        return <React.Fragment key={i}>
          <div><img src={logo} width={25} /></div>
          <div>{resolveProtocolName(delegation.protocol)}</div>
          <div><HashLink address={delegation.transaction} url={url} length={5} copy={false} /></div>
          <div><NumberDiff value={Number(delegation.delegated)} text={delegated} /></div>
          <div>{Formatter.relativeDate(delegation.timestamp)}</div>
        </React.Fragment>
      })}
    </div>
  </>
}


export default DelegationUpdates