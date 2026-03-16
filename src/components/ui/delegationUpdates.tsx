import React from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, DelegationDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "../utils/links"
import { Diff } from "../pages/diff"
import { Chain, Protocol } from "~/enums"
import * as C from "~/constants"
import avalanche from "../../assets/images/tokens/AVAX.svg"
import flare from "../../assets/images/tokens/FLR.svg"
import songbird from "../../assets/images/tokens/SGB.svg"

const CHAIN_LOGO: Record<number, string> = {
  [Chain.FLARE]: flare,
  [Chain.SONGBIRD]: songbird,
  [Chain.AVALANCHE]: avalanche,
}

function chainToTransactionUrl(chain: number, protocol: number, hash: string): string {
  if (chain == Chain.FLARE) {
    if (protocol == Protocol.FSP) {
      return C.flareEvmTransactionUrl(hash)
    } else {
      return C.flarePChainTransactionUrl(hash)
    }
  } else if (chain == Chain.SONGBIRD) {
    return C.songbirdEvmTransactionUrl(hash)
  } else if (chain == Chain.AVALANCHE) {
    return C.avalanchePChainTransactionUrl(hash)
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
  }

  return <>
    <div className="delegation-updates">
      <div>Token</div>
      <div>Protocol</div>
      <div>Transaction</div>
      <div>Delegated</div>
      <div>Timestamp</div>
      {delegations.map((delegation, i) => {
        const logo = CHAIN_LOGO[delegation.chain]
        const url = chainToTransactionUrl(delegation.chain, delegation.protocol, delegation.transaction)
        const diff = Formatter.number(delegation.delegated)
        return <React.Fragment key={`${delegation.transaction}-${delegation.timestamp}`}>
          <div><img src={logo} width={25} /></div>
          <div>{C.PROTOCOL_NAME[delegation.protocol]}</div>
          <div><HashLink address={delegation.transaction} url={url} length={5} copy={false} /></div>
          <div style={{ textAlign: 'center' }}><Diff diff={diff} unit={C.CHAIN_SYMBOL[delegation.chain]} /></div>
          <div>{Formatter.relativeDate(delegation.timestamp)}</div>
        </React.Fragment>
      })}
    </div>
  </>
}


export default DelegationUpdates