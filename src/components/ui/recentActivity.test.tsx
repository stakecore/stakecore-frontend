// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { type ApiResponseDto_PageStatsDto, PageActivityDto } from '~/backendApi'
import { Formatter } from '~/utils/misc/formatter'
import RecentActivity from './recentActivity'

// happy-dom has neither observer; stub both with instance capture so the
// scroll-loop tests can fire intersection/resize callbacks by hand.
class ObserverStub {
  static intersection: ObserverStub[] = []
  static resize: ObserverStub[] = []
  target: Element | null = null
  constructor(public cb: (entries: unknown[]) => void) {}
  observe(el: Element) { this.target = el }
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', class extends ObserverStub {
  constructor(cb: (entries: unknown[]) => void) { super(cb); ObserverStub.intersection.push(this) }
})
vi.stubGlobal('ResizeObserver', class extends ObserverStub {
  constructor(cb: (entries: unknown[]) => void) { super(cb); ObserverStub.resize.push(this) }
})

const activity = (o: Partial<PageActivityDto>): PageActivityDto => ({
  type: PageActivityDto.type.DELEGATION,
  delegatee: '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0',
  delegator: '0xAAAA000000000000000000000000000000000001',
  amount: '111',
  transaction: '0xtx_a',
  timestamp: 1785302268,
  chain: PageActivityDto.chain._0,
  protocol: PageActivityDto.protocol._0,
  ...o,
})

const payload = (items: PageActivityDto[]): ApiResponseDto_PageStatsDto => ({
  status: 200,
  data: {
    activity: items,
    delegated: [],
    historicDelegations: [],
  },
} as ApiResponseDto_PageStatsDto)

const amounts = (c: HTMLElement) =>
  [...c.querySelectorAll('.activity-amount-value')].map(n => n.textContent?.trim())

afterEach(cleanup)

describe('RecentActivity', () => {
  // The backend emits one entry per delegation event, not per transaction: a
  // batched delegation, or a redelegation (a +/- pair), yields several entries
  // sharing one transaction hash. Both shapes occur in live /api/page/info data.
  const batched = [
    activity({ transaction: '0xtx_same', amount: '111', delegator: '0xAAAA1' }),
    activity({ transaction: '0xtx_same', amount: '222', delegator: '0xBBBB2' }),
    activity({ transaction: '0xtx_other', amount: '333', timestamp: 1785302000 }),
  ]

  it('renders every entry of a transaction that emitted several', () => {
    const { container } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    // The track is duplicated for the marquee loop, so each entry appears twice.
    expect(amounts(container)).toEqual(['111', '222', '333', '111', '222', '333'])
  })

  it('keeps entries distinct and ordered when the list updates', () => {
    const { container, rerender } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    const newest = activity({ transaction: '0xtx_new', amount: '444', timestamp: 1785999999 })
    rerender(
      <RecentActivity data={payload([newest, ...batched])} isLoading={false} error="" />
    )
    // Newest first, no stale or duplicated card injected by a key collision.
    expect(amounts(container)).toEqual([
      '444', '111', '222', '333',
      '444', '111', '222', '333',
    ])
  })
})

describe('RecentActivity card memoization', () => {
  const batched = [
    activity({ transaction: '0xtx_same', amount: '111', delegator: '0xAAAA1' }),
    activity({ transaction: '0xtx_same', amount: '222', delegator: '0xBBBB2' }),
    activity({ transaction: '0xtx_other', amount: '333', timestamp: 1785302000 }),
  ]
  // A fresh fetch parses fresh JSON: identical content, brand-new references.
  const refetched = (items: PageActivityDto[]) => payload(items.map(a => ({ ...a })))

  afterEach(() => vi.restoreAllMocks())

  // Formatter.number only runs inside ActivityCard's render, so its call
  // count is a direct measure of how many cards actually re-rendered.
  // Date.now is pinned so the relative-time text can't flip mid-test.
  it('re-renders no cards when a refresh delivers identical data', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1785310000_000)
    const spy = vi.spyOn(Formatter, 'number')
    const { rerender } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    spy.mockClear()
    rerender(
      <RecentActivity data={refetched(batched)} isLoading={false} error="" />
    )
    expect(spy).not.toHaveBeenCalled()
  })

  it('re-renders only the new cards when fresh entries arrive', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1785310000_000)
    const spy = vi.spyOn(Formatter, 'number')
    const { rerender } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    spy.mockClear()
    const newest = activity({ transaction: '0xtx_new', amount: '444', timestamp: 1785999999 })
    rerender(
      <RecentActivity data={refetched([newest, ...batched])} isLoading={false} error="" />
    )
    // The new entry renders twice (duplicated track); nothing else re-renders.
    expect(spy.mock.calls.map(c => c[0])).toEqual(['444', '444'])
  })
})

