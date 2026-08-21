import { memo, useLayoutEffect, useMemo, useRef } from "react"
import { useAfterIdle } from "~/utils/useAfterIdle"
import { useMarquee } from "~/utils/useMarquee"
import { SpinnerCircular } from "spinners-react"
import { type ApiResponseDto_PageStatsDto, PageActivityDto } from "~/backendApi"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "./links"
import { Protocol } from "~/enums"
import * as C from "~/constants"
import { CHAIN_CONFIG, chainConfig } from "~/config/chains"
import "./recentActivity.scss"

// FSP activity links to the EVM explorer; validator activity to the P-chain
// explorer. Each chain's config only defines the builders for the protocols
// it actually emits, so a missing builder falls back to an empty string.
function chainToTransactionUrl(chain: number, protocol: number, hash: string): string {
  const ex = chainConfig(chain)?.explorers
  const build = protocol == Protocol.FSP ? ex?.evmTx : ex?.pChainTx
  return build ? build(hash) : ''
}

function chainToAddressUrl(chain: number, protocol: number, address: string): string {
  const ex = chainConfig(chain)?.explorers
  const build = protocol == Protocol.FSP ? ex?.evmAddress : ex?.pChainAddress
  return build ? build(address) : ''
}

// One transaction can emit several activity entries — a batched delegation, or
// a redelegation that arrives as a +/- amount pair — so the transaction hash
// alone doesn't identify a card. Key on the whole entry instead; `withKeys`
// below disambiguates the remaining exact repeats.
function itemKey(item: PageActivityDto): string {
  return [
    item.type, item.transaction, item.chain, item.protocol,
    item.delegator, item.delegatee, item.amount,
  ].join('-')
}

// Cards rendered in the first commit, before the idle callback fills in the
// rest. See the comment at the render site for how this number is derived.
const INITIAL_CARDS = 12

type KeyedActivity = { item: PageActivityDto, key: string }

// Two entries can still be identical in every field the API exposes, which
// would collide again. Suffix repeats with an occurrence counter so each card
// gets a unique key that stays stable across refreshes instead of falling
// back to array indices.
function withKeys(items: PageActivityDto[]): KeyedActivity[] {
  const seen = new Map<string, number>()
  return items.map(item => {
    const base = itemKey(item)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return { item, key: n === 0 ? base : `${base}#${n}` }
  })
}

