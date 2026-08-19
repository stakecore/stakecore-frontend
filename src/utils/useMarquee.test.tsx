// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { useRef } from 'react'
import { render, cleanup } from '@testing-library/react'
import { useMarquee } from './useMarquee'

// happy-dom has neither observer; stub both with instance capture so the
// tests can fire intersection/resize callbacks by hand.
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

afterEach(cleanup)

type HarnessProps = { speed?: number, enabled?: boolean, copies?: number }

const Harness = ({ speed, enabled = true, copies }: HarnessProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useMarquee(ref, { speed, enabled, copies })
  return (
    <div ref={ref} className="track">
      <div className="inner" />
    </div>
  )
}

// Deterministic rAF: ticks are queued and stepped by hand with explicit
// timestamps, so each test controls frame count and per-frame dt.
const mount = (props: HarnessProps & { clientWidth?: number } = {}) => {
  const origRaf = globalThis.requestAnimationFrame
  const origCaf = globalThis.cancelAnimationFrame
  const queue: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})

  const { container } = render(<Harness {...props} />)
  const el = container.querySelector<HTMLDivElement>('.track')
  if (!el) throw new Error('harness did not render a .track element')

  // Emulate how engines actually store scroll offsets: snapped on write,
  // and (as Safari does) rounded to an integer on read.
  let raw = 0
  Object.defineProperty(el, 'scrollLeft', {
    configurable: true,
    get: () => Math.round(raw),
    set: (v: number) => { raw = v },
  })
  Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => 2000 })
  // happy-dom reports 0 here, which would make every wrap period look
  // reachable. Tests that care about the scroll range set it explicitly.
  Object.defineProperty(el, 'clientWidth', {
    configurable: true, get: () => props.clientWidth ?? 0,
  })

  const io = ObserverStub.intersection.find(o => o.target === el)
  const enter = () => io?.cb([{ isIntersecting: true }])
  const leave = () => io?.cb([{ isIntersecting: false }])

  let ts = performance.now()
  const step = (dtMs: number) => {
    ts += dtMs
    queue.shift()?.(ts)
  }
  const restore = () => {
    vi.stubGlobal('requestAnimationFrame', origRaf)
    vi.stubGlobal('cancelAnimationFrame', origCaf)
  }
  return {
    el, enter, leave, step, restore,
    frames: () => queue.length,
    rawScroll: () => raw,
    setRaw: (v: number) => { raw = v },
  }
}

