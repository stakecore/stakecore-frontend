import { type RefObject, useEffect } from 'react'

// Auto-scrolling marquee loop, shared by the hero activity feed and the
// About-page stack carousel.
//
// The distance travelled is a float, and it is written out in two parts:
// whole pixels through the container's `scrollLeft`, the remaining fraction
// through a transform on the track. Both halves are load-bearing.
//
// The fraction has to ride the transform because scroll offsets are quantised
// to whole pixels. These marquees move 0.4-0.5px per frame, so a loop that
// only wrote scrollLeft rendered a 1px jump every second or third frame and
// sat perfectly still in between. Measured in Chromium at 60fps with no
// dropped frames: 58% of frames rendered zero movement on the carousel, 50%
// on the activity feed, and the only two per-frame deltas that ever occurred
// were 0px and 1px. A transform carries the fraction, and it composites, so
// the row does not repaint on the main thread every step.
//
// The whole pixels have to go through scrollLeft whenever the container is a
// scroller the user can swipe (`scrollable`), because otherwise the two share
// no coordinate. Content is drawn at `scrollLeft + travelled`, the user can
// only ever reach `scrollLeft >= 0`, and so a position held entirely in the
// transform is one they cannot scroll back to: the row silently keeps the
// first `travelled` px — up to a full repeat, minutes of content — out of
// reach, and swiping left stops against a card that is already half gone.
// Splitting the position puts both hands on the same value again, at no cost
// to smoothness. Per-frame on-screen delta of a real card, 180 frames:
//
//     transform only    sd 0.0018px    0% frozen frames
//     scrollLeft only   sd 0.5000px   50% frozen frames
//     split             sd 0.0016px    0% frozen frames
//
// A row nobody can swipe (`scrollable: false`, the About carousel) has no
// second coordinate to reconcile, so it keeps the whole position in the
// transform and never touches the scroll offset.
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
  /**
   * True when the container is a native scroller the user can swipe, so the
   * loop and the swipe have to share one position. See the header: without
   * it the loop's travel is an offset nothing can scroll back past.
   */
  scrollable?: boolean
}

// Clamp per-frame dt so the marquee can't catapult forward when the browser
// resumes rAF after a long pause (backgrounded tab, window minimised, etc.).
// 100ms ≈ 3px at 30px/s — well below visible.
const MAX_DT_MS = 100
// How long a wheel/touch interaction holds the loop off afterwards.
const PAUSE_MS = 1200
// Our own writes round-trip through scrollLeft within a device pixel, since
// the transform is holding everything below one. Any larger divergence means
// the user scrolled natively (swipe momentum can outlast the interaction
// pause) and we carry on from their position rather than yanking them back.
const EXTERNAL_SCROLL_PX = 1

// Whether a focus is one the user is navigating with, rather than the
// leftover of a click. Both pause the loop under a plain `focusin` latch, and
// the click case never lifts: the feed's links open in a new tab, so the
// anchor still holds focus when the user returns and no focusout is ever
// fired — the row stops for good. :focus-visible is exactly this distinction
// (Chromium: false for a click on a link, true for a Tab). Anything that
// cannot answer is treated as keyboard focus, which errs towards the pause
// the keyboard user needs.
function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true
  try {
    return target.matches(':focus-visible')
  } catch {
    return true
  }
}

export function useMarquee(
  ref: RefObject<HTMLElement | null>,
  { speed = 30, enabled = true, copies = 2, scrollable = false }: MarqueeOptions = {},
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
    // Distance travelled, in CSS pixels, kept as a float. On a scrollable row
    // it starts wherever the scroller already is, so a remount continues from
    // the user's position instead of jumping back to the start.
    let pos = scrollable ? el.scrollLeft : 0
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
    const onFocusIn = (e: Event) => { focused = isKeyboardFocus(e.target) }
    const onFocusOut = () => { focused = false }

    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    el.addEventListener('wheel', markInteraction, { passive: true })
    el.addEventListener('touchstart', markInteraction, { passive: true })
    el.addEventListener('touchmove', markInteraction, { passive: true })

    // Write the travelled distance out. On a scrollable row the container
    // takes the whole pixels and quantises them however it likes; whatever it
    // did not take is what the transform has to carry, so it is read back
    // rather than assumed. The read is cheap here: setting scrollLeft does
    // not dirty layout, so nothing has to be recomputed to answer it.
    const paint = () => {
      if (!scrollable) {
        track.style.transform = `translateX(${-pos}px)`
        return
      }
      el.scrollLeft = pos
      track.style.transform = `translateX(${el.scrollLeft - pos}px)`
    }

    const tick = (ts: number) => {
      // Guard rather than rely on cancelAnimationFrame alone: a frame already
      // queued when stop() ran would otherwise re-arm the loop forever.
      if (!running) return
      const dt = Math.min(ts - lastTs, MAX_DT_MS)
      lastTs = ts
      if (!(hovering || focused || ts < pauseUntil)) {
        if (scrollable && Math.abs(el.scrollLeft - pos) > EXTERNAL_SCROLL_PX) {
          pos = el.scrollLeft
        }
        pos += speed * (dt / 1000)
        // The content repeats, so pos and pos ± period look identical.
        if (pos >= period || pos < 0) {
          // Re-measure at the seam rather than trusting a period the resize
          // observer may not have refreshed yet — its callback lands after
          // the frame that follows a content change, so a wrap in that window
          // would use a distance the content no longer repeats at and tear.
          // One layout read per lap, not per frame.
          measure()
          // The wrap point has gone out of reach (a narrower viewport, or the
          // content shrank). Subtracting a period of zero would leave the row
          // travelling for ever, off screen and never coming back.
          if (period <= 0) { stop(); return }
          // Modulo rather than one subtraction: an adopted scroll position
          // can be several repeats away, and it still has to land in range.
          pos = ((pos % period) + period) % period
        }
        paint()
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
      // arbitrary offset it will never animate away. The scroll offset is
      // left alone on purpose: on a scrollable row it is the user's, and the
      // transform it pairs with was under a pixel.
      track.style.transform = ''
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeEventListener('wheel', markInteraction)
      el.removeEventListener('touchstart', markInteraction)
      el.removeEventListener('touchmove', markInteraction)
    }
  }, [ref, speed, enabled, copies, scrollable])
}
