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

// A focusin carrying a target the loop can ask about. Real browsers answer
// :focus-visible false for a click and true for a Tab; happy-dom has no such
// notion, so the target is stubbed to answer directly.
const focusIn = (el: HTMLElement, keyboard: boolean) => {
  const target = document.createElement('a')
  target.matches = (sel: string) => (sel === ':focus-visible' ? keyboard : false)
  el.appendChild(target)
  // Dispatched from the link so the event bubbles up to the listener with the
  // link as its target, which is how a real focus reaches the row.
  target.dispatchEvent(new Event('focusin', { bubbles: true }))
}

type HarnessProps = {
  speed?: number, enabled?: boolean, copies?: number, scrollable?: boolean,
}

const Harness = ({ speed, enabled = true, copies, scrollable }: HarnessProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useMarquee(ref, { speed, enabled, copies, scrollable })
  return (
    <div ref={ref} className="viewport">
      <div className="track" />
    </div>
  )
}

// The raw translate the loop wrote, in CSS px (negative moves content left).
const translateOf = (track: HTMLElement) => {
  const m = /translateX\((-?[\d.]+)px\)/.exec(track.style.transform)
  return m?.[1] == null ? 0 : Number(m[1])
}

// Reads back the x offset the loop has written, so assertions are in the
// same units the loop works in. Positive speed moves content left, i.e. a
// negative translate, so this is negated to keep the tests readable.
// `0 -` rather than unary minus: negating a zero translate yields -0, which
// Object.is (and therefore toBe) distinguishes from the 0 tests assert.
const offsetOf = (track: HTMLElement) => 0 - translateOf(track)

