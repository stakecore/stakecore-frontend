# Mobile Hero Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Below 768px, replace the full-viewport WebGL ASCII wave in the hero with a canvas-2D ASCII shimmer confined to the StakeCore rune, so a phone never constructs a WebGL context.

**Architecture:** A new `HeroBackground` chooser subscribes to `matchMedia('(max-width: 767.98px)')` and mounts either the existing `HeroRuneCanvas` (desktop, unchanged) or a new `HeroRuneShimmer` (mobile). Mounting rather than branching inside one component is what removes the WebGL cost on phones. The cell arithmetic both canvases share moves into a pure, DOM-free `runeGrid.ts` so it can be unit-tested without a canvas.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest + happy-dom + @testing-library/react, Playwright 1.62.1.

**Spec:** [docs/superpowers/specs/2026-08-07-mobile-hero-background-design.md](../specs/2026-08-07-mobile-hero-background-design.md)

## Global Constraints

- Import alias `~/` resolves to `src/`. Existing files in `src/components/sections/` use **relative** imports for sibling files and assets — match them.
- `tsconfig.json` runs `strict: false` with `strictNullChecks: true` **and** `noUncheckedIndexedAccess`. Array/record indexing yields `T | undefined`. Use `?? fallback` or a real guard — **never `!`**.
- `pnpm lint` does not typecheck. Run `npx tsc -p tsconfig.json --noEmit` as well.
- There is **no global test setup file**, so RTL's auto-cleanup does not run. Any test file that renders more than once must call `afterEach(cleanup)` itself.
- Test files declare their environment per-file with a top-of-file `// @vitest-environment happy-dom` directive. Omit it for tests that need no DOM.
- Unit tests live next to their source as `*.test.ts(x)` inside `src/`. `vite.config.js` pins `test.include` to `src/**/*.test.{ts,tsx}` — a test outside `src/` will not run.
- Run scripts with `pnpm <script>`.
- Breakpoint value is exactly `(max-width: 767.98px)` — `t.down(md)` from `src/assets/css/_tokens.scss`. Do not round to `768px`.
- Commit after each task.

---

### Task 1: `runeGrid.ts` — the shared, pure cell arithmetic

**Files:**
- Create: `src/components/sections/runeGrid.ts`
- Test: `src/components/sections/runeGrid.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `RAMP: string` — the 10-character density ramp `' .,:;+*x#@'`. Index 0 is a space.
  - `SVG_ASPECT: number` — `340 / 380`.
  - `interface RuneBox { rw: number; rh: number; x0: number; y0: number }` — size and top-left of the rune's box, in cells.
  - `runeBox(cols: number, rows: number, frac: number): RuneBox`
  - `glyphIndex(alpha: number, dist: number, phase: number): number` — always in `[0, RAMP.length - 1]`.
  - `glyphAt(alpha: number, dist: number, phase: number): string` — a character from `RAMP`, or `''` when the cell should stay blank.

- [ ] **Step 1: Write the failing test**

Create `src/components/sections/runeGrid.test.ts`. No `@vitest-environment` directive — this module touches no DOM, so it runs in Vitest's default node environment.

```ts
// No @vitest-environment directive: runeGrid is pure arithmetic with no DOM
// access, so the default (node) environment is both correct and faster.

import { describe, it, expect } from 'vitest'
import { RAMP, SVG_ASPECT, runeBox, glyphIndex, glyphAt } from './runeGrid'

describe('runeBox', () => {
  it('sizes off the width and centres the box', () => {
    // A 390x844 viewport at 10px cells is a 39x85 grid.
    expect(runeBox(39, 85, 0.72)).toEqual({ rw: 28, rh: 31, x0: 6, y0: 27 })
  })

  it('clamps to the available rows when the mark would overflow', () => {
    // A landscape phone: plenty of columns, almost no rows.
    const box = runeBox(200, 12, 0.72)
    expect(box.rh).toBe(12)
    expect(box.rw).toBe(Math.round(12 * SVG_ASPECT))
    expect(box.y0).toBe(0)
  })

  it('keeps the box inside the grid at every aspect ratio', () => {
    const grids: [number, number][] = [[39, 85], [26, 29], [12, 200], [200, 12], [1, 1]]
    for (const [cols, rows] of grids) {
      const { rw, rh, x0, y0 } = runeBox(cols, rows, 0.72)
      expect(x0).toBeGreaterThanOrEqual(0)
      expect(y0).toBeGreaterThanOrEqual(0)
      expect(x0 + rw).toBeLessThanOrEqual(cols)
      expect(y0 + rh).toBeLessThanOrEqual(rows)
    }
  })
})

