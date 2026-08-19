import { type RefObject, useEffect } from 'react'

// Auto-scrolling marquee loop, shared by the hero activity feed and the
// About-page stack carousel.
//
// It animates a transform on the track, NOT the container's scrollLeft.
// That is the whole design and it is worth stating plainly, because
// scrollLeft is the obvious choice and it is wrong: scroll offsets are
// quantised to whole pixels. These marquees move 0.4-0.5px per frame, so
// through scrollLeft the track rendered a 1px jump every second or third
// frame and sat perfectly still in between. Measured in Chromium at 60fps
// with no dropped frames: 58% of frames rendered zero movement on the
// carousel, 50% on the activity feed, and the only two per-frame deltas
// that ever occurred were 0px and 1px. A transform carries the fraction —
// the same measurement with the same loop showed zero frozen frames and a
// per-frame standard deviation of 0.001px — and it composites, so the row
// no longer repaints on the main thread every step.
//
// Two things follow from animating the track rather than scrolling it:
//
//   • The container's own scroll position is untouched, so a user swiping
//     the feed is never fought by the loop. The old code needed an
//     "adopt the user's scroll" branch to referee that; there is nothing
//     to referee now.
//   • The wrap is pure arithmetic in transform space rather than a
//     position the browser might clamp, so it cannot stall.
//
// Contract for the element passed in:
//   • its first element child is the track, and that is what gets moved
//   • the track's content is repeated exactly `copies` times, so one
//     repeat is the distance after which it looks identical again
//   • what remains after sliding one repeat off the left must still cover
//     the container, i.e. trackWidth - period >= containerWidth; otherwise
//     the far end of the content scrolls into view before the wrap comes
//     round. The loop refuses to start when that does not hold, and the
//     fix at the call site is more copies, not a slower speed.

export interface MarqueeOptions {
  /** Pixels per second. Negative runs the track backwards. */
  speed?: number
  /** Set false while there is nothing to scroll yet; no loop is started. */
  enabled?: boolean
  /**
   * How many identical repeats of the content the track holds. The wrap
   * period is one repeat, so this is what turns the track's width into the
   * distance the loop may travel before resetting.
   */
  copies?: number
}

// Clamp per-frame dt so the marquee can't catapult forward when the browser
// resumes rAF after a long pause (backgrounded tab, window minimised, etc.).
// 100ms ≈ 3px at 30px/s — well below visible.
const MAX_DT_MS = 100
// How long a wheel/touch interaction holds the loop off afterwards.
const PAUSE_MS = 1200

export function useMarquee(
  ref: RefObject<HTMLElement | null>,
  { speed = 30, enabled = true, copies = 2 }: MarqueeOptions = {},
): void {
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    const track = el.firstElementChild
    if (!(track instanceof HTMLElement)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let pauseUntil = 0
    let hovering = false
    let focused = false
    let lastTs = performance.now()
    let raf = 0
    let running = false
    // Distance travelled, in CSS pixels, kept as a float. Unlike a scroll
    // offset this is written straight back out as a transform, so the
    // fraction survives all the way to what the compositor draws.
    let pos = 0
    // One repeat of the content: the distance after which the track looks
    // identical. Measured from layout width, which a transform does not
    // affect, so this stays correct while the loop is running. 0 means the
    // loop must not run — see the reachability rule in the header.
    let period = 0
    const measure = () => {
      const width = track.offsetWidth
      const one = width / Math.max(1, copies)
      period = one > 0 && width - one >= el.clientWidth ? one : 0
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
      if (!(hovering || focused || ts < pauseUntil)) {
        pos += speed * (dt / 1000)
        // The content repeats, so pos and pos ± period look identical.
        if (pos >= period) pos -= period
        else if (pos < 0) pos += period
        track.style.transform = `translateX(${-pos}px)`
      }
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      measure()
      // Nothing to move, or one repeat cannot cover the viewport. Sitting
      // still beats tearing at the seam.
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

    // Only run the loop while the marquee is on-screen — no point animating
    // something the user has scrolled past.
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
    // unusable period back into range, and start() arms nothing while the
    // period is unusable.
    const ro = new ResizeObserver(() => {
      measure()
      if (visible && !running) start()
    })
    ro.observe(el)
    ro.observe(track)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      // Leave the track where it started, so a remount (or a switch into
      // reduced motion, which never starts a loop) doesn't inherit an
      // arbitrary offset it will never animate away.
      track.style.transform = ''
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeEventListener('wheel', markInteraction)
      el.removeEventListener('touchstart', markInteraction)
      el.removeEventListener('touchmove', markInteraction)
    }
  }, [ref, speed, enabled, copies])
}
