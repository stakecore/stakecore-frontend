import { useEffect, useRef } from 'react'
import profile from '../../assets/images/about/profile.svg'
import { glyphAt, runeBox } from './runeGrid'


// Canvas-2D hero background for phones (< md).
//
// The desktop path (heroRuneCanvas.tsx) paints a full-viewport ASCII wave with
// the rune silhouette tinted brighter inside it. At 390x844 that is 9,165
// animated cells behind the wordmark, ~37M fragments/second, and a mark that
// never resolves at 6px cells. Here the field is gone: only the ~340 cells
// inside the rune are ever touched, and they shimmer up and down the density
// ramp at 5fps. No WebGL context, no shader compile, no glyph atlas.
const CELL_SIZE = 10          // CSS pixels per cell
const RUNE_WIDTH_FRAC = 0.72  // rune box as a fraction of the grid width
const FRAME_MS = 200          // ~5fps
const PHASE_PER_FRAME = 0.22  // ~5.7s for a full wave cycle at FRAME_MS
// A 100vh x 100vw backing store at 3x is ~12 MB to carry a few hundred glyphs.
// At 0.36 opacity behind a gradient mask, 2x is indistinguishable.
const MAX_DPR = 2
const ALPHA_FLOOR = 0.06      // at or below this the cell is outside the mark

const HeroRuneShimmer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('hero-rune: 2D context unavailable; background will not render')
      return
    }

    // Async work in flight at cleanup — the mask image load, a queued observer
    // callback, a re-entrant RAF tick — must short-circuit before touching the
    // canvas. Matters most under React strict-mode double-mount, where the
    // first effect's image can land after its own teardown.
    let destroyed = false

    let box = runeBox(1, 1, RUNE_WIDTH_FRAC)
    let mask = new Float32Array(0)
    let ready = false

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1)
      // Assigning width/height resets the bitmap AND the whole context state,
      // so font/baseline/fillStyle/transform are all re-applied below rather
      // than set once at mount. It also means a resize needs no explicit
      // clear: the assignment is the clear.
      canvas.width = Math.ceil(rect.width * dpr)
      canvas.height = Math.ceil(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${CELL_SIZE}px 'Roboto Mono', ui-monospace, monospace`
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#FFFFFF'
      box = runeBox(
        Math.ceil(rect.width / CELL_SIZE),
        Math.ceil(rect.height / CELL_SIZE),
        RUNE_WIDTH_FRAC,
      )
    }

    // Rasterize profile.svg at one sample per cell and read back the alpha
    // channel as the cell's ink coverage. Async because <img> loading is, but
    // it only runs at mount and on resize.
    const rasterize = () => new Promise<void>(resolve => {
      const img = new Image()
      img.onload = () => {
        if (destroyed) { resolve(); return }
        const off = document.createElement('canvas')
        off.width = box.rw
        off.height = box.rh
        const octx = off.getContext('2d')
        if (!octx) { resolve(); return }
        octx.drawImage(img, 0, 0, box.rw, box.rh)
        const data = octx.getImageData(0, 0, box.rw, box.rh).data
        const next = new Float32Array(box.rw * box.rh)
        for (let i = 0; i < next.length; i++) next[i] = (data[i * 4 + 3] ?? 0) / 255
        mask = next
        resolve()
      }
      // A missing or malformed asset must not leave the promise dangling —
      // `ready` would never flip and the loop would spin doing nothing.
      img.onerror = () => resolve()
      img.src = profile
    })

    let phase = 0

    const drawFrame = () => {
      const { rw, rh, x0, y0 } = box
      // Only the rune's box is ever painted, so only it needs clearing. Padded
      // by one cell on each side: textBaseline is 'top', so a glyph's baseline
      // sits at ~0.8em and descenders on ',' / ';' can paint a pixel or two
      // below the box's last row. Those pixels would fall outside an
      // exactly-sized clearRect and never get erased, accumulating into a
      // faint permanent band. The drawing loop itself is unchanged.
      ctx.clearRect(
        (x0 - 1) * CELL_SIZE,
        (y0 - 1) * CELL_SIZE,
        (rw + 2) * CELL_SIZE,
        (rh + 2) * CELL_SIZE,
      )
      const cx = rw / 2
      const cy = rh / 2
      for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
          const alpha = mask[y * rw + x] ?? 0
          if (alpha <= ALPHA_FLOOR) continue
          const ch = glyphAt(alpha, Math.hypot(x - cx, y - cy), phase)
          if (ch === '') continue
          ctx.fillText(ch, (x0 + x) * CELL_SIZE, (y0 + y) * CELL_SIZE)
        }
      }
    }

    let raf = 0
    let last = 0
    // Start optimistic so the first paint isn't delayed waiting on the
    // IntersectionObserver's first callback.
    let intersecting = true
    let pageVisible = !document.hidden
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    // RAF with a time gate rather than setInterval: RAF is already suspended
    // by the browser in background tabs, and the two observers below turn it
    // off for the off-screen and hidden cases.
    const tick = (t: number) => {
      if (destroyed) return
      raf = requestAnimationFrame(tick)
      if (!ready) return
      if (t - last < FRAME_MS) return
      last = t
      phase += PHASE_PER_FRAME
      drawFrame()
    }

    const startLoop = () => {
      if (destroyed || raf !== 0) return
      if (reduceMotion || !intersecting || !pageVisible) return
      // Reset so the first tick after a resume draws immediately instead of
      // waiting out a gate measured against a stale timestamp.
      last = 0
      raf = requestAnimationFrame(tick)
    }

    const stopLoop = () => {
      if (raf === 0) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    setup()
    rasterize().then(() => {
      if (destroyed) return
      ready = true
      if (reduceMotion) drawFrame()
      else startLoop()
    })

    const io = new IntersectionObserver(([entry]) => {
      if (destroyed || entry == null) return
      intersecting = entry.isIntersecting
      if (intersecting) startLoop()
      else stopLoop()
    })
    io.observe(canvas)

    const onVisibility = () => {
      if (destroyed) return
      pageVisible = !document.hidden
      if (pageVisible) startLoop()
      else stopLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ResizeObserver on the canvas rather than a window 'resize' listener, so
    // iOS Safari's URL-bar collapse and orientation changes both re-fit the
    // backing store to the 100vh box.
    const onResize = () => {
      if (destroyed) return
      setup()
      rasterize().then(() => {
        if (destroyed) return
        if (reduceMotion) drawFrame()
      })
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    return () => {
      destroyed = true
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      stopLoop()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="hero-rune-canvas hero-rune-canvas--shimmer"
      aria-hidden
    />
  )
}

export default HeroRuneShimmer
