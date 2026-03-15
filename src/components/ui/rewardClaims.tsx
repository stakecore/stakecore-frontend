import React, { useRef } from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, RewardClaimDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "../utils/links"
import * as C from "~/constants"
import avalanche from "../../assets/images/tokens/AVAX.svg"
import flare from "../../assets/images/tokens/FLR.svg"
import songbird from "../../assets/images/tokens/SGB.svg"


function chainToLogoUrl(chain: RewardClaimDto.chain): string {
  if (chain == RewardClaimDto.chain._0) {
    return flare
  } else if (chain == RewardClaimDto.chain._1) {
    return songbird
  } else {
    return avalanche
  }
}

function chainToSymbol(chain: RewardClaimDto.chain): string {
  if (chain == RewardClaimDto.chain._0) {
    return 'FLR'
  } else if (chain == RewardClaimDto.chain._1) {
    return 'SGB'
  } else {
    return 'AVAX'
  }
}

function chainToTransactionUrl(
  chain: RewardClaimDto.chain,
  protocol: RewardClaimDto.protocol,
  hash: string
): string {
  if (chain == RewardClaimDto.chain._0) {
    if (protocol == RewardClaimDto.protocol._0) {
      return C.flareEvmTransactionUrl(hash)
    } else if (protocol == RewardClaimDto.protocol._1) {
      return C.flarePChainTransactionUrl(hash)
    } else {
      throw Error(`Invalid protocol ${chain}:${protocol}`)
    }
  } else if (chain == RewardClaimDto.chain._1) {
    return C.songbirdEvmTransactionUrl(hash)
  } else if (chain == RewardClaimDto.chain._2) {
    return C.avalanchePChainTransactionUrl(hash)
  } else {
    throw Error(`Invalid protocol ${chain}:${protocol}`)
  }
}

function chainToAddressUrl(
  chain: RewardClaimDto.chain,
  protocol: RewardClaimDto.protocol,
  address: string
): string {
  if (chain == RewardClaimDto.chain._0) {
    if (protocol == RewardClaimDto.protocol._0) {
      return C.flareEvmAddressUrl(address)
    } else if (protocol == RewardClaimDto.protocol._1) {
      return C.flarePChainAddressUrl(address)
    } else {
      throw Error(`Invalid protocol ${chain}:${protocol}`)
    }
  } else if (chain == RewardClaimDto.chain._1) {
    return C.songbirdEvmAddressUrl(address)
  } else if (chain == RewardClaimDto.chain._2) {
    return C.avalanchePChainAddressUrl(address)
  } else {
    throw Error(`Invalid protocol ${chain}:${protocol}`)
  }
}

function resolveProtocolName(protocol: RewardClaimDto.protocol): string {
  if (protocol == RewardClaimDto.protocol._0) {
    return 'FSP'
  } else if (protocol == RewardClaimDto.protocol._1) {
    return 'Validator'
  }
}

const RewardClaims = ({ data, isLoading, error }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  let rewards: RewardClaimDto[] | null = null
  if (data?.data != null) {
    rewards = data.data.rewards
  } else if (isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  } else {
    console.log(String(error))
  }

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' })
    }
  }

  return <>
    <div className="reward-claims-header">
      <h5>Recent Reward Claims</h5>
      <div className="reward-claims-nav">
        <button onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
        <button onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
      </div>
    </div>
    <div className="reward-claims-carousel" ref={scrollRef}>
      {rewards.map((reward, i) => {
        const logo = chainToLogoUrl(reward.chain)
        const symbol = chainToSymbol(reward.chain)
        const txUrl = chainToTransactionUrl(reward.chain, reward.protocol, reward.transaction)
        const addrUrl = chainToAddressUrl(reward.chain, reward.protocol, reward.recipient)
        return <div className="reward-claim-card" key={i}>
          <div className="reward-claim-card-top">
            <img src={logo} width={28} alt={symbol} />
            <span className="reward-claim-protocol">{resolveProtocolName(reward.protocol)}</span>
          </div>
          <div className="reward-claim-amount">
            +{Formatter.number(reward.reward)} <span className="reward-claim-symbol">{symbol}</span>
          </div>
          <div className="reward-claim-details">
            <div className="reward-claim-row">
              <span className="reward-claim-label">Tx</span>
              <HashLink address={reward.transaction} url={txUrl} length={6} copy={true} />
            </div>
            <div className="reward-claim-row">
              <span className="reward-claim-label">To</span>
              <HashLink address={reward.recipient} url={addrUrl} length={6} copy={true} />
            </div>
          </div>
          <div className="reward-claim-time">{Formatter.relativeDate(reward.timestamp)}</div>
        </div>
      })}
    </div>
  </>
}


export default RewardClaims
