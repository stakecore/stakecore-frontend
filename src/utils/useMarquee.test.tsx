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
    <div ref={ref} className="viewport">
      <div className="track" />
    </div>
  )
}

// Reads back the x offset the loop has written, so assertions are in the
// same units the loop works in. Positive speed moves content left, i.e. a
// negative translate, so this is negated to keep the tests readable.
const offsetOf = (track: HTMLElement) => {
  const m = /translateX\((-?[\d.]+)px\)/.exec(track.style.transform)
  return m?.[1] == null ? 0 : -Number(m[1])
}

// Deterministic rAF: ticks are queued and stepped by hand with explicit
// timestamps, so each test controls frame count and per-frame dt.
const mount = (props: HarnessProps & { trackWidth?: number, clientWidth?: number } = {}) => {
  const origRaf = globalThis.requestAnimationFrame
  const origCaf = globalThis.cancelAnimationFrame
  const queue: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})

  const { container } = render(<Harness {...props} />)
  const el = container.querySelector<HTMLDivElement>('.viewport')
  const track = container.querySelector<HTMLDivElement>('.track')
  if (!el || !track) throw new Error('harness did not render')

  // happy-dom lays nothing out, so both of these read 0 without help.
  Object.defineProperty(track, 'offsetWidth', {
    configurable: true, get: () => props.trackWidth ?? 2000,
  })
  Object.defineProperty(el, 'clientWidth', {
    configurable: true, get: () => props.clientWidth ?? 400,
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
    el, track, enter, leave, step, restore,
    frames: () => queue.length,
    offset: () => offsetOf(track),
  }
}

describe('useMarquee', () => {
  // The whole reason this animates transform rather than scrollLeft. Scroll
  // offsets are quantised to whole pixels, so at these speeds (0.4-0.5px per
  // frame) the row rendered a 1px jump every second or third frame and sat
  // frozen in between — measured at 58% frozen frames in Chromium. A
  // transform carries the fraction, so every frame moves.
  it('advances by a sub-pixel amount every frame', () => {
    const h = mount({ speed: 25 })
    h.enter()
    const seen: number[] = []
    let prev = h.offset()
    for (let i = 0; i < 10; i++) {
      h.step(1000 / 60)
      const now = h.offset()
      seen.push(now - prev)
      prev = now
    }
    // ~0.417px per frame, and crucially never a frozen frame.
    expect(seen.every(d => d > 0.3 && d < 0.5)).toBe(true)
    h.restore()
  })

  it('drives the track rather than the scroll offset', () => {
    const h = mount({ speed: 60 })
    h.enter()
    for (let i = 0; i < 10; i++) h.step(10)
    expect(h.track.style.transform).toMatch(/translateX\(-[\d.]+px\)/)
    // Untouched: the scroller is free for the user, and nothing fights it.
    expect(h.el.scrollLeft).toBe(0)
    h.restore()
  })

  it('honours the speed option', () => {
    const h = mount({ speed: 120 })
    h.enter()
    for (let i = 0; i < 10; i++) h.step(10) // 100ms at 120px/s ≈ 12px
    expect(h.offset()).toBeGreaterThan(10)
    expect(h.offset()).toBeLessThan(14)
    h.restore()
  })

  it('runs backwards on a negative speed', () => {
    const h = mount({ speed: -60 })
    h.enter()
    h.step(16)
    // Wrapped forward to just under one period rather than going negative.
    expect(h.offset()).toBeGreaterThan(900)
    expect(h.offset()).toBeLessThan(1000)
    h.restore()
  })

  it('wraps at one content repeat', () => {
    const h = mount({ speed: 60, trackWidth: 2000, copies: 2 }) // period 1000
    h.enter()
    for (let i = 0; i < 5; i++) h.step(1000 / 60)
    const before = h.offset()
    expect(before).toBeLessThan(1000)
    // Jump most of the way to the seam, then cross it.
    for (let i = 0; i < 200; i++) h.step(100)
    expect(h.offset()).toBeGreaterThanOrEqual(0)
    expect(h.offset()).toBeLessThan(1000)
    h.restore()
  })

  it('wraps on one repeat rather than half the track when given a copy count', () => {
    const h = mount({ speed: 60, trackWidth: 2000, copies: 4 }) // period 500
    h.enter()
    for (let i = 0; i < 300; i++) h.step(50)
    expect(h.offset()).toBeLessThan(500)
    expect(h.offset()).toBeGreaterThanOrEqual(0)
    h.restore()
  })

  it('does not advance while the pointer is over the track', () => {
    const h = mount()
    h.enter()
    h.el.dispatchEvent(new Event('pointerenter'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBe(0)
    h.el.dispatchEvent(new Event('pointerleave'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBeGreaterThan(0)
    h.restore()
  })

  it('does not advance while focus is inside the track', () => {
    const h = mount()
    h.enter()
    h.el.dispatchEvent(new Event('focusin'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBe(0)
    h.el.dispatchEvent(new Event('focusout'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBeGreaterThan(0)
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

  // Sliding one repeat off the left has to leave enough content to fill the
  // container, or its far end scrolls into view before the wrap comes round
  // and the row visibly runs out. What matters is trackWidth - period, not
  // the period on its own.
  it('does not start when the content left after one repeat cannot fill the container', () => {
    // 2000px in two copies leaves 1000px once one repeat has gone by, which
    // does not cover a 1400px container.
    const h = mount({ trackWidth: 2000, copies: 2, clientWidth: 1400 })
    h.enter()
    expect(h.frames()).toBe(0)
    h.restore()
  })

  it('starts when the remaining content covers the container', () => {
    // Same track in four copies: a 500px period leaves 1500px, ample for the
    // same 1400px container. More copies is the fix, not a slower speed.
    const h = mount({ trackWidth: 2000, copies: 4, clientWidth: 1400 })
    h.enter()
    expect(h.frames()).toBeGreaterThan(0)
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

  it('clears the transform on cleanup so a remount starts from rest', () => {
    const h = mount({ speed: 60 })
    h.enter()
    for (let i = 0; i < 5; i++) h.step(16)
    expect(h.offset()).toBeGreaterThan(0)
    cleanup()
    expect(h.track.style.transform).toBe('')
    h.restore()
  })
})