// Every SWR poll parses fresh JSON, so an unchanged entry still arrives as a
// new object — which would defeat ActivityCard's memo (it compares the
// `activity` prop by reference). Entries sharing a key can only differ in
// timestamp (the key covers every other field), so when that matches too,
// hand back the previous poll's object and the memo holds.
function reuseItems(next: KeyedActivity[], prev: Map<string, PageActivityDto>): KeyedActivity[] {
  return next.map(({ item, key }) => {
    const old = prev.get(key)
    return old && old.timestamp === item.timestamp ? { item: old, key } : { item, key }
  })
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

// `data` is absent on the first render and on a failed fetch — the body has
// always read it as `data?.data?.…`, and buildPriceMap above already declares
// it optional. Only this signature claimed otherwise.
const RecentActivity = ({ data, isLoading }: {
  data?: ApiResponseDto_PageStatsDto, isLoading: boolean, error?: unknown
}) => {
  const activity = data?.data?.activity
  const delegated = data?.data?.delegated
  const marqueeRef = useRef<HTMLDivElement | null>(null)
  const prevItemsRef = useRef<Map<string, PageActivityDto>>(new Map())

  const items = useMemo<KeyedActivity[] | null>(() => {
    if (activity == null) return null
    // Drop entries whose type or chain we don't have a renderer for — a new
    // backend activity type or chain id would otherwise dereference an
    // undefined config in ActivityCard and crash the whole hero marquee.
    const keyed = reuseItems(
      withKeys([...activity]
        .filter(a => a.type in ACTIVITY_CONFIG && a.chain in CHAIN_CONFIG)
        .sort((a, b) => b.timestamp - a.timestamp)),
      prevItemsRef.current,
    )
    prevItemsRef.current = new Map(keyed.map(({ item, key }) => [key, item]))
    return keyed
  }, [activity])

  const priceByKey = useMemo(() => buildPriceMap(data), [delegated])

  const itemCount = items?.length ?? 0

  // The backend sends ~50 entries, each rendered twice — ~1300 elements, over
  // half the page's DOM, committed the moment SWR resolves, which on a slow
  // device lands in front of the paint for an LCP element further down the
  // page. Render a slice first and fill in the rest at idle.
  //
  // Gated on itemCount: the idle callback has to start when the cards do. On
  // mount this component is still a spinner, and an ungated callback fires
  // during that empty render — lifting the cap before there is anything to cap.
  const showAllCards = useAfterIdle(itemCount > 0)

  // Each half of the track is INITIAL_CARDS * (230 + 14)px ≈ 2900px until idle
  // fills in the rest — comfortably wider than the 1320px .container the
  // marquee lives in, so the wrap point stays off screen either way. The
  // ResizeObserver inside useMarquee re-measures when the track grows, so
  // nothing here needs to depend on the rendered count.
  const visibleItems = useMemo(
    () => (items == null ? null : showAllCards ? items : items.slice(0, INITIAL_CARDS)),
    [items, showAllCards],
  )

  // The scroll loop itself lives in useMarquee, shared with the About-page
  // stack carousel. Every constant it carries was tuned here first.
  // `scrollable` because this row is a real scroller the user can swipe: the
  // loop has to keep its position in the scroll offset they own, or its travel
  // is an offset nothing can scroll back past — see the hook's header.
  useMarquee(marqueeRef, { enabled: itemCount > 0, scrollable: true })

  // New activity arrives at the head of the list (it is sorted newest first),
  // so a poll that brings any pushes every card already on screen right by the
  // width it inserted. The loop's position is a distance from the track's left
  // edge, so left alone the row jumps that far in a single frame — and the new
  // cards, the ones worth showing, land behind the position where a swipe
  // cannot reach them. However far the previous render's leading card moved is
  // exactly what went in front of it. Adding that to the scroll offset holds
  // the view still; the loop adopts the new position on its next frame. This
  // runs in a layout effect, so the correction lands before the browser paints
  // and there is no jump to see.
  const leadKeyRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    const el = marqueeRef.current
    const track = el?.firstElementChild
    const previousLead = leadKeyRef.current
    const lead = visibleItems?.[0]?.key ?? null
    leadKeyRef.current = lead
    if (previousLead == null || lead == null || previousLead === lead) return
    if (!el || !(track instanceof HTMLElement) || visibleItems == null) return
    // Gone rather than pushed along — a re-ordering this can't measure, so
    // leave the position alone rather than guess at it.
    const index = visibleItems.findIndex(v => v.key === previousLead)
    if (index <= 0) return
    const first = track.children[0]
    const moved = track.children[index]
    if (!(first instanceof HTMLElement) || !(moved instanceof HTMLElement)) return
    const inserted = moved.offsetLeft - first.offsetLeft
    if (inserted > 0) el.scrollLeft += inserted
  }, [visibleItems])

  if (!items && isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  }

  if (!items || items.length === 0 || !visibleItems) return null

  // The USD and relative-time strings are computed here, per poll, and passed
  // as primitives: memo then compares them by value, so a card only
  // re-renders when its *displayed* text actually changes — not because a
  // fresh priceByKey object arrived or "N minutes ago" ticked for some other
  // card. Formatting 50 strings is far cheaper than re-rendering 100 cards.
  const cards = visibleItems.map(({ item, key }) => {
    const price = priceByKey[`${item.chain}-${item.protocol}`]
    const usd = price != null ? Number(item.amount) * price : null
    return {
      item, key,
      usdText: usd != null && Number.isFinite(usd) ? Formatter.usd(usd) : null,
      timeText: Formatter.relativeDate(item.timestamp),
    }
  })

  // The fade mask lives on this non-scrolling wrapper, not on the scroller
  // itself — a mask directly on a scroll container can force the browser off
  // composited scrolling, repainting the whole track on every 1px step.
  return <div className="activity-marquee-mask">
    <div ref={marqueeRef} className="activity-marquee" aria-label="Recent activity">
      <div className="activity-marquee-track">
        {cards.map(({ item, key, usdText, timeText }) =>
          <ActivityCard key={`a-${key}`} activity={item} usdText={usdText} timeText={timeText} />
        )}
        {cards.map(({ item, key, usdText, timeText }) =>
          <ActivityCard key={`b-${key}`} activity={item} usdText={usdText} timeText={timeText} clone />
        )}
      </div>
    </div>
  </div>
}

