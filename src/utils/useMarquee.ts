import { type RefObject, useEffect } from 'react'

// Auto-scrolling marquee loop, shared by the hero activity feed and the
// About-page stack carousel. Extracted from recentActivity.tsx, where every
// constant below was tuned against real devices — see the comments at each.
//
// Contract for the element passed in:
//   • it is the horizontal scroller (`overflow-x`), not the fade-mask wrapper
//   • its content is duplicated exactly twice, so `scrollWidth / 2` is the
//     seam the loop wraps at and the two halves look identical
//   • its first element child is the track, whose width the ResizeObserver
//     watches for re-measurement

export interface MarqueeOptions {
  /** Pixels per second. Negative runs the track backwards. */
  speed?: number
  /** Set false while there is nothing to scroll yet; no loop is started. */
  enabled?: boolean
  /**
   * How many identical copies of the content the track holds. The wrap period
   * is one copy, so this is what turns `scrollWidth` into a distance the
   * position can actually travel. Two is the classic duplicated track; a
   * short roster needs more (see the reachability rule below).
   */
  copies?: number
}

// Clamp per-frame dt so the marquee can't catapult forward when the browser
// resumes rAF after a long pause (backgrounded tab, window minimised, etc.).
// 100ms ≈ 3px at 30px/s — well below visible.
const MAX_DT_MS = 100
// How long a wheel/touch interaction holds the loop off afterwards.
const PAUSE_MS = 1200
// Our own writes round-trip through scrollLeft within a device pixel; any
// larger divergence means the user scrolled natively (swipe momentum can
// outlast the interaction pause) and we adopt their position.
const EXTERNAL_SCROLL_PX = 1

export function useMarquee(
  ref: RefObject<HTMLElement | null>,
  { speed = 30, enabled = true, copies = 2 }: MarqueeOptions = {},
): void {
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let pauseUntil = 0
    let hovering = false
    let focused = false
    let lastTs = performance.now()
    let raf = 0
    let running = false
    // Scroll offsets snap to device pixels on write, and some engines round
    // scrollLeft on read, so read-modify-writing sub-pixel steps (0.5px per
    // 60Hz frame at 30px/s) drops the fraction and judders — or stalls
    // outright. Accumulate the true position here and assign it.
    let pos = el.scrollLeft
    // One copy of the content — the distance after which the track looks
    // identical again, and therefore the wrap period. Re-measured on resize
    // rather than read per frame: scrollWidth on a wide flex track right
    // after a React commit is a forced layout mid-animation.
    //
    // `period` is 0 when the wrap point is out of reach, which stops the loop
    // dead rather than letting it stall or tear. scrollLeft can never exceed
    // scrollWidth - clientWidth, so a period wider than that range is a
    // position the browser will clamp before the wrap ever fires: forwards
    // that means creeping to the end and freezing there, backwards it means
    // jumping by the wrong distance and visibly tearing. It happens whenever
    // one copy is narrower than the viewport — a short activity feed, or a
    // stack row with few items — and the fix at the call site is more copies,
    // not a faster loop.
    let period = 0
    const measure = () => {
      const wrap = el.scrollWidth / Math.max(1, copies)
      period = wrap <= el.scrollWidth - el.clientWidth ? wrap : 0
    }

    const markInteraction = () => { pauseUntil = performance.now() + PAUSE_MS }
    const onPointerEnter = () => { hovering = true }
    const onPointerLeave = () => { hovering = false }
    // Keyboard users get the same pause hover gives: without it, tabbing to a
    // link inside the track means chasing a moving target.
    const onFocusIn = () => { focused = true }
    const onFocusOut = () => { focused = false }

    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    el.addEventListener('wheel', markInteraction, { passive: true })
    el.addEventListener('touchstart', markInteraction, { passive: true })
    el.addEventListener('touchmove', markInteraction, { passive: true })

    const tick = (ts: number) => {
      // Guard rather than rely on cancelAnimationFrame alone: a frame already
      // queued when stop() ran would otherwise re-arm the loop forever.
      if (!running) return
      const dt = Math.min(ts - lastTs, MAX_DT_MS)
      lastTs = ts
      const paused = hovering || focused || ts < pauseUntil
      if (!paused) {
        const current = el.scrollLeft
        if (Math.abs(current - pos) > EXTERNAL_SCROLL_PX) pos = current
        pos += speed * (dt / 1000)
        // The content repeats, so pos and pos ± period look identical. Wrap
        // only while auto-scrolling so we never yank scrollLeft mid-swipe.
        if (pos >= period) pos -= period
        else if (pos < 0) pos += period
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      measure()
      // Nothing to scroll, or nowhere to wrap to. Either way, sitting still
      // beats burning a frame callback to inch into a clamp.
      if (period <= 0) return
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
    // per-frame scrollLeft writes when the user has scrolled it out of view.
    let visible = false
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting
        if (visible) start()
        else stop()
      },
      { threshold: 0 },
    )
    io.observe(el)

    // The track only changes width when items are added/removed or a
    // breakpoint flips the item size — re-measure then, not per frame.
    // Restart on the way back too: a narrower viewport can bring an
    // out-of-reach wrap point back into range, and start() bails without
    // arming anything when it is unreachable.
    const ro = new ResizeObserver(() => {
      measure()
      if (visible && !running) start()
    })
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeEventListener('wheel', markInteraction)
      el.removeEventListener('touchstart', markInteraction)
      el.removeEventListener('touchmove', markInteraction)
    }
    // `copies` belongs here: the caller raises it once it has measured how
    // many repeats the viewport needs, and a stale value leaves the loop
    // wrapping on the wrong period — the exact stale-closure bug
    // useExhaustiveDependencies exists to catch.
  }, [ref, speed, enabled, copies])
}