describe('glyphIndex', () => {
  it('stays inside the ramp across a sweep of alpha, distance and phase', () => {
    for (let alpha = 0; alpha <= 1; alpha += 0.05) {
      for (let phase = 0; phase < 20; phase += 0.25) {
        for (const dist of [0, 3.7, 12, 40]) {
          const i = glyphIndex(alpha, dist, phase)
          expect(i).toBeGreaterThanOrEqual(0)
          expect(i).toBeLessThan(RAMP.length)
        }
      }
    }
  })

  it('reaches the top of the ramp at full alpha on the wave crest', () => {
    // sin(dist * 0.5 - phase) === 1 when the argument is pi/2.
    expect(glyphIndex(1, 0, -Math.PI / 2)).toBe(RAMP.length - 1)
  })

  it('sits at the bottom of the ramp where the mark has no ink', () => {
    expect(glyphIndex(0, 10, 3)).toBe(0)
  })

  it('is total on non-finite input rather than returning NaN', () => {
    expect(glyphIndex(NaN, 1, 1)).toBe(0)
  })
})

describe('glyphAt', () => {
  it('returns an empty string rather than a space for blank cells', () => {
    expect(glyphAt(0, 10, 3)).toBe('')
  })

  it('clamps rather than overflowing the ramp on infinite alpha', () => {
    expect(glyphAt(Infinity, 1, 1)).toBe('@')
  })

  it('only ever returns a blank or a character from the ramp', () => {
    for (let alpha = 0; alpha <= 1; alpha += 0.05) {
      for (let phase = 0; phase < 10; phase += 0.3) {
        const ch = glyphAt(alpha, 7, phase)
        expect(ch === '' || RAMP.includes(ch)).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run runeGrid`
Expected: FAIL — `Failed to resolve import "./runeGrid"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/sections/runeGrid.ts`:

```ts
// Cell arithmetic shared by the two hero rune backgrounds. Pure — no DOM — so
// the maths that decides which glyph lands in which cell is unit-testable
// without a canvas, which happy-dom cannot provide.

/** Density ramp, faintest to brightest. Index 0 is a space: draw nothing. */
export const RAMP = ' .,:;+*x#@'

/** profile.svg is viewBox="170 180 340 380". */
export const SVG_ASPECT = 340 / 380

export interface RuneBox {
  /** Box size, in cells. */
  rw: number
  rh: number
  /** Top-left of the box within the full grid, in cells. */
  x0: number
  y0: number
}

/**
 * Centre a rune-shaped box in a `cols x rows` grid, sized as `frac` of the
 * grid WIDTH.
 *
 * Width-driven on purpose. The desktop field sizes off the *shorter* grid
 * axis, which on a phone is always the width — so a nominal 55% rendered at
 * ~49% of the screen and read as incidental. On the mobile canvas the mark is
 * the only thing there and earns the space.
 */
export function runeBox(cols: number, rows: number, frac: number): RuneBox {
  let rw = Math.round(cols * frac)
  let rh = Math.round(rw / SVG_ASPECT)
  // A very short viewport (landscape phone) would otherwise overflow the grid.
  if (rh > rows) {
    rh = rows
    rw = Math.round(rh * SVG_ASPECT)
  }
  return { rw, rh, x0: Math.round((cols - rw) / 2), y0: Math.round((rows - rh) / 2) }
}

/**
 * Ramp index for one cell: the rune's own ink coverage there, modulated by a
 * slow radial wave so glyphs inside the mark drift up and down the ramp.
 *
 * Always in [0, RAMP.length - 1]. Both guards are load-bearing. `floor(1 * 10)`
 * is 10 — one past the end — and under `noUncheckedIndexedAccess` that reads
 * back `undefined` and silently paints nothing. A non-finite alpha would
 * survive the clamp as NaN and index just as badly.
 */
export function glyphIndex(alpha: number, dist: number, phase: number): number {
  const wave = alpha * (0.58 + 0.42 * Math.sin(dist * 0.5 - phase))
  const clamped = Math.min(Math.max(wave, 0), 0.9999)
  if (!Number.isFinite(clamped)) return 0
  return Math.floor(clamped * RAMP.length)
}

/**
 * The glyph for one cell, or '' when the cell should stay blank. Total by
 * construction, so callers never index RAMP themselves and there is no
 * `undefined` to assert away.
 */
export function glyphAt(alpha: number, dist: number, phase: number): string {
  const ch = RAMP[glyphIndex(alpha, dist, phase)] ?? ''
  return ch === ' ' ? '' : ch
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run runeGrid`
Expected: PASS, 10 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/runeGrid.ts src/components/sections/runeGrid.test.ts
git commit -m "feat(hero): extract pure rune-grid arithmetic

The cell maths shared by the hero backgrounds is the part that can be
tested without a canvas. glyphAt is total by construction so no call site
indexes RAMP directly — floor(1 * 10) is one past the end, and under
noUncheckedIndexedAccess that reads back undefined and paints nothing.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: `heroRuneShimmer.tsx` — the mobile canvas

**Files:**
- Create: `src/components/sections/heroRuneShimmer.tsx`
- Reference (do not modify): `src/components/sections/heroRuneCanvas.tsx`

**Interfaces:**
- Consumes: `runeBox`, `glyphAt` from `./runeGrid` (Task 1).
- Produces: default export `HeroRuneShimmer`, a component taking no props, rendering `<canvas className="hero-rune-canvas hero-rune-canvas--shimmer" aria-hidden />`.

There is **no unit test for this file**, and that is deliberate: happy-dom provides no 2D canvas context, so a test could only assert that methods were called on a stub. `heroRuneCanvas.tsx` is untested today for the same reason. Verification is the typechecker, the lint pass, and a real browser in Step 3.

- [ ] **Step 1: Write the component**

Create `src/components/sections/heroRuneShimmer.tsx`:

```tsx
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
const ALPHA_FLOOR = 0.06      // below this the cell is outside the mark

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
      // Only the rune's box is ever painted, so only it needs clearing.
      ctx.clearRect(x0 * CELL_SIZE, y0 * CELL_SIZE, rw * CELL_SIZE, rh * CELL_SIZE)
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
```

- [ ] **Step 2: Typecheck, lint, and confirm the existing suite is untouched**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint && pnpm test`
Expected: clean typecheck, clean lint, 332 tests passing (322 existing + 10 from Task 1).

- [ ] **Step 3: See it in a real browser**

The component is not yet mounted by anything, so render it directly. Invoke the project's `verify` skill (Skill tool, `verify`) if you have it; otherwise use this fallback, which needs no app wiring:

```bash
pnpm build && pnpm exec vite preview &
```

Then, with the preview server up on `https://localhost:4173`, take a mobile-viewport screenshot of the home route once Task 4 has wired it in. Until then, confirm only that the build succeeds and the module has no import cycle:

Run: `pnpm build`
Expected: build succeeds, no warnings naming `heroRuneShimmer`.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/heroRuneShimmer.tsx
git commit -m "feat(hero): add the canvas-2D rune shimmer for phones

Draws only the ~340 cells inside the rune, at 5fps, with no WebGL context
at all. Lifecycle mirrors heroRuneCanvas — destroyed flag guarding the
async rasterize, IntersectionObserver plus visibilitychange gating the
loop, ResizeObserver rather than window resize so the iOS URL-bar
collapse re-fits the backing store.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: `heroBackground.tsx` — the breakpoint chooser

**Files:**
- Create: `src/components/sections/heroBackground.tsx`
- Test: `src/components/sections/heroBackground.test.tsx`

**Interfaces:**
- Consumes: default exports of `./heroRuneCanvas` and `./heroRuneShimmer` (Task 2).
- Produces: default export `HeroBackground`, a component taking no props. Task 4 renders it from `hero.tsx`.

- [ ] **Step 1: Write the failing test**

Create `src/components/sections/heroBackground.test.tsx`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'

// Both canvases are stubbed out. The chooser's job is picking one, and
// neither real component can paint anything under happy-dom, which has no 2D
// or WebGL context.
vi.mock('./heroRuneCanvas', () => ({ default: () => <div data-testid="webgl-canvas" /> }))
vi.mock('./heroRuneShimmer', () => ({ default: () => <div data-testid="shimmer-canvas" /> }))

import HeroBackground from './heroBackground'

type Listener = () => void

// Replace window.matchMedia with a controllable fake. defineProperty and a
// saved descriptor, not vi.spyOn: the storage suites in this repo document
// spies silently ceasing to apply once another test has touched the same
// global, which turns a broken implementation green.
const installMatchMedia = (initial: boolean) => {
  let matches = initial
  const listeners = new Set<Listener>()
  const mql = {
    get matches() { return matches },
    addEventListener: (_type: string, listener: Listener) => { listeners.add(listener) },
    removeEventListener: (_type: string, listener: Listener) => { listeners.delete(listener) },
  }
  const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => mql),
  })
  return {
    /** Flip the query result and notify subscribers, as a real MQL would. */
    set(next: boolean) {
      matches = next
      listeners.forEach(listener => listener())
    },
    listenerCount: () => listeners.size,
    restore() {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
      else delete (window as { matchMedia?: unknown }).matchMedia
    },
  }
}

let mm: ReturnType<typeof installMatchMedia> | null = null

// No global setup file, so RTL's auto-cleanup does not run and a second
// render would match elements left behind by the first.
afterEach(() => {
  cleanup()
  mm?.restore()
  mm = null
})

describe('HeroBackground', () => {
  it('renders the shimmer below the md breakpoint', () => {
    mm = installMatchMedia(true)
    render(<HeroBackground />)
    expect(screen.getByTestId('shimmer-canvas')).toBeTruthy()
    expect(screen.queryByTestId('webgl-canvas')).toBeNull()
  })

  it('renders the WebGL field at and above the md breakpoint', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(screen.getByTestId('webgl-canvas')).toBeTruthy()
    expect(screen.queryByTestId('shimmer-canvas')).toBeNull()
  })

  it('queries exactly t.down(md), not a rounded 768px', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767.98px)')
  })

  it('swaps canvases when the viewport crosses the breakpoint', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(screen.getByTestId('webgl-canvas')).toBeTruthy()

    act(() => mm?.set(true))

    expect(screen.getByTestId('shimmer-canvas')).toBeTruthy()
    expect(screen.queryByTestId('webgl-canvas')).toBeNull()
  })

  it('unsubscribes from the media query on unmount', () => {
    mm = installMatchMedia(false)
    const { unmount } = render(<HeroBackground />)
    expect(mm.listenerCount()).toBe(1)
    unmount()
    expect(mm.listenerCount()).toBe(0)
  })

  it('falls back to the desktop field when matchMedia is unavailable', () => {
    const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    // @ts-expect-error deliberately removing a DOM global to model old Safari
    delete window.matchMedia
    try {
      render(<HeroBackground />)
      expect(screen.getByTestId('webgl-canvas')).toBeTruthy()
    } finally {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run heroBackground`
Expected: FAIL — `Failed to resolve import "./heroBackground"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/sections/heroBackground.tsx`:

```tsx
import { useSyncExternalStore } from 'react'
import HeroRuneCanvas from './heroRuneCanvas'
import HeroRuneShimmer from './heroRuneShimmer'


// Exactly t.down(md) from _tokens.scss. A rounded 768px would leave a 0.02px
// band where the stylesheet has switched to the mobile layout and this has not.
const MOBILE_QUERY = '(max-width: 767.98px)'

// matchMedia is guarded the same way the rest of the codebase guards it, and
// resolved per call rather than cached at module scope — a throw during module
// evaluation is the blank-page-before-React case.
const mediaQuery = () => window.matchMedia?.(MOBILE_QUERY) ?? null

const subscribe = (onChange: () => void) => {
  const mql = mediaQuery()
  if (mql == null) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const isMobile = () => mediaQuery()?.matches ?? false

/**
 * Picks the hero background by breakpoint.
 *
 * Mounting one or the other, rather than branching inside a single component,
 * is the whole point: a phone must never construct the WebGL2 context. Context
 * creation, two shader compiles, a program link and a glyph-atlas rasterization
 * are a fixed cost that no amount of per-frame tuning removes — and below md
 * they buy a field that is unreadable anyway.
 */
const HeroBackground = () => {
  const mobile = useSyncExternalStore(subscribe, isMobile)
  return mobile ? <HeroRuneShimmer /> : <HeroRuneCanvas />
}

export default HeroBackground
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run heroBackground`
Expected: PASS, 6 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc -p tsconfig.json --noEmit && pnpm lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/heroBackground.tsx src/components/sections/heroBackground.test.tsx
git commit -m "feat(hero): choose the background canvas by breakpoint

useSyncExternalStore over matchMedia at exactly t.down(md). Mounting one
canvas or the other, rather than branching inside one, is what keeps a
phone from ever constructing the WebGL2 context.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Wire it in and drop the now-dead mobile branch

**Files:**
- Modify: `src/components/sections/hero.tsx:5` and `:44`
- Modify: `src/components/sections/hero.scss:23-45`
- Modify: `src/components/sections/heroRuneCanvas.tsx:95-103` and `:217-220`

**Interfaces:**
- Consumes: `HeroBackground` from `./heroBackground` (Task 3).
- Produces: nothing new. After this task the mobile path is live.

- [ ] **Step 1: Point `hero.tsx` at the chooser**

In `src/components/sections/hero.tsx`, replace the import on line 5:

```tsx
import HeroRuneCanvas from './heroRuneCanvas'
```

with:

```tsx
import HeroBackground from './heroBackground'
```

and the usage on line 44:

```tsx
      <HeroRuneCanvas />
```

with:

```tsx
      <HeroBackground />
```

- [ ] **Step 2: Add the shimmer's opacity modifier to `hero.scss`**

In `src/components/sections/hero.scss`, replace the comment block above `.hero-rune-canvas` (lines 23-29) with this, since it currently claims the field renders at every breakpoint:

```scss
// Fixed-grid ASCII display, shared box for both hero backgrounds. The wave
// fills the full viewport (capped at the initial screen height so it doesn't
// keep growing on long pages) and fades into the page top and bottom.
//
// Which canvas fills it is chosen by heroBackground.tsx: the WebGL field at
// >= md, the rune-local shimmer below it. Both RAF loops are gated by
// IntersectionObserver + page visibility so off-screen or backgrounded
// instances don't burn cycles.
```

Then append this rule immediately after the closing brace of `.hero-rune-canvas` (after line 45):

```scss
// The shimmer draws far fewer and coarser glyphs than the desktop field, so it
// carries a little more presence without competing with the wordmark.
.hero-rune-canvas--shimmer {
    opacity: 0.36;
}
```

- [ ] **Step 3: Drop the dead mobile branch in `heroRuneCanvas.tsx`**

This component is now desktop-only, so its 768px cell-size switch can never take the mobile arm. In `src/components/sections/heroRuneCanvas.tsx`, replace lines 95-103 (the comment block plus the two `let` declarations; leave the `cellSizePx` line on 104 alone):

```tsx
    // Density + cell metrics. Recomputed in setup() on every resize so a DPI
    // switch (window dragged to a different-density monitor) or crossing the
    // 768px breakpoint re-renders at the right density instead of these stale
    // mount-time values.
    // Smaller cells on phones: more rune-silhouette samples (logo detail
    // becomes visible) and denser wave bands so the field doesn't read
    // as a few wide stretched stripes against a tall narrow viewport.
    let dpr = window.devicePixelRatio || 1
    let cellSize = window.innerWidth < 768 ? 6 : 10  // CSS pixels per cell
```

with:

```tsx
    // Density + cell metrics. dpr is recomputed in setup() on every resize so
    // a DPI switch (window dragged to a different-density monitor) re-renders
    // at the right density instead of a stale mount-time value.
    //
    // cellSize is a constant: heroBackground.tsx only mounts this component at
    // >= md, so the phone branch this used to carry is unreachable. Crossing
    // the breakpoint unmounts the component rather than re-measuring it.
    let dpr = window.devicePixelRatio || 1
    const cellSize = 10  // CSS pixels per cell
```

Then in `setup()`, delete the line that re-derived it (line 220):

```tsx
      cellSize = window.innerWidth < 768 ? 6 : 10
```

and amend the comment two lines above it (lines 217-218) from:

```tsx
      // Refresh density + cell size in case the DPI or the 768px breakpoint
      // changed since the last setup (monitor swap, orientation, zoom).
```

to:

```tsx
      // Refresh density in case the DPI changed since the last setup
      // (monitor swap, zoom).
```

- [ ] **Step 4: Run the full unit suite, typecheck and lint**

Run: `pnpm test && npx tsc -p tsconfig.json --noEmit && pnpm lint`
Expected: 338 tests passing (322 existing + 10 from Task 1 + 6 from Task 3), clean typecheck, clean lint.

- [ ] **Step 5: Look at it in a real browser**

Invoke the project's `verify` skill (Skill tool, `verify`). If it is unavailable, this fallback captures both breakpoints. Write it to the scratchpad, not the repo:

```js
import { chromium } from '@playwright/test'

const browser = await chromium.launch()
for (const [label, width, height] of [['mobile', 390, 844], ['desktop', 1280, 900]]) {
  const page = await browser.newPage({ viewport: { width, height }, ignoreHTTPSErrors: true })
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push('pageerror: ' + e.message))
  await page.goto('https://localhost:4173/#/')
  await page.waitForTimeout(2000)
  const cls = await page.locator('canvas.hero-rune-canvas').getAttribute('class')
  console.log(label, '->', cls, '| errors:', errors.filter(e => !/ERR_CERT_AUTHORITY_INVALID/.test(e)))
  await page.screenshot({ path: `hero-${label}.png` })
  await page.close()
}
await browser.close()
```

Start the server first with `pnpm build && pnpm exec vite preview`. Expected: `mobile -> hero-rune-canvas hero-rune-canvas--shimmer`, `desktop -> hero-rune-canvas`, no console errors on either, and the mobile screenshot showing a legible StakeCore rune rather than a dense field.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/hero.tsx src/components/sections/hero.scss src/components/sections/heroRuneCanvas.tsx
git commit -m "feat(hero): mount the shimmer background below md

Also drops heroRuneCanvas's 768px cell-size switch. It is unreachable now
that the chooser mounts this component only at >= md, and leaving it would
imply a breakpoint the component no longer handles.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: One mobile-viewport e2e spec

**Files:**
- Create: `e2e/mobile.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect` from `./fixtures/console`.
- Produces: nothing consumed by later tasks.

Playwright runs Chromium at a desktop viewport only, so without this the mobile path ships with no automated coverage at all. One route at one viewport — not a second full project, which would roughly double e2e runtime against the live backend.

- [ ] **Step 1: Write the spec**

Create `e2e/mobile.spec.ts`:

```ts
import { devices } from '@playwright/test'
import { test, expect } from './fixtures/console'

// The hero background is the only breakpoint-switched component in the app,
// and the desktop-only project would never exercise its mobile path. Scoped to
// one route at one viewport deliberately: a full mobile project roughly
// doubles e2e runtime against the live backend for very little extra signal.
test.use({ ...devices['Pixel 5'] })

test('the hero mounts the shimmer background, not the WebGL field', async ({ page, consoleErrors }) => {
  await page.goto('/#/')

  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()

  // Exactly one background canvas, and it is the mobile one. HeroRuneCanvas is
  // the only caller of getContext('webgl2') on this route, so its absence from
  // the DOM is the guarantee that no WebGL context was created.
  const canvas = page.locator('canvas.hero-rune-canvas')
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveClass(/hero-rune-canvas--shimmer/)

  // Point-in-time assertions, so let SWR settle first — same reasoning as
  // routes.spec.ts. Nothing on this page holds a connection open.
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.error-container')).toHaveCount(0)
  await expect(page.locator('.route-error')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})
```

- [ ] **Step 2: Run the new spec**

Run: `pnpm exec playwright test mobile.spec.ts`
Expected: PASS, 1 test. Playwright builds and starts `vite preview` itself via `webServer`.

- [ ] **Step 3: Run the whole e2e suite**

Run: `pnpm test:e2e`
Expected: all specs pass, including the a11y scans. The mobile spec adds one test.

If the a11y scan newly fails on the home route, do not suppress it — the shimmer canvas is `aria-hidden` and adds no accessible surface, so a failure means something else regressed. Investigate before proceeding.

- [ ] **Step 4: Commit**

```bash
git add e2e/mobile.spec.ts
git commit -m "test(e2e): assert the mobile hero mounts the shimmer canvas

The suite runs Desktop Chrome only, so the breakpoint-switched background
would otherwise ship with no automated coverage of its mobile path.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `pnpm test` — 338 passing
- [ ] `npx tsc -p tsconfig.json --noEmit` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm test:e2e` — all passing
- [ ] Mobile screenshot at 390×844 shows a legible StakeCore rune, no dense field
- [ ] Desktop at 1280×900 is visually unchanged from `main`
- [ ] With `prefers-reduced-motion: reduce` forced (`page.emulateMedia({ reducedMotion: 'reduce' })`), the mobile hero paints once and starts no RAF loop
