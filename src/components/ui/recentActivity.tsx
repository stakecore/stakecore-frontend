import { memo, useEffect, useMemo, useRef } from "react"
import { SpinnerCircular } from "spinners-react"
import { ApiResponseDto_PageStatsDto, PageActivityDto } from "~/backendApi"
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
  const activity = data?.data?.activity
  const delegated = data?.data?.delegated
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  const items = useMemo<PageActivityDto[] | null>(() => {
    if (activity == null) return null
    // Drop entries whose type or chain we don't have a renderer for — a new
    // backend activity type or chain id would otherwise dereference an
    // undefined config in ActivityCard and crash the whole hero marquee.
    return [...activity]
      .filter(a => a.type in ACTIVITY_CONFIG && a.chain in CHAIN_CONFIG)
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [activity])

  const priceByKey = useMemo(() => buildPriceMap(data), [delegated])

  const itemCount = items?.length ?? 0

  useEffect(() => {
    if (itemCount === 0) return
    const el = marqueeRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const SPEED_PX_PER_SEC = 30
    const PAUSE_MS = 1200
    // Clamp per-frame dt so the marquee can't catapult forward when the
    // browser resumes rAF after a long pause (backgrounded tab, window
    // minimised, etc.). 100ms ≈ 3px at 30px/s — well below visible.
    const MAX_DT_MS = 100
    let pauseUntil = 0
    let hovering = false
    let lastTs = performance.now()
    let raf = 0
    let running = false

    const markInteraction = () => { pauseUntil = performance.now() + PAUSE_MS }
    const onPointerEnter = () => { hovering = true }
    const onPointerLeave = () => { hovering = false }

    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('wheel', markInteraction, { passive: true })
    el.addEventListener('touchstart', markInteraction, { passive: true })
    el.addEventListener('touchmove', markInteraction, { passive: true })

    const tick = (ts: number) => {
      const dt = Math.min(ts - lastTs, MAX_DT_MS)
      lastTs = ts
      const paused = hovering || ts < pauseUntil
      if (!paused) {
        el.scrollLeft += SPEED_PX_PER_SEC * (dt / 1000)
      }
      // Content is duplicated, so scrollLeft and scrollLeft - half look identical.
      // Wrap only while auto-scrolling so we never yank scrollLeft mid-swipe.
      const half = el.scrollWidth / 2
      if (!paused && half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half
        else if (el.scrollLeft < 0) el.scrollLeft += half
      }
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      // Reset the clock so the first frame after (re)entering the viewport
      // doesn't see a huge dt; the MAX_DT_MS clamp backs this up too.
      lastTs = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Only run the loop while the marquee is on-screen — no point doing
    // per-frame scrollLeft writes + scrollWidth reads when the user has
    // scrolled it out of view.
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); else stop() },
      { threshold: 0 }
    )
    io.observe(el)

    return () => {
      stop()
      io.disconnect()
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('wheel', markInteraction)
      el.removeEventListener('touchstart', markInteraction)
      el.removeEventListener('touchmove', markInteraction)
    }
  }, [itemCount])

  if (!items && isLoading) {
    return <div style={{ textAlign: 'center' }}>
      <SpinnerCircular color={C.PAGE_COLOR_CODE} size={40} />
    </div>
  }

  if (!items || items.length === 0) return null

  return <div ref={marqueeRef} className="activity-marquee" aria-label="Recent activity">
    <div className="activity-marquee-track">
      {items.map(item =>
        <ActivityCard key={`a-${itemKey(item)}`} activity={item} priceByKey={priceByKey} />
      )}
      {items.map(item =>
        <ActivityCard key={`b-${itemKey(item)}`} activity={item} priceByKey={priceByKey} aria-hidden />
      )}
    </div>
  </div>
}

const ACTIVITY_CONFIG = {
  [PageActivityDto.type.CLAIM]: { label: 'Claimed', cssType: 'claimed', cssAmount: 'reward', addrLabel: 'To' },
  [PageActivityDto.type.DELEGATION]: { label: 'Delegated', cssType: 'delegated', cssAmount: 'delegation', addrLabel: 'By' },
}

const ActivityCard = memo(({ activity, priceByKey, ...rest }: {
  activity: PageActivityDto, priceByKey: Record<string, number>, 'aria-hidden'?: boolean
}) => {
  const config = ACTIVITY_CONFIG[activity.type]
  const chainCfg = chainConfig(activity.chain)
  const logo = chainCfg?.logo
  const symbol = chainCfg?.symbol
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
})

export default RecentActivity