describe('RecentActivity auto-scroll loop', () => {
  const items = [
    activity({ transaction: '0xtx_a', amount: '111' }),
    activity({ transaction: '0xtx_b', amount: '222' }),
  ]

  // Deterministic rAF: ticks are queued and stepped by hand with explicit
  // timestamps, so each test controls frame count and per-frame dt.
  const harness = () => {
    const origRaf = globalThis.requestAnimationFrame
    const origCaf = globalThis.cancelAnimationFrame
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (queue.push(cb), queue.length))
    vi.stubGlobal('cancelAnimationFrame', () => {})

    const { container } = render(
      <RecentActivity data={payload(items)} isLoading={false} error="" />
    )
    const el = container.querySelector<HTMLDivElement>('.activity-marquee')!

    // Emulate how engines actually store scroll offsets: snapped on write,
    // and (as Safari does) rounded to an integer on read.
    let raw = 0
    Object.defineProperty(el, 'scrollLeft', {
      configurable: true,
      get: () => Math.round(raw),
      set: (v: number) => { raw = v },
    })

    const io = ObserverStub.intersection.find(o => o.target === el)!
    io.cb([{ isIntersecting: true }])

    let ts = performance.now()
    const step = (dtMs: number) => {
      ts += dtMs
      queue.shift()!(ts)
    }
    const restore = () => {
      vi.stubGlobal('requestAnimationFrame', origRaf)
      vi.stubGlobal('cancelAnimationFrame', origCaf)
    }
    return { el, step, rawScroll: () => raw, setRaw: (v: number) => { raw = v }, restore }
  }

  it('advances at speed even when the browser rounds scrollLeft reads', () => {
    const h = harness()
    // 12 frames at ~8.33ms ≈ 100ms of 120Hz display: 30px/s should move ~3px.
    // A read-modify-write of the rounded value loses the fraction every
    // frame and never gets anywhere.
    for (let i = 0; i < 12; i++) h.step(100 / 12)
    expect(h.rawScroll()).toBeGreaterThan(2)
    h.restore()
  })

  // Guards the width-caching refactor: the loop measures scrollWidth when it
  // starts (not per frame) and must still wrap at the duplicated-content seam.
  it('wraps back by half the track width at the seam', () => {
    const origRaf = globalThis.requestAnimationFrame
    const origCaf = globalThis.cancelAnimationFrame
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (queue.push(cb), queue.length))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const { container } = render(
      <RecentActivity data={payload(items)} isLoading={false} error="" />
    )
    const el = container.querySelector<HTMLDivElement>('.activity-marquee')!
    let raw = 0
    Object.defineProperty(el, 'scrollLeft', {
      configurable: true, get: () => raw, set: (v: number) => { raw = v },
    })
    // Width must be in place before the loop starts, since it measures once.
    Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => 2000 })
    ObserverStub.intersection.find(o => o.target === el)!.cb([{ isIntersecting: true }])

    raw = 998.5 // just short of the halfway seam
    let ts = performance.now()
    for (let i = 0; i < 3; i++) { ts += 50; queue.shift()!(ts) } // 3 × 1.5px
    // Crossed 1000 → wrapped back near the start, not marching past the seam.
    expect(raw).toBeLessThan(10)
    expect(raw).toBeGreaterThan(0)
    vi.stubGlobal('requestAnimationFrame', origRaf)
    vi.stubGlobal('cancelAnimationFrame', origCaf)
  })

  // Guards the float-accumulator design: assigning a stale internal position
  // over a user's native swipe would yank the carousel back. A divergence
  // beyond one pixel must be adopted as the new position.
  it('adopts a native user scroll instead of yanking back', () => {
    const h = harness()
    for (let i = 0; i < 3; i++) h.step(16) // establish internal position ≈ 1.4px
    h.setRaw(500) // swipe momentum lands the scroller at 500
    h.step(16)
    expect(h.rawScroll()).toBeGreaterThanOrEqual(500)
    expect(h.rawScroll()).toBeLessThan(502)
    h.restore()
  })
})
