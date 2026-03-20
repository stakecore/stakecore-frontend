import { useRef } from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, PageActivityDto } from "~/backendApi"
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

const RecentActivity = ({ data, isLoading }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  let items: PageActivityDto[] | null = null
  if (data?.data != null) {
    items = [...(data.data.activity ?? [])].sort((a, b) => b.timestamp - a.timestamp)
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
      {items.map((item, i) =>
        <ActivityCard key={`${item.type}-${item.transaction}-${i}`} activity={item} />
      )}
    </div>
  </>
}

const ACTIVITY_CONFIG = {
  [PageActivityDto.type.CLAIM]: { label: 'Claimed', cssType: 'claimed', cssAmount: 'reward', addrLabel: 'To' },
  [PageActivityDto.type.DELEGATION]: { label: 'Delegated', cssType: 'delegated', cssAmount: 'delegation', addrLabel: 'By' },
}

const ActivityCard = ({ activity }: { activity: PageActivityDto }) => {
  const config = ACTIVITY_CONFIG[activity.type]
  const logo = CHAIN_LOGO[activity.chain]
  const symbol = C.CHAIN_SYMBOL[activity.chain]
  const txUrl = chainToTransactionUrl(activity.chain, activity.protocol, activity.transaction)
  const addrUrl = chainToAddressUrl(activity.chain, activity.protocol, activity.delegator)

  return <div className="activity-card">
    <div className="activity-card-top">
      <img src={logo} width={28} alt={symbol} />
      <span className="activity-protocol">{C.PROTOCOL_NAME[activity.protocol]}</span>
      <span className={`activity-type ${config.cssType}`}>{config.label}</span>
    </div>
    <div className={`activity-amount ${config.cssAmount}`}>
      <Diff diff={Formatter.number(activity.amount)} /> <span className="activity-symbol">{symbol}</span>
    </div>
    <div className="activity-details">
      <div className="activity-row">
        <span className="activity-label">Tx</span>
        <HashLink address={activity.transaction} url={txUrl} length={6} copy={false} />
      </div>
      <div className="activity-row">
        <span className="activity-label">{config.addrLabel}</span>
        <HashLink address={activity.delegator} url={addrUrl} length={6} copy={false} />
      </div>
    </div>
    <div className="activity-time">{Formatter.relativeDate(activity.timestamp)}</div>
  </div>
}

export default RecentActivity
