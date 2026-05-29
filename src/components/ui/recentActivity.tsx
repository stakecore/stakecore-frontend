import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, PageActivityDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "./links"
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

function itemKey(item: PageActivityDto): string {
  return `${item.type}-${item.transaction}`
}

// Derive a per-chain/protocol token price from the aggregate stats
// (delegatedUsd / delegated). Returned map is keyed by `${chain}-${protocol}`
// so it lines up with the (chain, protocol) tuple on each activity entry.
function buildPriceMap(data: ApiResponseDto_PageStatsDto | undefined): Record<string, number> {
  const map: Record<string, number> = {}
  for (const d of data?.data?.delegated ?? []) {
    if (d.delegated > 0) map[`${d.chain}-${d.protocol}`] = d.delegatedUsd / d.delegated
  }
  return map
}

const RecentActivity = ({ data, isLoading }: {
  data: ApiResponseDto_PageStatsDto, isLoading: boolean, error: string
}) => {
  let items: PageActivityDto[] | null = null
  if (data?.data != null) {
    items = [...(data.data.activity ?? [])].sort((a, b) => b.timestamp - a.timestamp)
  }

  if (!items && isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  }

  if (!items || items.length === 0) return null

  const priceByKey = buildPriceMap(data)

  return <div className="activity-marquee" aria-label="Recent activity">
    <div className="activity-marquee-track">
      {items.map((item, i) =>
        <ActivityCard key={`a-${itemKey(item)}-${i}`} activity={item} priceByKey={priceByKey} />
      )}
      {items.map((item, i) =>
        <ActivityCard key={`b-${itemKey(item)}-${i}`} activity={item} priceByKey={priceByKey} aria-hidden />
      )}
    </div>
  </div>
}

const ACTIVITY_CONFIG = {
  [PageActivityDto.type.CLAIM]: { label: 'Claimed', cssType: 'claimed', cssAmount: 'reward', addrLabel: 'To' },
  [PageActivityDto.type.DELEGATION]: { label: 'Delegated', cssType: 'delegated', cssAmount: 'delegation', addrLabel: 'By' },
}

const ActivityCard = ({ activity, priceByKey, ...rest }: {
  activity: PageActivityDto, priceByKey: Record<string, number>, 'aria-hidden'?: boolean
}) => {
  const config = ACTIVITY_CONFIG[activity.type]
  const logo = CHAIN_LOGO[activity.chain]
  const symbol = C.CHAIN_SYMBOL[activity.chain]
  const txUrl = chainToTransactionUrl(activity.chain, activity.protocol, activity.transaction)
  const addrUrl = chainToAddressUrl(activity.chain, activity.protocol, activity.delegator)
  const price = priceByKey[`${activity.chain}-${activity.protocol}`]
  const usd = price != null ? Number(activity.amount) * price : null

  return <div className="activity-card" {...rest}>
    <div className="activity-card-top">
      <img src={logo} width={28} alt={symbol} />
      <span className="activity-protocol">{C.PROTOCOL_NAME[activity.protocol]}</span>
      <span className={`activity-type ${config.cssType}`}>{config.label}</span>
    </div>
    <div className={`activity-amount ${config.cssAmount}`}>
      <span className="activity-amount-value">{Formatter.number(activity.amount)}</span> <span className="activity-symbol">{symbol}</span>
      {usd != null && Number.isFinite(usd) && (
        <div className="activity-amount-usd">≈ {Formatter.usd(usd)}</div>
      )}
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