describe('useMarquee', () => {
  it('advances at speed even when the browser rounds scrollLeft reads', () => {
    const h = mount()
    h.enter()
    // 12 frames at ~8.33ms ≈ 100ms of 120Hz display: 30px/s should move ~3px.
    // A read-modify-write of the rounded value loses the fraction every
    // frame and never gets anywhere.
    for (let i = 0; i < 12; i++) h.step(100 / 12)
    expect(h.rawScroll()).toBeGreaterThan(2)
    h.restore()
  })

  it('honours the speed option', () => {
    const h = mount({ speed: 120 })
    h.enter()
    for (let i = 0; i < 10; i++) h.step(10) // 100ms at 120px/s ≈ 12px
    expect(h.rawScroll()).toBeGreaterThan(10)
    expect(h.rawScroll()).toBeLessThan(14)
    h.restore()
  })

  // A negative speed is how the stack carousel's second row runs backwards.
  // The wrap branch it depends on (pos < 0 → pos += half) had no coverage
  // before that row existed, so these two pin it.
  it('runs backwards on a negative speed', () => {
    const h = mount({ speed: -60 })
    h.enter()
    h.setRaw(500)
    for (let i = 0; i < 10; i++) h.step(10) // 100ms at 60px/s ≈ 6px back
    expect(h.rawScroll()).toBeLessThan(500)
    expect(h.rawScroll()).toBeGreaterThan(492)
    h.restore()
  })

  it('wraps forward to the seam when running backwards past zero', () => {
    const h = mount({ speed: -60 })
    h.enter()
    h.setRaw(1) // a hair above the start of a 2000px track
    for (let i = 0; i < 3; i++) h.step(50) // 3 × 3px back, straight past 0
    // Wrapped up to just under the halfway seam rather than clamping at 0,
    // where it would have stalled for good.
    expect(h.rawScroll()).toBeGreaterThan(990)
    expect(h.rawScroll()).toBeLessThan(1000)
    h.restore()
  })

  // Guards the width-caching design: the loop measures scrollWidth when it
  // starts (not per frame) and must still wrap at the duplicated-content seam.
  it('wraps back by half the track width at the seam', () => {
    const h = mount()
    h.enter()
    h.setRaw(998.5) // just short of the halfway seam of a 2000px track
    for (let i = 0; i < 3; i++) h.step(50) // 3 × 1.5px
    // Crossed 1000 → wrapped back near the start, not marching past the seam.
    expect(h.rawScroll()).toBeLessThan(10)
    expect(h.rawScroll()).toBeGreaterThan(0)
    h.restore()
  })

  // Guards the float-accumulator design: assigning a stale internal position
  // over a user's native swipe would yank the carousel back. A divergence
  // beyond one pixel must be adopted as the new position.
  it('adopts a native user scroll instead of yanking back', () => {
    const h = mount()
    h.enter()
    for (let i = 0; i < 3; i++) h.step(16) // establish internal position ≈ 1.4px
    h.setRaw(500) // swipe momentum lands the scroller at 500
    h.step(16)
    expect(h.rawScroll()).toBeGreaterThanOrEqual(500)
    expect(h.rawScroll()).toBeLessThan(502)
    h.restore()
  })

  it('does not advance while the pointer is over the track', () => {
    const h = mount()
    h.enter()
    h.el.dispatchEvent(new Event('pointerenter'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.rawScroll()).toBe(0)
    h.el.dispatchEvent(new Event('pointerleave'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.rawScroll()).toBeGreaterThan(0)
    h.restore()
  })

  it('does not advance while focus is inside the track', () => {
    const h = mount()
    h.enter()
    h.el.dispatchEvent(new Event('focusin'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.rawScroll()).toBe(0)
    h.el.dispatchEvent(new Event('focusout'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.rawScroll()).toBeGreaterThan(0)
    h.restore()
  })

  it('never schedules a frame when reduced motion is requested', () => {
    const orig = window.matchMedia
    window.matchMedia = ((q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q, addEventListener() {}, removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    const h = mount()
    h.enter()
    expect(h.frames()).toBe(0)
    window.matchMedia = orig
    h.restore()
  })

  // scrollLeft cannot exceed scrollWidth - clientWidth, so when one repeat of
  // the content is wider than that range the wrap point is unreachable: the
  // position clamps short of it and the marquee stalls there for good (or, on
  // a negative speed, jumps by the wrong distance and visibly tears). Refusing
  // to start is the honest outcome — a short row simply sits still.
  it('does not start when one repeat is wider than the scroll range', () => {
    // 2000px of content in two copies is a 1000px period, but a 1400px
    // viewport leaves only 600px of travel.
    const h = mount({ clientWidth: 1400 })
    h.enter()
    expect(h.frames()).toBe(0)
    h.restore()
  })

  it('starts when the scroll range can accommodate one repeat', () => {
    // Same 1000px period, but only 900px of it is on screen — 1100px of
    // travel, comfortably more than the period.
    const h = mount({ clientWidth: 900 })
    h.enter()
    expect(h.frames()).toBeGreaterThan(0)
    h.restore()
  })

  // More than two copies is how a short roster earns a reachable wrap point:
  // the period shrinks to scrollWidth / copies while the range grows.
  it('wraps on one repeat rather than half the track when given a copy count', () => {
    const h = mount({ copies: 4 }) // 2000 / 4 = 500px period
    h.enter()
    h.setRaw(499)
    h.step(100) // 30px/s for 100ms = 3px, straight past 500
    expect(h.rawScroll()).toBeLessThan(10)
    expect(h.rawScroll()).toBeGreaterThanOrEqual(0)
    h.restore()
  })

  it('never schedules a frame while disabled', () => {
    const h = mount({ enabled: false })
    h.enter()
    expect(h.frames()).toBe(0)
    h.restore()
  })

  it('stops scheduling frames once the track leaves the viewport', () => {
    const h = mount()
    h.enter()
    h.step(16)
    expect(h.frames()).toBeGreaterThan(0)
    h.leave()
    // Drain whatever was already queued; nothing new may be scheduled.
    while (h.frames() > 0) h.step(16)
    expect(h.frames()).toBe(0)
    h.restore()
  })
})
