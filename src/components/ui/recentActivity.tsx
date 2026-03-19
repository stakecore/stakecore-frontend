import { useRef } from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, RewardClaimDto, DelegationDto } from "~/backendApi"
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

type ActivityItem =
  | { type: 'reward'; data: RewardClaimDto }
  | { type: 'delegation'; data: DelegationDto }

const RecentActivity = ({ data, isLoading }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  let items: ActivityItem[] | null = null
  if (data?.data != null) {
    const rewards: ActivityItem[] = (data.data.rewards ?? []).map(r => ({ type: 'reward' as const, data: r }))
    const delegations: ActivityItem[] = (data.data.delegations ?? []).map(d => ({ type: 'delegation' as const, data: d }))
    items = [...rewards, ...delegations].sort((a, b) => b.data.timestamp - a.data.timestamp)
  } else if (isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  }

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.activity-card') as HTMLElement
      const distance = card ? card.offsetWidth + 14 : 260
      scrollRef.current.scrollBy({ left: direction * distance, behavior: 'smooth' })
    }
  }

  return <>
    <div className="activity-header">
      <h5>Recent Activity</h5>
      <div className="activity-nav">
        <button onClick={() => scroll(-1)} aria-label="Scroll left">&#8249;</button>
        <button onClick={() => scroll(1)} aria-label="Scroll right">&#8250;</button>
      </div>
    </div>
    <div className="activity-carousel" ref={scrollRef}>
      {items.map((item, i) => {
        if (item.type === 'reward') {
          return <RewardCard key={`r-${item.data.transaction}-${item.data.recipient}-${i}`} reward={item.data} />
        } else {
          return <DelegationCard key={`d-${item.data.transaction}-${item.data.timestamp}-${i}`} delegation={item.data} />
        }
      })}
    </div>
  </>
}

const RewardCard = ({ reward }: { reward: RewardClaimDto }) => {
  const logo = CHAIN_LOGO[reward.chain]
  const symbol = C.CHAIN_SYMBOL[reward.chain]
  const txUrl = chainToTransactionUrl(reward.chain, reward.protocol, reward.transaction)
  const addrUrl = chainToAddressUrl(reward.chain, reward.protocol, reward.recipient)

  return <div className="activity-card">
    <div className="activity-card-top">
      <img src={logo} width={28} alt={symbol} />
      <span className="activity-protocol">{C.PROTOCOL_NAME[reward.protocol]}</span>
      <span className="activity-type claimed">Claimed</span>
    </div>
    <div className="activity-amount reward">
      +{Formatter.number(reward.reward)} <span className="activity-symbol">{symbol}</span>
    </div>
    <div className="activity-details">
      <div className="activity-row">
        <span className="activity-label">Tx</span>
        <HashLink address={reward.transaction} url={txUrl} length={6} copy={false} />
      </div>
      <div className="activity-row">
        <span className="activity-label">To</span>
        <HashLink address={reward.recipient} url={addrUrl} length={6} copy={false} />
      </div>
    </div>
    <div className="activity-time">{Formatter.relativeDate(reward.timestamp)}</div>
  </div>
}

const DelegationCard = ({ delegation }: { delegation: DelegationDto }) => {
  const logo = CHAIN_LOGO[delegation.chain]
  const symbol = C.CHAIN_SYMBOL[delegation.chain]
  const txUrl = chainToTransactionUrl(delegation.chain, delegation.protocol, delegation.transaction)
  const addrUrl = chainToAddressUrl(delegation.chain, delegation.protocol, delegation.delegator)
  const diff = Formatter.number(delegation.delegated)

  return <div className="activity-card">
    <div className="activity-card-top">
      <img src={logo} width={28} alt={symbol} />
      <span className="activity-protocol">{C.PROTOCOL_NAME[delegation.protocol]}</span>
      <span className="activity-type delegated">Delegated</span>
    </div>
    <div className="activity-amount delegation">
      <Diff diff={diff} unit={symbol} />
    </div>
    <div className="activity-details">
      <div className="activity-row">
        <span className="activity-label">Tx</span>
        <HashLink address={delegation.transaction} url={txUrl} length={6} copy={false} />
      </div>
      <div className="activity-row">
        <span className="activity-label">By</span>
        <HashLink address={delegation.delegator} url={addrUrl} length={6} copy={false} />
      </div>
    </div>
    <div className="activity-time">{Formatter.relativeDate(delegation.timestamp)}</div>
  </div>
}

export default RecentActivity