const ACTIVITY_CONFIG = {
  [PageActivityDto.type.CLAIM]: { label: 'Claimed', cssType: 'claimed', cssAmount: 'reward', addrLabel: 'To' },
  [PageActivityDto.type.DELEGATION]: { label: 'Delegated', cssType: 'delegated', cssAmount: 'delegation', addrLabel: 'By' },
}

// Props are a stable object reference (`activity`, via reuseItems) plus
// primitives, so the default shallow memo comparison skips every card whose
// content hasn't visibly changed since the previous poll.
// `clone` marks the duplicated second half of the track. It hides that half
// from assistive tech and drops its links out of the tab order — an
// aria-hidden subtree containing focusable children is an axe violation
// (aria-hidden-focus), and tabbing through 50 invisible duplicate links was
// a real keyboard trap regardless. tabindex="-1" rather than `inert` so the
// clones stay clickable: the marquee wraps, so users spend half their time
// looking at them.
const ActivityCard = memo(({ activity, usdText, timeText, clone = false }: {
  activity: PageActivityDto, usdText: string | null, timeText: string, clone?: boolean
}) => {
  const config = ACTIVITY_CONFIG[activity.type]
  const chainCfg = chainConfig(activity.chain)
  const logo = chainCfg?.logo
  const symbol = chainCfg?.symbol
  const txUrl = chainToTransactionUrl(activity.chain, activity.protocol, activity.transaction)
  const addrUrl = chainToAddressUrl(activity.chain, activity.protocol, activity.delegator)

  return <div className="activity-card" aria-hidden={clone || undefined}>
    <div className="activity-card-top">
      {/* Both dimensions, or the browser can't reserve the box before the
          SVG loads and the card reflows (Lighthouse: unsized-images, and a
          named layout-shift culprit). */}
      <img src={logo} width={28} height={28} alt={symbol} />
      <span className="activity-protocol">{C.PROTOCOL_NAME[activity.protocol]}</span>
      <span className={`activity-type ${config.cssType}`}>{config.label}</span>
    </div>
    <div className={`activity-amount ${config.cssAmount}`}>
      <span className="activity-amount-value">{Formatter.number(activity.amount)}</span> <span className="activity-symbol">{symbol}</span>
      {usdText != null && (
        <div className="activity-amount-usd">≈ {usdText}</div>
      )}
    </div>
    <div className="activity-details">
      <div className="activity-row">
        <span className="activity-label">Tx</span>
        <HashLink address={activity.transaction} url={txUrl} length={6} copy={false} tabIndex={clone ? -1 : undefined} />
      </div>
      <div className="activity-row">
        <span className="activity-label">{config.addrLabel}</span>
        <HashLink address={activity.delegator} url={addrUrl} length={6} copy={false} tabIndex={clone ? -1 : undefined} />
      </div>
    </div>
    <div className="activity-time">{timeText}</div>
  </div>
})

export default RecentActivity
