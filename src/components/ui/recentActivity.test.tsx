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

// The loop itself lives in useMarquee and is tested there, including how it
// splits its position between the scroll offset and the transform. What
// matters at this level is that the feed wires itself up to it as a row the
// user can swipe, and that a poll bringing new cards doesn't move the content
// out from under them.
describe('RecentActivity auto-scroll loop', () => {
  const items = [
    activity({ transaction: '0xtx_a', amount: '111' }),
    activity({ transaction: '0xtx_b', amount: '222' }),
  ]

  const harness = (initial: PageActivityDto[] = items) => {
    const origRaf = globalThis.requestAnimationFrame
    const origCaf = globalThis.cancelAnimationFrame
    const queue: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queue.push(cb)
      return queue.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})

    const { container, rerender } = render(
      <RecentActivity data={payload(initial)} isLoading={false} error="" />
    )
    const el = container.querySelector<HTMLDivElement>('.activity-marquee')
    const track = container.querySelector<HTMLDivElement>('.activity-marquee-track')
    if (!el || !track) throw new Error('marquee did not render')

    // happy-dom lays nothing out; give the track a width wider than the
    // viewport so one repeat can cover it and the loop is allowed to run.
    Object.defineProperty(track, 'offsetWidth', { configurable: true, get: () => 4000 })
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 800 })

    ObserverStub.intersection.find(o => o.target === el)?.cb([{ isIntersecting: true }])

    let ts = performance.now()
    const step = (dtMs: number) => {
      ts += dtMs
      queue.shift()?.(ts)
    }
    const restore = () => {
      vi.stubGlobal('requestAnimationFrame', origRaf)
      vi.stubGlobal('cancelAnimationFrame', origCaf)
    }
    const offset = () => {
      const m = /translateX\((-?[\d.]+)px\)/.exec(track.style.transform)
      return m?.[1] == null ? 0 : -Number(m[1])
    }
    // Content is drawn at scrollLeft + whatever the transform holds, so this
    // is the one number that says where the row actually sits.
    const position = () => el.scrollLeft + offset()
    const poll = (next: PageActivityDto[]) =>
      rerender(<RecentActivity data={payload(next)} isLoading={false} error="" />)
    return { el, track, step, offset, position, poll, restore }
  }

  it('moves once the feed has cards', () => {
    const h = harness()
    for (let i = 0; i < 12; i++) h.step(100 / 12)
    expect(h.position()).toBeGreaterThan(0)
    h.restore()
  })

  // This row is swipeable, so the loop shares the scroller rather than holding
  // a position beside it. Travel that lives only in the transform is travel
  // the user cannot scroll back past: they reach scrollLeft 0 and the first
  // card is still held off to the left, further every second.
  it('keeps its travel in the scroll offset, where a swipe can reach it', () => {
    const h = harness()
    for (let i = 0; i < 20; i++) h.step(16)
    expect(h.el.scrollLeft).toBeGreaterThan(0)
    // Nothing meaningful is parked out of reach in the transform.
    expect(Math.abs(h.offset())).toBeLessThan(1)
    h.restore()
  })

  it('carries on from a scroll position the user swiped to', () => {
    const h = harness()
    for (let i = 0; i < 5; i++) h.step(16)
    h.el.scrollLeft = 500
    h.step(16)
    expect(h.position()).toBeGreaterThanOrEqual(500)
    expect(h.position()).toBeLessThan(510)
    h.restore()
  })

  // A poll brings newer entries, and the list is newest-first, so they are
  // inserted in front of everything already on screen. The loop's position is
  // a distance from the track's left edge, so left alone the row jumps by the
  // width of whatever arrived — and the new cards land behind the position,
  // in the stretch nothing can scroll back to. Re-anchor on the card that led
  // the previous render: how far it moved is exactly what was inserted.
  it('holds its place when a poll prepends newer cards', () => {
    const pitch = 244
    const proto = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft')
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
      configurable: true,
      get(this: HTMLElement) {
        const siblings = this.parentElement ? [...this.parentElement.children] : []
        return Math.max(0, siblings.indexOf(this)) * pitch
      },
    })

    const h = harness()
    for (let i = 0; i < 20; i++) h.step(16)
    const before = h.position()

    h.poll([
      activity({ transaction: '0xtx_new', amount: '999', timestamp: 1785309999 }),
      ...items,
    ])

    // Same content under the viewport as the frame before, not a card's width
    // further along.
    expect(h.position()).toBeCloseTo(before + pitch, 1)
    h.restore()
    if (proto) Object.defineProperty(HTMLElement.prototype, 'offsetLeft', proto)
    else Reflect.deleteProperty(HTMLElement.prototype, 'offsetLeft')
  })
})

describe('RecentActivity landmark', () => {
  // The scroller carried aria-label="Recent activity" on a bare <div>. ARIA
  // forbids a naming attribute on an element with no role (axe:
  // aria-prohibited-attr), and assistive tech drops it — so the label named
  // nothing. A <section> with an accessible name is a region landmark, which
  // is the same shape the /about stack carousels already use.
  it('exposes the marquee as a named region rather than a labelled div', () => {
    const { getByRole } = render(
      <RecentActivity data={payload([activity({ transaction: '0xtx_region' })])} isLoading={false} />,
    )

    const region = getByRole('region', { name: 'Recent activity' })
    expect(region.classList.contains('activity-marquee')).toBe(true)
  })
})