// Deterministic rAF: ticks are queued and stepped by hand with explicit
// timestamps, so each test controls frame count and per-frame dt.
const mount = (props: HarnessProps & {
  trackWidth?: number, clientWidth?: number,
  /**
   * Make the stub container round the scroll offset down on write, the way a
   * real scroller quantises it. This is the condition the whole design turns
   * on: whatever the container refuses to carry has to survive in the
   * transform, or the row freezes for part of every second.
   */
  quantiseScroll?: boolean,
} = {}) => {
  const origRaf = globalThis.requestAnimationFrame
  const origCaf = globalThis.cancelAnimationFrame
  const queue: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.push(cb)
    return queue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})

  // The hook observes el and track with one ResizeObserver, so the stub's
  // `target` ends up as whichever it observed last. Take it by creation order
  // instead.
  const roIndex = ObserverStub.resize.length
  const { container } = render(<Harness {...props} />)
  const el = container.querySelector<HTMLDivElement>('.viewport')
  const track = container.querySelector<HTMLDivElement>('.track')
  if (!el || !track) throw new Error('harness did not render')

  // happy-dom lays nothing out, so both of these read 0 without help. The
  // track width is mutable so a test can grow the content mid-flight.
  let trackWidth = props.trackWidth ?? 2000
  Object.defineProperty(track, 'offsetWidth', {
    configurable: true, get: () => trackWidth,
  })
  Object.defineProperty(el, 'clientWidth', {
    configurable: true, get: () => props.clientWidth ?? 400,
  })

  // happy-dom stores whatever float it is handed, so the sub-pixel remainder
  // would be zero and the interesting case untested. Floor on write instead.
  if (props.quantiseScroll) {
    let stored = 0
    Object.defineProperty(el, 'scrollLeft', {
      configurable: true,
      get: () => stored,
      set: (v: number) => { stored = Math.floor(v) },
    })
  }

  const io = ObserverStub.intersection.find(o => o.target === el)
  const enter = () => io?.cb([{ isIntersecting: true }])
  const leave = () => io?.cb([{ isIntersecting: false }])
  const resize = () => ObserverStub.resize[roIndex]?.cb([])

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
    el, track, enter, leave, resize, step, restore,
    frames: () => queue.length,
    offset: () => offsetOf(track),
    translate: () => translateOf(track),
    // Where the content actually sits, whichever channel is carrying it. The
    // container scrolls content left by scrollLeft and the transform adds to
    // that, so the two sum into one distance travelled.
    position: () => el.scrollLeft + offsetOf(track),
    grow: (px: number) => { trackWidth += px },
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

  it('drives the track alone when the container is not the user\'s scroller', () => {
    const h = mount({ speed: 60 })
    h.enter()
    for (let i = 0; i < 10; i++) h.step(10)
    expect(h.track.style.transform).toMatch(/translateX\(-[\d.]+px\)/)
    // A decorative row nobody can swipe: no reason to touch the scroll offset.
    expect(h.el.scrollLeft).toBe(0)
    h.restore()
  })

  // The reason `scrollable` exists. When the container IS a scroller the user
  // can swipe, a position kept only in the transform is one the user can never
  // reach: they can scroll to 0 and the loop still holds the content `pos` px
  // further left, with no way to bring it back. Keeping the travelled distance
  // in scrollLeft puts both hands on the same coordinate again.
  it('carries its position in the scroll offset when the container is scrollable', () => {
    const h = mount({ speed: 60, scrollable: true })
    h.enter()
    for (let i = 0; i < 10; i++) h.step(10)
    expect(h.el.scrollLeft).toBeGreaterThan(0)
    expect(h.position()).toBeGreaterThan(0)
    h.restore()
  })

  // The invariant that makes the row navigable: whatever the transform is
  // holding must be small enough that scrolling to 0 still reveals the start
  // of the content. A whole card's worth parked in the transform is a card
  // nothing can scroll back to.
  it('never parks more than a pixel of travel in the transform', () => {
    const h = mount({ speed: 60, scrollable: true, quantiseScroll: true })
    h.enter()
    for (let i = 0; i < 400; i++) {
      h.step(1000 / 60)
      expect(Math.abs(h.translate())).toBeLessThan(1)
    }
    h.restore()
  })

  // Same guarantee as the sub-pixel test above, but through the scroll
  // channel: the container floors every offset it is handed, so the fraction
  // has to survive in the transform or half the frames render no movement.
  it('still advances every frame when the container quantises the offset', () => {
    const h = mount({ speed: 25, scrollable: true, quantiseScroll: true })
    h.enter()
    const seen: number[] = []
    let prev = h.position()
    for (let i = 0; i < 10; i++) {
      h.step(1000 / 60)
      const now = h.position()
      seen.push(now - prev)
      prev = now
    }
    expect(seen.every(d => d > 0.3 && d < 0.5)).toBe(true)
    h.restore()
  })

  // Swipe momentum outlasts the interaction pause, so the loop has to notice
  // the user moved the scroller and carry on from there rather than yanking
  // them back to where it left off.
  it('continues from a scroll position the user set', () => {
    const h = mount({ speed: 60, scrollable: true })
    h.enter()
    for (let i = 0; i < 5; i++) h.step(16)
    h.el.scrollLeft = 500
    h.step(16)
    expect(h.position()).toBeGreaterThanOrEqual(500)
    expect(h.position()).toBeLessThan(510)
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

  it('does not advance while keyboard focus is inside the track', () => {
    const h = mount()
    h.enter()
    focusIn(h.el, true)
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBe(0)
    h.el.dispatchEvent(new Event('focusout'))
    for (let i = 0; i < 10; i++) h.step(100)
    expect(h.offset()).toBeGreaterThan(0)
    h.restore()
  })

  // Clicking a link inside the row focuses it, and the links open in a new
  // tab: come back and that anchor still holds focus, with no focusout ever
  // fired. Latching on any focus at all left the row stopped for good. Only
  // keyboard focus needs the pause — that is the case where a moving target
  // is unusable — and :focus-visible is exactly that distinction.
  it('does not latch on focus the user got by clicking', () => {
    const h = mount()
    h.enter()
    focusIn(h.el, false)
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

  // The observer that refreshes the period runs after the frame that follows
  // a content change, so a wrap landing in that window would use a distance
  // the content no longer repeats at and tear. Re-measuring at the seam costs
  // one layout read per lap.
  it('re-measures at the seam rather than wrapping by a stale period', () => {
    const h = mount({ speed: 600, trackWidth: 2000, copies: 2 }) // period 1000
    h.enter()
    h.grow(2000) // content doubled; one repeat is now 2000, not 1000
    // dt is clamped at 100ms, so this is 60px a step: ~1500px, past the old
    // seam at 1000 but short of the real one at 2000.
    for (let i = 0; i < 25; i++) h.step(100)
    expect(h.offset()).toBeGreaterThan(1000)
    expect(h.offset()).toBeLessThan(2000)
    h.restore()
  })

  // measure() zeroes the period when one repeat can no longer cover the
  // container. Reaching a seam of zero used to subtract nothing, leaving the
  // loop travelling for ever: the row slides off and never comes back.
  it('stops instead of running away when the period becomes unusable', () => {
    const h = mount({ speed: 60, trackWidth: 2000, copies: 2, clientWidth: 400 })
    h.enter()
    h.grow(-1400) // 600px in two copies leaves 300px, short of the container
    h.resize()    // which is what the observer reports back
    // Bounded on purpose: a loop that never stops re-queues for ever, so
    // draining until empty would hang the run rather than fail the test.
    for (let i = 0; i < 40; i++) h.step(100)
    expect(h.frames()).toBe(0)
    expect(h.offset()).toBeLessThan(2000)
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
