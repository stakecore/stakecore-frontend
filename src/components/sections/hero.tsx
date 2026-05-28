import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { LandingPageService } from '~/backendApi'
import profile from '../../assets/images/about/profile.svg'
import ServerError from '../ui/serverError'
import RecentActivity from '../ui/recentActivity'
import { Diff } from '../pages/diff'
import { Formatter } from '~/utils/misc/formatter'
import { REFRESH_QUERY_SLOW_MS } from '~/constants'
import './hero.scss'


type HeroStats = {
  delegated: string
  delegators: string
  delegatedDiff: string
  delegatorDiff: string
}

const Hero = () => {
  const { data, isLoading, error } = useSWR(['page-info'], async () => {
    const resp = await LandingPageService.pageControllerGetPageInfo()
    if (resp?.data == null) throw new Error(resp.error)
    return resp
  }, { refreshInterval: REFRESH_QUERY_SLOW_MS })

  let stats: HeroStats | null = null
  if (data?.data != null) {
    const d0 = data.data.historicDelegations.reduce((x, y) => x + y.delegatedUsd, 0)
    const d1 = data.data.delegated.reduce((x, y) => x + y.delegatedUsd, 0)
    const u0 = data.data.historicDelegations.reduce((x, y) => x + y.delegators, 0)
    const u1 = data.data.delegated.reduce((x, y) => x + y.delegators, 0)
    stats = {
      delegated: Formatter.number(d1),
      delegators: Formatter.number(u1),
      delegatedDiff: Formatter.percent(d0 > 0 ? d1 / d0 - 1 : 0),
      delegatorDiff: Formatter.percent(u0 > 0 ? u1 / u0 - 1 : 0),
    }
  }

  const hasError = !isLoading && data == null

  return (
    <section className="hero">
      <HeroRuneCanvas />
      <div className="container">
        <header className="hero-brand">
          <h1 className="hero-wordmark">Stakecore</h1>
          <p className="hero-tagline">
            Validator infrastructure for Flare, Songbird, and Avalanche
          </p>
        </header>

        {hasError ? (
          <div className="hero-error">
            <ServerError status={500} message={error} />
          </div>
        ) : (
          <>
            <div className="hero-stats">
              <Stat label="Total Delegated" prefix="$" value={stats?.delegated} diff={stats?.delegatedDiff} />
              <Stat label="Delegators" value={stats?.delegators} diff={stats?.delegatorDiff} />
            </div>

            <div className="hero-activity">
              <RecentActivity data={data} isLoading={isLoading} error={error} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// Fixed grid of ASCII cells acting like a low-res B&W display. Per-cell
// intensity comes from two sources:
//   1) A static base, sampled from a rasterized profile.svg — cells under
//      the rune's strokes have high intensity, cells outside near zero.
//   2) A radial sine wave centered on the grid that breathes outward over
//      time, modulating every cell.
// Each frame, the combined intensity picks a glyph from the RAMP (empty →
// full). The rune is rendered as ASCII pixels and pulses with the wave.
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

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let cx = 0
    let cy = 0
    let base: Float32Array | null = null

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
        // Sprite size in cells. Tied to the shorter grid axis so portrait
        // and landscape viewports both show a centred, well-proportioned
        // rune (not a stretched-to-edges blob).
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
      if (!base) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${cellSize}px 'Roboto Mono', ui-monospace, monospace`
      ctx.textBaseline = 'top'

      // Inverted layout: every cell renders the radial wave glyph; cells
      // inside the rune silhouette use a brighter colour, so the mark
      // appears as a lighter ASCII silhouette embedded in the dimmer
      // field. Two passes keep fillStyle constant per pass.
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? '#6B6B6B' : '#FFFFFF'
        const wantInside = pass === 1
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const b = base[y * cols + x]
            const inside = b > 0.05
            if (inside !== wantInside) continue
            const dx = x - cx
            const dy = y - cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            // Two-octave radial wave for organic pulsing.
            const wave =
              0.5 + 0.5 * Math.sin(dist * 0.42 - phase) * 0.7
              + 0.5 * Math.sin(dist * 0.18 - phase * 0.6) * 0.3
            const idx = Math.min(RAMP.length - 1, Math.floor(wave * RAMP.length))
            const c = RAMP[idx]
            if (c === ' ') continue
            ctx.fillText(c, x * cellSize, y * cellSize)
          }
        }
      }
    }

    // If the user prefers reduced motion, draw one static frame and
    // skip the rAF loop entirely.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    setup()
    rasterize().then(arr => {
      base = arr
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
      rasterize().then(arr => {
        base = arr
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

const Stat = ({ label, value, diff, prefix }: {
  label: string
  value?: string
  diff?: string
  prefix?: string
}) => (
  <div className="hero-stat">
    <div className="hero-stat-label">{label}</div>
    <div className="hero-stat-value">
      {prefix && <span className="hero-stat-affix">{prefix}</span>}
      <span className="hero-stat-number">{value ?? '—'}</span>
    </div>
    {diff && (
      <div className="hero-stat-diff">
        <Diff diff={diff} unit="24h" pill />
      </div>
    )}
  </div>
)

export default Hero
