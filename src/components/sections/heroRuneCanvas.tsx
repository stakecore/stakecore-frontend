import { useEffect, useRef } from 'react'
import profile from '../../assets/images/about/profile.svg'


// Fixed grid of ASCII cells acting like a low-res B&W display. Per-cell
// intensity comes from two sources:
//   1) A static base, sampled from a rasterized profile.svg — cells under
//      the rune's strokes have high intensity, cells outside near zero.
//   2) A radial sine wave centered on the grid that breathes outward over
//      time, modulating every cell.
// Each frame, the combined intensity picks a glyph from the RAMP (empty →
// full). The rune is rendered as ASCII pixels and pulses with the wave.
//
// The render loop is optimized for main-thread frugality (see comments
// inside): per-cell `sqrt` is folded into a setup-time distance bin, the
// wave is evaluated once per bin (not once per cell), every RAMP glyph
// is pre-rasterized into an ImageBitmap so `drawImage` is a fast blit,
// and the frame loop walks bins (256) rather than cells (~21K).
const RAMP = ' .,:;+*x#@'

const HeroRuneCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cellSize = 10
    // Number of bins the radial wave is discretized into. The wave is
    // purely a function of (dist, phase), so cells at the same distance
    // share a value — bin distance and evaluate the wave once per bin
    // per frame rather than once per cell per frame.
    const BIN_COUNT = 256

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let cx = 0
    let cy = 0
    let maxDist = 1
    let base: Float32Array | null = null
    // Per-cell precomputations — these only depend on the grid layout,
    // never on phase, so they're built once at setup() and reused every
    // frame.
    let distBinArr: Uint16Array | null = null   // which radial bin each cell lives in
    let xPixelArr: Float32Array | null = null   // x * cellSize, cached
    let yPixelArr: Float32Array | null = null   // y * cellSize, cached
    // Per-frame radial LUT: charArrIdx[bin] = which RAMP glyph this bin
    // should render this frame. Reused across cells.
    const charArrIdx = new Uint8Array(BIN_COUNT)
    // Pre-rasterized glyph sprites — one canvas per (RAMP char × color).
    // drawImage of a pre-rasterized sprite is dramatically cheaper than
    // fillText, which has to lay out + rasterize the glyph each call.
    // ImageBitmaps so drawImage can take a fast GPU-upload path; falls
    // back to the source canvases if createImageBitmap is unavailable.
    let glyphsOutside: (ImageBitmap | HTMLCanvasElement)[] = []
    let glyphsInside: (ImageBitmap | HTMLCanvasElement)[] = []
    // Cell indices grouped by (bin, inside). Indexed `bin * 2 + inside`.
    // Lets the frame loop skip entire bins when their wave value lands
    // on the space glyph, rather than scanning every cell.
    let cellsByBinInside: Uint16Array[] = []

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / cellSize)
      rows = Math.ceil(h / cellSize)
      cx = cols / 2
      cy = rows / 2
      maxDist = Math.sqrt(cx * cx + cy * cy) || 1

      // Precompute, per cell: the radial-bin index, and the pixel
      // coordinates. Drops 20K sqrt + 40K multiplications from every
      // frame down to once-per-setup.
      const n = cols * rows
      distBinArr = new Uint16Array(n)
      xPixelArr = new Float32Array(n)
      yPixelArr = new Float32Array(n)
      const binScale = BIN_COUNT / maxDist
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          const bin = Math.min(BIN_COUNT - 1, (dist * binScale) | 0)
          const i = y * cols + x
          distBinArr[i] = bin
          xPixelArr[i] = x * cellSize
          yPixelArr[i] = y * cellSize
        }
      }
    }

    // Render each RAMP glyph once into a small offscreen canvas, then
    // (when available) upgrade to an ImageBitmap. drawImage of an
    // ImageBitmap can be uploaded to the GPU and is consistently
    // faster than drawing from a Canvas backing store.
    const buildGlyphs = async (color: string): Promise<(ImageBitmap | HTMLCanvasElement)[]> => {
      const px = Math.ceil(cellSize * dpr)
      const sources = Array.from(RAMP).map((c) => {
        const off = document.createElement('canvas')
        off.width = px
        off.height = px
        const octx = off.getContext('2d')
        if (octx) {
          octx.font = `${cellSize * dpr}px 'Roboto Mono', ui-monospace, monospace`
          octx.fillStyle = color
          octx.textBaseline = 'top'
          octx.fillText(c, 0, 0)
        }
        return off
      })
      if (typeof createImageBitmap !== 'function') return sources
      try {
        return await Promise.all(sources.map((src) => createImageBitmap(src)))
      } catch {
        return sources
      }
    }

    // Index every cell into a (bin × inside) bucket so the per-frame
    // loop iterates 512 buckets instead of N cells — and skips entire
    // buckets in one branch when the bin's wave value picks the space
    // glyph. Two passes: one to count, one to fill, both O(N).
    const buildCellGroups = () => {
      if (!base || !distBinArr) return
      const n = cols * rows
      const slots = BIN_COUNT * 2
      const counts = new Uint32Array(slots)
      for (let i = 0; i < n; i++) {
        const slot = distBinArr[i] * 2 + (base[i] > 0.05 ? 1 : 0)
        counts[slot]++
      }
      const groups = new Array<Uint16Array>(slots)
      for (let s = 0; s < slots; s++) groups[s] = new Uint16Array(counts[s])
      const writeIdx = new Uint32Array(slots)
      for (let i = 0; i < n; i++) {
        const slot = distBinArr[i] * 2 + (base[i] > 0.05 ? 1 : 0)
        groups[slot][writeIdx[slot]++] = i
      }
      cellsByBinInside = groups
    }

    // Rasterize the rune SVG into a centered region of the grid so the
    // wave can fill the full viewport without stretching the mark.
    // Target ~40% of the shorter grid dimension; preserve SVG aspect
    // (340 × 380); clamp + centre so the mark sits at the visual middle.
    const SVG_ASPECT = 340 / 380
    const rasterize = () => new Promise<Float32Array>((resolve) => {
      const arr = new Float32Array(cols * rows)
      const img = new Image()
      img.onload = () => {
        const minor = Math.min(cols, rows)
        let runeH = Math.max(20, Math.round(minor * 0.55))
        let runeW = Math.round(runeH * SVG_ASPECT)
        if (runeW > cols) {
          runeW = cols
          runeH = Math.round(runeW / SVG_ASPECT)
        }
        const off = document.createElement('canvas')
        off.width = runeW
        off.height = runeH
        const octx = off.getContext('2d')
        if (!octx) { resolve(arr); return }
        octx.drawImage(img, 0, 0, runeW, runeH)
        const data = octx.getImageData(0, 0, runeW, runeH).data
        const xOffset = Math.floor((cols - runeW) / 2)
        const yOffset = Math.floor((rows - runeH) / 2)
        for (let y = 0; y < runeH; y++) {
          for (let x = 0; x < runeW; x++) {
            const r = data[(y * runeW + x) * 4]
            const a = data[(y * runeW + x) * 4 + 3]
            arr[(y + yOffset) * cols + (x + xOffset)] = (r / 255) * (a / 255)
          }
        }
        resolve(arr)
      }
      img.src = profile
    })

    const drawFrame = (phase: number) => {
      if (!base || !xPixelArr || !yPixelArr || cellsByBinInside.length === 0) return

      // 1) Update the radial LUT: one (charIdx) per bin. BIN_COUNT sin
      //    pairs per frame instead of one per cell — ~80× fewer
      //    transcendental calls on a 1080p viewport.
      const rampLast = RAMP.length - 1
      const rampLen = RAMP.length
      for (let bin = 0; bin < BIN_COUNT; bin++) {
        const r = (bin / BIN_COUNT) * maxDist
        const wave =
          0.5 + 0.35 * Math.sin(r * 0.42 - phase)
              + 0.15 * Math.sin(r * 0.18 - phase * 0.6)
        const idx = wave <= 0 ? 0 : wave >= 1 ? rampLast : (wave * rampLen) | 0
        charArrIdx[bin] = idx
      }

      // 2) Clear, then iterate bins (256) rather than cells (~21K). For
      //    each bin whose wave value picks a non-space glyph, walk its
      //    pre-built inside / outside cell list and stamp the sprite.
      //    Bins on the space glyph short-circuit out completely.
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      for (let bin = 0; bin < BIN_COUNT; bin++) {
        const charIdx = charArrIdx[bin]
        if (charIdx === 0) continue
        const outCells = cellsByBinInside[bin * 2]
        const inCells = cellsByBinInside[bin * 2 + 1]
        const outGlyph = glyphsOutside[charIdx]
        const inGlyph = glyphsInside[charIdx]
        const outLen = outCells.length
        for (let k = 0; k < outLen; k++) {
          const i = outCells[k]
          ctx.drawImage(outGlyph, xPixelArr[i], yPixelArr[i], cellSize, cellSize)
        }
        const inLen = inCells.length
        for (let k = 0; k < inLen; k++) {
          const i = inCells[k]
          ctx.drawImage(inGlyph, xPixelArr[i], yPixelArr[i], cellSize, cellSize)
        }
      }
    }

    // If the user prefers reduced motion, draw one static frame and
    // skip the rAF loop entirely.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    setup()
    // Glyphs are independent of grid layout, so they only need to be
    // built once. Rasterize + cell grouping happen on first mount and
    // again on resize.
    Promise.all([buildGlyphs('#6B6B6B'), buildGlyphs('#FFFFFF')]).then(([out, ins]) => {
      glyphsOutside = out
      glyphsInside = ins
    })

    rasterize().then((arr) => {
      base = arr
      buildCellGroups()
      if (reduceMotion) drawFrame(0)
    })

    let last = 0
    let phase = 0
    let raf = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (!base) return
      if (t - last < 80) return
      const dt = last === 0 ? 16 : t - last
      last = t
      phase += dt * 0.002
      drawFrame(phase)
    }
    if (!reduceMotion) raf = requestAnimationFrame(tick)

    const onResize = () => {
      setup()
      rasterize().then((arr) => {
        base = arr
        buildCellGroups()
        if (reduceMotion) drawFrame(0)
      })
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="hero-rune-canvas"
      aria-hidden
    />
  )
}

export default HeroRuneCanvas
