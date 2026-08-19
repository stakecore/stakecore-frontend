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

const Harness = ({ speed, enabled = true }: { speed?: number, enabled?: boolean }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useMarquee(ref, { speed, enabled })
  return (
    <div ref={ref} className="track">
      <div className="inner" />
    </div>
  )
}

// Deterministic rAF: ticks are queued and stepped by hand with explicit
// timestamps, so each test controls frame count and per-frame dt.
const mount = (props: { speed?: number, enabled?: boolean } = {}) => {
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
