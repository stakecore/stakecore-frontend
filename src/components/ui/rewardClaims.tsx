import { useRef } from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, RewardClaimDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "../utils/links"
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

function chainToAddressUrl(chain: number, protocol: number, address: string): string {
  if (chain == Chain.FLARE) {
    if (protocol == Protocol.FSP) {
      return C.flareEvmAddressUrl(address)
    } else {
      return C.flarePChainAddressUrl(address)
    }
  } else if (chain == Chain.SONGBIRD) {
    return C.songbirdEvmAddressUrl(address)
  } else if (chain == Chain.AVALANCHE) {
    return C.avalanchePChainAddressUrl(address)
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
  }

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.reward-claim-card') as HTMLElement
      const distance = card ? card.offsetWidth + 10 : 260
      scrollRef.current.scrollBy({ left: direction * distance, behavior: 'smooth' })
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
        const logo = CHAIN_LOGO[reward.chain]
        const symbol = C.CHAIN_SYMBOL[reward.chain]
        const txUrl = chainToTransactionUrl(reward.chain, reward.protocol, reward.transaction)
        const addrUrl = chainToAddressUrl(reward.chain, reward.protocol, reward.recipient)
        return <div className="reward-claim-card" key={`${reward.transaction}-${reward.recipient}-${i}`}>
          <div className="reward-claim-card-top">
            <img src={logo} width={28} alt={symbol} />
            <span className="reward-claim-protocol">{C.PROTOCOL_NAME[reward.protocol]}</span>
          </div>
          <div className="reward-claim-amount">
            +{Formatter.number(reward.reward)} <span className="reward-claim-symbol">{symbol}</span>
          </div>
          <div className="reward-claim-details">
            <div className="reward-claim-row">
              <span className="reward-claim-label">Tx</span>
              <HashLink address={reward.transaction} url={txUrl} length={6} copy={false} />
            </div>
            <div className="reward-claim-row">
              <span className="reward-claim-label">To</span>
              <HashLink address={reward.recipient} url={addrUrl} length={6} copy={false} />
            </div>
          </div>
          <div className="reward-claim-time">{Formatter.relativeDate(reward.timestamp)}</div>
        </div>
      })}
    </div>
  </>
}


export default RewardClaims
