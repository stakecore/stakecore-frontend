# Mobile Hero Rune Band Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Below 768px, stop rendering anything behind the hero's content and instead place the StakeCore mark in a band of its own below the activity feed, as a filled panel with the mark knocked out of it.

**Architecture:** The mobile background canvas is deleted outright. A new static `HeroRuneBand` renders in normal flow at the end of the hero container: a CSS-filled panel with an inline SVG mark painted in the page background colour on top. The breakpoint chooser becomes a hook, because the desktop canvas (absolutely positioned, top of section) and the mobile band (in flow, end of container) no longer render in the same DOM position. A new `runeMark.ts` becomes the single definition of the mark's geometry, consumed by both the band and the desktop canvas.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest + happy-dom + @testing-library/react, Playwright 1.62.1, SCSS with design tokens.

**Spec:** [docs/superpowers/specs/2026-08-07-mobile-hero-rune-band-design.md](../specs/2026-08-07-mobile-hero-rune-band-design.md)

## Global Constraints

- `tsconfig.json` runs `strict: false` with `strictNullChecks: true` **and** `noUncheckedIndexedAccess`. Indexing yields `T | undefined`. Use `?? fallback` or a real guard — **never `!`**.
- **`pnpm lint` does NOT cover `.ts`/`.tsx` in this repo.** `eslint.config.js` matches only `**/*.{js,jsx}`, so TypeScript files report "File ignored because no matching configuration was supplied" and `eslint .` still exits 0. Never cite a passing `pnpm lint` as evidence your TypeScript is clean. `npx tsc -p tsconfig.json --noEmit` is the real check.
- Files in `src/components/sections/` use **relative** imports for siblings; `~/` resolves to `src/` and is used for cross-directory imports.
- Unit tests live next to their source as `*.test.ts(x)` inside `src/`. `vite.config.js` pins `test.include` to `src/**/*.test.{ts,tsx}`.
- Test files declare their environment per-file with a top-of-file `// @vitest-environment <name>` directive. **Do not write the literal token `@vitest-environment` inside an explanatory comment** — Vitest's scanner matches it anywhere in the file and reads the next word as the environment name.
- **There is no global test setup file**, so `@testing-library/react`'s auto-cleanup does not run. Any test file that renders more than once must call `afterEach(cleanup)` itself.
- Never replace globals with `vi.spyOn`. Use `Object.defineProperty` with a saved descriptor — `src/utils/safeStorage.test.ts` documents spies silently ceasing to apply once another test has touched the same global.
- The breakpoint literal is exactly `(max-width: 767.98px)` — `t.down(md)` from `src/assets/css/_tokens.scss`. Do not round to `768px`.
- SCSS uses design tokens: `@use '../../assets/css/tokens' as t;` then `t.$radius-md`, `t.up(md)`, etc.
- Package manager is pnpm. Baseline before Task 1 is **346 unit tests passing** at `563b284`. (An earlier draft of this plan said 339; that predated `12e11c2`, which added seven `Formatter.count` tests.)
- Commit after each task.

---

### Task 1: `runeMark.ts` — one definition of the mark

**Files:**
- Create: `src/components/sections/runeMark.ts`
- Test: `src/components/sections/runeMark.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `RUNE_VIEWBOX: string` — `'170 180 340 380'`
  - `RUNE_ASPECT: number` — `340 / 380`
  - `RUNE_STROKE_NATIVE: number` — `38`
  - `RUNE_STROKE_HEAVY: number` — `72`
  - `RUNE_PATHS: string[]` — three SVG path `d` strings
  - `RUNE_ROUGH: { baseFrequency: number; numOctaves: number; seed: number; scale: number }`
  - `runeSvgMarkup(strokeWidth: number): string` — a complete standalone SVG document, white strokes on transparent

- [ ] **Step 1: Write the failing test**

Create `src/components/sections/runeMark.test.ts`:

```ts
// This module is pure string and number data with no DOM access, so it runs in
// Vitest's default node environment. No environment directive is needed.

import { describe, it, expect } from 'vitest'
import {
  RUNE_ASPECT,
  RUNE_PATHS,
  RUNE_ROUGH,
  RUNE_STROKE_HEAVY,
  RUNE_STROKE_NATIVE,
  RUNE_VIEWBOX,
  runeSvgMarkup,
} from './runeMark'

describe('rune constants', () => {
  it('describes the mark as three strokes', () => {
    expect(RUNE_PATHS).toHaveLength(3)
    for (const d of RUNE_PATHS) expect(d.startsWith('M ')).toBe(true)
  })

  it('derives the aspect from the viewBox rather than restating it', () => {
    const [, , w, h] = RUNE_VIEWBOX.split(' ').map(Number)
    expect(RUNE_ASPECT).toBeCloseTo((w ?? 0) / (h ?? 1), 10)
  })

  it('keeps the heavy weight heavier than the native one', () => {
    expect(RUNE_STROKE_HEAVY).toBeGreaterThan(RUNE_STROKE_NATIVE)
  })
})

describe('runeSvgMarkup', () => {
  it('embeds every path, so the two renderers cannot diverge', () => {
    const svg = runeSvgMarkup(RUNE_STROKE_NATIVE)
    for (const d of RUNE_PATHS) expect(svg).toContain(d)
  })

  it('uses the stroke width it is given', () => {
    expect(runeSvgMarkup(38)).toContain('stroke-width="38"')
    expect(runeSvgMarkup(72)).toContain('stroke-width="72"')
  })

  it('carries the viewBox and the shared rough-filter parameters', () => {
    const svg = runeSvgMarkup(RUNE_STROKE_NATIVE)
    expect(svg).toContain(`viewBox="${RUNE_VIEWBOX}"`)
    expect(svg).toContain(`baseFrequency="${RUNE_ROUGH.baseFrequency}"`)
    expect(svg).toContain(`seed="${RUNE_ROUGH.seed}"`)
    expect(svg).toContain(`scale="${RUNE_ROUGH.scale}"`)
  })

  it('survives URI encoding, which is how it reaches the canvas', () => {
    const encoded = encodeURIComponent(runeSvgMarkup(RUNE_STROKE_NATIVE))
    expect(decodeURIComponent(encoded)).toBe(runeSvgMarkup(RUNE_STROKE_NATIVE))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run runeMark`
Expected: FAIL — `Failed to resolve import "./runeMark"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/sections/runeMark.ts`:

```ts
// The StakeCore mark, defined once.
//
// Two components render it, and they render it differently: heroRuneCanvas
// rasterizes it from an SVG data URI into a WebGL texture, heroRuneBand draws
// it as JSX. Both read their geometry from here. This module replaced an
// imported profile.svg for exactly that reason — an asset plus a set of inline
// paths is two definitions of one mark, and they drift silently.

/** viewBox of the mark as originally drawn. */
export const RUNE_VIEWBOX = '170 180 340 380'

/** Width / height of that viewBox. Used to size the rune texture. */
export const RUNE_ASPECT = 340 / 380

/** Stroke weight as drawn. Correct wherever the mark is a positive shape. */
export const RUNE_STROKE_NATIVE = 38

/**
 * Heavier weight, used only where the mark is a *cut* rather than a stroke —
 * there, heavier means a wider aperture. As a positive shape this overshoots:
 * the two curves merge into each other.
 */
export const RUNE_STROKE_HEAVY = 72

/** A bar across the top, and two mirrored curves sweeping in and back out. */
export const RUNE_PATHS = [
  'M 200 208 L 410 208',
  'M 200 208 C 340 295, 340 445, 200 530',
  'M 480 208 C 340 295, 340 445, 480 530',
]

/**
 * Rough-edge displacement. Load-bearing rather than decorative: without it the
 * curves go slick and the mark loses the hand-cut quality it was drawn with.
 */
export const RUNE_ROUGH = {
  baseFrequency: 0.06,
  numOctaves: 3,
  seed: 7,
  scale: 10,
}

/**
 * A complete standalone SVG document for the mark, white on transparent.
 * heroRuneCanvas encodes this into a data URI and rasterizes it; the alpha
 * channel becomes its rune mask.
 */
export function runeSvgMarkup(strokeWidth: number): string {
  return (
    `<svg viewBox="${RUNE_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs>` +
    `<filter id="r" x="-5%" y="-5%" width="110%" height="110%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${RUNE_ROUGH.baseFrequency}"` +
    ` numOctaves="${RUNE_ROUGH.numOctaves}" seed="${RUNE_ROUGH.seed}" result="noise"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${RUNE_ROUGH.scale}"` +
    ` xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>` +
    `</defs>` +
    `<g fill="none" stroke="#FFFFFF" stroke-width="${strokeWidth}"` +
    ` stroke-linecap="round" filter="url(#r)">` +
    RUNE_PATHS.map(d => `<path d="${d}"/>`).join('') +
    `</g></svg>`
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run runeMark`
Expected: PASS, 7 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/runeMark.ts src/components/sections/runeMark.test.ts
git commit -m "feat(hero): define the rune's geometry in one module

Two components are about to render the same mark in two different ways —
rasterized into a WebGL texture, and drawn as JSX. Both now read their
paths from here, so there is one definition to change rather than an SVG
asset and a set of inline paths drifting apart.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: `heroRuneBand.tsx` — the mobile band

**Files:**
- Create: `src/components/sections/heroRuneBand.tsx`
- Test: `src/components/sections/heroRuneBand.test.tsx`
- Modify: `src/components/sections/hero.scss` (append the band's rules)

**Interfaces:**
- Consumes: `RUNE_PATHS`, `RUNE_ROUGH`, `RUNE_STROKE_HEAVY`, `RUNE_VIEWBOX` from `./runeMark` (Task 1).
- Produces: default export `HeroRuneBand`, a component taking no props, rendering `<div class="hero-rune-band" aria-hidden>` containing `<svg class="hero-rune-band__mark">`.

Nothing renders this component yet — Task 3 wires it in. After this task it is unmounted, and that is expected.

- [ ] **Step 1: Write the failing test**

Create `src/components/sections/heroRuneBand.test.tsx`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import HeroRuneBand from './heroRuneBand'
import { RUNE_PATHS, RUNE_STROKE_HEAVY, RUNE_VIEWBOX } from './runeMark'

afterEach(cleanup)

describe('HeroRuneBand', () => {
  it('is decorative, so it is hidden from assistive tech', () => {
    const { container } = render(<HeroRuneBand />)
    const band = container.querySelector('.hero-rune-band')
    expect(band).not.toBeNull()
    expect(band?.getAttribute('aria-hidden')).toBe('true')
  })

  it('draws its geometry from runeMark rather than hardcoding it', () => {
    const { container } = render(<HeroRuneBand />)
    const drawn = Array.from(container.querySelectorAll('path')).map(p => p.getAttribute('d'))
    expect(drawn).toEqual(RUNE_PATHS)
  })

  it('uses the heavy stroke, because the mark is a cut and not a line', () => {
    const { container } = render(<HeroRuneBand />)
    const group = container.querySelector('.hero-rune-band__mark g')
    expect(group?.getAttribute('stroke-width')).toBe(String(RUNE_STROKE_HEAVY))
  })

  it('carries the mark\'s own viewBox so the paths are not rescaled by hand', () => {
    const { container } = render(<HeroRuneBand />)
    const svg = container.querySelector('.hero-rune-band__mark')
    expect(svg?.getAttribute('viewBox')).toBe(RUNE_VIEWBOX)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run heroRuneBand`
Expected: FAIL — `Failed to resolve import "./heroRuneBand"`.

- [ ] **Step 3: Write the component**

Create `src/components/sections/heroRuneBand.tsx`:

```tsx
import { RUNE_PATHS, RUNE_ROUGH, RUNE_STROKE_HEAVY, RUNE_VIEWBOX } from './runeMark'


// The hero's mark on phones (< md). Static: no canvas, no effects, no state.
//
// It sits in its own band below the activity feed rather than behind the
// content. Measured on the previous design at 390x844, the hero's content
// spans y 88-663 and a centred background mark spans y 286-569 — there is no
// clear space to sit behind, because the content fills 68% of the viewport.
//
// Why a filled panel with the mark cut out of it, rather than the mark on its
// own: the mark is a line drawing, and a line drawing carries little weight at
// phone size. Inverting it moves the weight into the panel and makes the mark
// negative space, where thinness stops mattering.
//
// The "cut" is the mark painted in the page background colour, applied in CSS.
// On a #000 page that is indistinguishable from a real knockout, and it avoids
// mask-composite, whose Safari support is uneven. Revisit if the light theme
// lands.
//
// The filter id is a document-wide identifier. Only one band renders at a
// time, so a constant is safe here.
const FILTER_ID = 'hero-rune-band-rough'

const HeroRuneBand = () => (
  <div className="hero-rune-band" aria-hidden>
    <svg
      className="hero-rune-band__mark"
      viewBox={RUNE_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
    >
      <defs>
        <filter id={FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={RUNE_ROUGH.baseFrequency}
            numOctaves={RUNE_ROUGH.numOctaves}
            seed={RUNE_ROUGH.seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={RUNE_ROUGH.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g strokeWidth={RUNE_STROKE_HEAVY} filter={`url(#${FILTER_ID})`}>
        {RUNE_PATHS.map(d => <path key={d} d={d} />)}
      </g>
    </svg>
  </div>
)

export default HeroRuneBand
```

- [ ] **Step 4: Add the styles**

In `src/components/sections/hero.scss`, append at the end of the file:

```scss
// Mobile-only mark, in its own band below the activity feed. The panel is a
// plain filled box in CSS and the mark is painted on top in the page
// background colour, which on a #000 page reads as a knockout.
//
// 18% was chosen against 30% and 45% in situ: at 30% the band becomes the
// brightest block on the page, and at 45% it pulls focus off the stat values.
// At 18% it sits just below them in the page's weight order.
//
// The 8px radius matches the activity cards so the band belongs to the same
// system. It does not read as a third activity card despite sitting under two
// of them, because those are outlined and near-black while this is filled.
.hero-rune-band {
    height: 190px;
    margin: 8px 0 24px;
    background: rgba(255, 255, 255, 0.18);
    border-radius: t.$radius-md;
    overflow: hidden;
}

// 140px of the band's 190px, with the remaining 50px split above and below.
// `xMidYMid meet` on the SVG keeps the mark's aspect, so only the height is
// set here.
.hero-rune-band__mark {
    display: block;
    width: 100%;
    height: 140px;
    margin: 25px auto;
}

// Geometry lives in runeMark.ts; the colour lives here, so the knockout
// follows the page background rather than hardcoding #000 in the component.
.hero-rune-band__mark path {
    fill: none;
    stroke: var(--body-background);
    stroke-linecap: round;
}
```

- [ ] **Step 5: Run the test and the full suite**

Run: `pnpm exec vitest run heroRuneBand && pnpm test`
Expected: 4 new tests pass; full suite **357 passing** (346 baseline + 7 from Task 1 + 4 here).

- [ ] **Step 6: Typecheck**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/heroRuneBand.tsx src/components/sections/heroRuneBand.test.tsx src/components/sections/hero.scss
git commit -m "feat(hero): add the mobile rune band

A filled panel with the mark cut out of it, static, sized to sit in its own
band. Nothing renders it yet. The panel carries the visual weight so the
mark's line-drawing nature stops mattering at phone size, and the cut is
painted in the page background colour rather than composited, which avoids
mask-composite's uneven Safari support.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Swap the mobile path — hook, wiring, and deletions

**Files:**
- Create: `src/utils/useBelowMd.ts`
- Test: `src/utils/useBelowMd.test.tsx`
- Modify: `src/components/sections/hero.tsx`
- Modify: `src/components/sections/hero.scss` (comment above `.hero-rune-canvas`, and remove the `--shimmer` modifier)
- Delete: `src/components/sections/heroBackground.tsx`, `src/components/sections/heroBackground.test.tsx`, `src/components/sections/heroRuneShimmer.tsx`

**Interfaces:**
- Consumes: `HeroRuneBand` from `./heroRuneBand` (Task 2); the existing `HeroRuneCanvas` from `./heroRuneCanvas`.
- Produces: `useBelowMd(): boolean` and `BELOW_MD_QUERY: string` from `~/utils/useBelowMd`.

This task is deliberately one unit: deleting `heroBackground.tsx` without rewiring `hero.tsx` in the same commit leaves the build broken.

- [ ] **Step 1: Write the failing test**

Create `src/utils/useBelowMd.test.tsx`:

```tsx
// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { BELOW_MD_QUERY, useBelowMd } from './useBelowMd'

type Listener = () => void

// Replace window.matchMedia with a controllable fake. defineProperty with a
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

// No global setup file, so RTL's auto-cleanup does not run.
afterEach(() => {
  cleanup()
  mm?.restore()
  mm = null
})

const Probe = () => <span data-testid="v">{String(useBelowMd())}</span>
const value = () => screen.getByTestId('v').textContent

describe('useBelowMd', () => {
  it('is true below the md breakpoint', () => {
    mm = installMatchMedia(true)
    render(<Probe />)
    expect(value()).toBe('true')
  })

  it('is false at and above the md breakpoint', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(value()).toBe('false')
  })

  it('queries exactly t.down(md), not a rounded 768px', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(BELOW_MD_QUERY).toBe('(max-width: 767.98px)')
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767.98px)')
  })

  it('re-renders when the viewport crosses the breakpoint', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(value()).toBe('false')
    act(() => mm?.set(true))
    expect(value()).toBe('true')
  })

  it('unsubscribes on unmount', () => {
    mm = installMatchMedia(false)
    const { unmount } = render(<Probe />)
    expect(mm.listenerCount()).toBe(1)
    unmount()
    expect(mm.listenerCount()).toBe(0)
  })

  it('reports desktop when matchMedia is unavailable', () => {
    const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    // @ts-expect-error deliberately removing a DOM global to model old Safari
    delete window.matchMedia
    try {
      render(<Probe />)
      expect(value()).toBe('false')
    } finally {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run useBelowMd`
Expected: FAIL — `Failed to resolve import "./useBelowMd"`.

- [ ] **Step 3: Write the hook**

Create `src/utils/useBelowMd.ts`:

```ts
import { useSyncExternalStore } from 'react'

/**
 * Exactly `t.down(md)` from `_tokens.scss`, which compiles to
 * `max-width: 768px - 0.02px`. A rounded `768px` would leave a 0.02px band
 * where the stylesheet has switched to the mobile layout and this has not.
 */
export const BELOW_MD_QUERY = '(max-width: 767.98px)'

// matchMedia is guarded the way the rest of the codebase guards it, and
// resolved per call rather than cached at module scope — a throw during module
// evaluation is the blank-page-before-React case.
const mediaQuery = () => window.matchMedia?.(BELOW_MD_QUERY) ?? null

// Module scope, so useSyncExternalStore sees a stable subscribe identity and a
// getSnapshot returning a primitive. A subscribe recreated per render causes
// resubscription churn; a snapshot returning a fresh object loops forever.
const subscribe = (onChange: () => void) => {
  const mql = mediaQuery()
  if (mql == null) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => mediaQuery()?.matches ?? false

/**
 * True below the md breakpoint.
 *
 * The hero uses this twice, because its two decorations do not share a DOM
 * position: the desktop WebGL field is an absolutely positioned background at
 * the top of the section, and the mobile mark is a band in normal flow at the
 * end of the container. Rendering one or the other — rather than branching
 * inside a single component — is also what keeps a phone from ever
 * constructing the WebGL2 context.
 */
export function useBelowMd(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
```

- [ ] **Step 4: Run the hook's test**

Run: `pnpm exec vitest run useBelowMd`
Expected: PASS, 7 tests.

- [ ] **Step 5: Rewire `hero.tsx`**

In `src/components/sections/hero.tsx`, replace the import on line 5:

```tsx
import HeroBackground from './heroBackground'
```

with these two:

```tsx
import HeroRuneCanvas from './heroRuneCanvas'
import HeroRuneBand from './heroRuneBand'
```

and add to the existing `~/` imports:

```tsx
import { useBelowMd } from '~/utils/useBelowMd'
```

Inside the `Hero` component, add as the first line of the body, above the `useSWR` call:

```tsx
  const belowMd = useBelowMd()
```

Replace `<HeroBackground />` with:

```tsx
      {!belowMd && <HeroRuneCanvas />}
```

Then add the band as the last child of `<div className="container">`, immediately after the closing `)}` of the `hasError` ternary and before the closing `</div>`:

```tsx
        {belowMd && <HeroRuneBand />}
```

Placing it after the ternary rather than inside it means the band still renders when the stats fail to load — the mark is not data-dependent.

- [ ] **Step 6: Update `hero.scss`**

Replace the comment block above `.hero-rune-canvas` (currently lines 23-30, beginning `// Fixed-grid ASCII display, shared box for both hero backgrounds.`) with:

```scss
// Fixed-grid ASCII display — the desktop hero background, >= md only. The wave
// fills the full viewport (capped at the initial screen height so it doesn't
// keep growing on long pages) and fades into the page top and bottom. Its RAF
// loop is gated by IntersectionObserver + page visibility so off-screen or
// backgrounded instances don't burn cycles.
//
// Below md nothing renders behind the hero's content at all; the mark moves to
// .hero-rune-band at the end of the container instead.
```

Then delete this rule entirely — the shimmer it styled no longer exists:

```scss
// The shimmer draws far fewer and coarser glyphs than the desktop field, so it
// carries a little more presence without competing with the wordmark.
.hero-rune-canvas--shimmer {
    opacity: 0.36;
}
```

- [ ] **Step 7: Delete the superseded files**

```bash
git rm src/components/sections/heroBackground.tsx \
       src/components/sections/heroBackground.test.tsx \
       src/components/sections/heroRuneShimmer.tsx
```

- [ ] **Step 8: Run the full suite and typecheck**

Run: `pnpm test && npx tsc -p tsconfig.json --noEmit`
Expected: **357 passing** (357 after Task 2, +6 from the hook, −6 from the deleted `heroBackground` tests), clean typecheck. If `tsc` reports an unresolved `./heroRuneShimmer` or `./heroBackground`, a reference was missed — find it with `grep -rn "heroRuneShimmer\|heroBackground" src/ e2e/`.

- [ ] **Step 9: Check it in a real browser**

Build and preview, then drive it. Write scratch scripts to `/tmp/claude-1000/-workspaces-stakecore-frontend/fa7af90e-a7ec-47de-8e9d-3a2124aee59e/scratchpad/`, never into the repo; note `@playwright/test` resolves from the repo root, so run node with the repo as the working directory.

```bash
pnpm build && pnpm exec vite preview &
```

Preview serves `https://localhost:4173` with a self-signed cert, so contexts need `ignoreHTTPSErrors: true`. Routes are hash routes; the home route is `https://localhost:4173/#/`.

At **390×844**, confirm and report the actual numbers:
- exactly one `.hero-rune-band`, and zero `canvas.hero-rune-canvas`
- the band's `getBoundingClientRect()` top is greater than or equal to the bottom of `.hero-activity` — they must not overlap
- no console errors other than `ERR_CERT_AUTHORITY_INVALID`

At **1280×900**, confirm: exactly one `canvas.hero-rune-canvas`, zero `.hero-rune-band`, no console errors.

Screenshot both and say in your report whether the mobile band renders as a light panel with a dark mark cut out of it. Kill the preview server when done.

- [ ] **Step 10: Commit**

```bash
git add -A src/components/sections src/utils/useBelowMd.ts src/utils/useBelowMd.test.tsx
git commit -m "feat(hero): replace the mobile background with the rune band

Below md nothing renders behind the hero's content any more. The chooser
becomes a hook because the two decorations no longer share a DOM position —
the desktop field is an absolutely positioned background, the mobile mark is
in normal flow at the end of the container.

Deletes heroRuneShimmer and its whole canvas lifecycle: the rasterize
promise, the destroyed guard, IntersectionObserver, visibilitychange and
ResizeObserver.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Point the desktop canvas at `runeMark`, delete `runeGrid` and the SVG asset

**Files:**
- Modify: `src/components/sections/heroRuneCanvas.tsx`
- Delete: `src/components/sections/runeGrid.ts`, `src/components/sections/runeGrid.test.ts`, `src/assets/images/about/profile.svg`

**Interfaces:**
- Consumes: `RUNE_ASPECT`, `RUNE_STROKE_NATIVE`, `runeSvgMarkup` from `./runeMark` (Task 1).
- Produces: nothing new.

Desktop behaviour must be **identical** after this task: same geometry, same stroke, same filter, same rasterized result. Only the source of the SVG changes.

- [ ] **Step 1: Swap the imports**

In `src/components/sections/heroRuneCanvas.tsx`, replace lines 1-3:

```tsx
import { useEffect, useRef } from 'react'
import profile from '../../assets/images/about/profile.svg'
import { RAMP, SVG_ASPECT } from './runeGrid'
```

with:

```tsx
import { useEffect, useRef } from 'react'
import { RUNE_ASPECT, RUNE_STROKE_NATIVE, runeSvgMarkup } from './runeMark'


// Density ramp for the glyph atlas, faintest to brightest. This file is its
// only consumer. The fragment shader's RAMP_LEN constant must track its length
// by hand — GLSL source cannot import a JS value.
const RAMP = ' .,:;+*x#@'

// The mark, as a data URI, built once at module load. Pure string work, so
// module scope is safe here — nothing touches the DOM.
const RUNE_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(runeSvgMarkup(RUNE_STROKE_NATIVE))
```

- [ ] **Step 2: Replace the two `SVG_ASPECT` uses**

Both are inside `setup()`. Change:

```tsx
      runeW = Math.round(runeH * SVG_ASPECT)
      if (runeW > cols) {
        runeW = cols
        runeH = Math.round(runeW / SVG_ASPECT)
      }
```

to:

```tsx
      runeW = Math.round(runeH * RUNE_ASPECT)
      if (runeW > cols) {
        runeW = cols
        runeH = Math.round(runeW / RUNE_ASPECT)
      }
```

- [ ] **Step 3: Point the rasterizer at the data URI**

In `rasterize()`, change the comment and the final line. Replace:

```tsx
    // Rasterize profile.svg into a runeW × runeH texture. Sampled by
```

with:

```tsx
    // Rasterize the mark into a runeW × runeH texture. Sampled by
```

and replace:

```tsx
      img.src = profile
```

with:

```tsx
      img.src = RUNE_DATA_URI
```

- [ ] **Step 4: Delete the superseded module and asset**

```bash
git rm src/components/sections/runeGrid.ts \
       src/components/sections/runeGrid.test.ts \
       src/assets/images/about/profile.svg
```

Then confirm nothing else referenced them:

```bash
grep -rn "runeGrid\|profile.svg" src/ e2e/ docs/ || echo "no references remain"
```

Matches inside `docs/` are historical spec text describing the old design — leave those. Any match in `src/` or `e2e/` is a real problem.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `pnpm test && npx tsc -p tsconfig.json --noEmit`
Expected: **346 passing** (357 from Task 3, minus the 11 `runeGrid` tests), clean typecheck.

- [ ] **Step 6: Confirm the desktop field is unchanged in a real browser**

This is the check that matters for this task, and it cannot be done in the test suite: **headless Chromium in this devcontainer exposes no WebGL under any swiftshader flag**, so `getContext('webgl2')` returns null and the component only ever reaches its `WebGL2 unavailable` warn path there.

Build, preview, and open `https://localhost:4173/#/` at 1280×900 in a browser that has WebGL. Confirm the hero's ASCII wave renders as before, with the rune silhouette visible as the brighter region. Report explicitly whether you were able to verify this or not — if the environment cannot run WebGL, say so rather than implying the check passed.

- [ ] **Step 7: Commit**

```bash
git add -A src/components/sections src/assets
git commit -m "refactor(hero): build the rune texture from runeMark

The canvas rasterized profile.svg while the band draws inline paths — two
definitions of one mark, which is the drift the last review flagged about
RAMP. Both now come from runeMark, and the asset has no consumers left.

runeGrid goes with it: runeBox, glyphIndex and glyphAt were only ever used
by the deleted shimmer. RAMP moves back into its one remaining consumer.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Update the e2e specs and the documentation

**Files:**
- Modify: `e2e/mobile.spec.ts`
- Modify: `e2e/routes.spec.ts:10-21`
- Modify: `CLAUDE.md` (the `### Hero background` subsection)

**Interfaces:**
- Consumes: the live behaviour from Tasks 2-4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite the mobile spec**

Replace the whole of `e2e/mobile.spec.ts` with:

```ts
import { devices } from '@playwright/test'
import { test, expect } from './fixtures/console'

// The hero's decoration is the only breakpoint-switched thing in the app, and
// the desktop-only project would never exercise its mobile path. Scoped to one
// route at one viewport deliberately: a full mobile project roughly doubles
// e2e runtime against the live backend for very little extra signal.
test.use({ ...devices['Pixel 5'] })

test('the hero renders the rune band and no WebGL canvas', async ({ page, consoleErrors }) => {
  await page.goto('/#/')

  await expect(page.getByRole('heading', { level: 1, name: 'StakeCore' })).toBeVisible()

  // HeroRuneCanvas is the only caller of getContext('webgl2') on this route, so
  // its absence from the DOM is the guarantee that no context was created.
  await expect(page.locator('.hero-rune-band')).toHaveCount(1)
  await expect(page.locator('canvas.hero-rune-canvas')).toHaveCount(0)

  // The band must clear the activity feed. The previous design centred a mark
  // in a full-viewport canvas and it landed entirely inside the content, which
  // no assertion caught because none compared their boxes. This one does.
  const band = await page.locator('.hero-rune-band').boundingBox()
  const activity = await page.locator('.hero-activity').boundingBox()
  if (band == null || activity == null) {
    throw new Error('hero band or activity feed has no layout box')
  }
  expect(band.y).toBeGreaterThanOrEqual(activity.y + activity.height)

  // Point-in-time assertions, so let SWR settle first — same reasoning as
  // routes.spec.ts. Nothing on this page holds a connection open.
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.error-container')).toHaveCount(0)
  await expect(page.locator('.route-error')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})
```

The `boundingBox()` calls return `null` for an element with no layout, so they are narrowed with a real guard and a thrown error rather than a non-null assertion — the same rule that applies in `src/`. A thrown error fails the test with a clearer message than a null-deref would.

- [ ] **Step 2: Update the desktop assertion in `routes.spec.ts`**

Replace lines 10-21 (the comment block and the `if (path === '/')` block) with:

```ts
    // Desktop side of the hero's breakpoint swap. e2e/mobile.spec.ts proves the
    // band renders below md; this proves the WebGL canvas renders above it and
    // the band does not. useBelowMd.test.tsx already asserts both arms of the
    // hook, but against a fake matchMedia — this is the same claim against a
    // real viewport and the real components. Scoped to '/' since it's the only
    // route with any hero decoration.
    if (path === '/') {
      await expect(page.locator('canvas.hero-rune-canvas')).toHaveCount(1)
      await expect(page.locator('.hero-rune-band')).toHaveCount(0)
    }
```

- [ ] **Step 3: Run the e2e suite**

Kill anything already listening on 4173 first, so Playwright serves a fresh build:

```bash
pkill -f "vite preview" 2>/dev/null; pnpm test:e2e
```

Expected: all specs pass, 20 tests. These hit the live backend — if a failure looks environmental rather than caused by your change, say so explicitly in your report and give your evidence. Do not add retries or waits to force a green run. If the home route's a11y scan newly fails, investigate rather than suppress: the band is `aria-hidden` and adds no accessible surface, so a failure there means something else regressed.

- [ ] **Step 4: Update `CLAUDE.md`**

Replace the entire `### Hero background (\`src/components/sections/\`)` subsection with:

```markdown
### Hero background (`src/components/sections/`)

The hero decorates itself differently on each side of the md breakpoint, and
the two decorations do not share a DOM position — which is why the choice lives
in a hook (`~/utils/useBelowMd`) rather than in a wrapper component. At ≥768px
`heroRuneCanvas.tsx` renders a WebGL2 ASCII wave as an absolutely positioned
background at the top of the section. Below 768px **nothing renders behind the
hero's content at all**; `heroRuneBand.tsx` puts the mark in a band of its own,
in normal flow at the end of the container.

That split is not a stylistic preference. A centred background mark spans
y 286–569 at 390×844 while the hero's content spans y 88–663 — the content
fills 68% of the viewport, so there is nothing to sit behind. The earlier
attempt to put a canvas there shipped and had to be replaced. `e2e/mobile.spec.ts`
now compares the band's bounding box against the activity feed's, which is the
assertion that would have caught it.

`heroRuneCanvas.tsx` is **desktop-only**: its `cellSize` is a hardcoded `10` and
it does no breakpoint check of its own, both correct only because the hook is
the sole thing deciding whether it mounts. Rendering it unconditionally would
reintroduce the cost it exists to avoid — at 390×844 it animates 9,165 cells at
~37M fragments/second and pays for a context, two shader compiles and a program
link at mount.

Its cleanup releases the context with `WEBGL_lose_context`, but only
`if (!canvas.isConnected)`. That guard is load-bearing: a canvas returns the
**same** context object from every `getContext` call and a lost context stays
lost until `restoreContext`, so losing it while the element will be reused kills
the next mount — every shader fails to compile and `getShaderInfoLog` returns
`null` rather than a GLSL message, which is the tell. StrictMode runs the
cleanup with the node still in the document; a genuine unmount runs it after
React has detached it.

Both renderers read the mark's geometry from `runeMark.ts` — the paths, viewBox,
aspect and stroke weights. The canvas rasterizes `runeSvgMarkup()` from a data
URI; the band draws `RUNE_PATHS` as JSX. Keep it that way: an SVG asset plus a
set of inline paths is two definitions of one mark that drift without a compile
error. The one thing that cannot import from it is the fragment shader's
`RAMP_LEN` GLSL constant, which is commented at its declaration to track
`RAMP.length` by hand.

The breakpoint literal in `useBelowMd.ts`, `(max-width: 767.98px)`, has to stay
in lockstep with `t.down(md)` in `_tokens.scss`; nothing enforces that at compile
time and the test only pins the literal string.

None of the WebGL path is reachable by the test suite: headless Chromium in this
devcontainer exposes no WebGL at all (`getContext('webgl2')` returns null under
every swiftshader flag), so the e2e specs only ever exercise the
`WebGL2 unavailable` warn path. Changes to that component need a real browser.
```

- [ ] **Step 5: Commit**

```bash
git add e2e/mobile.spec.ts e2e/routes.spec.ts CLAUDE.md
git commit -m "test(e2e): assert the band clears the activity feed

The mobile spec now checks the two bounding boxes do not overlap, which is
the assertion whose absence let the previous design ship with the mark
sitting behind the content. Desktop keeps the mirror-image assertion.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `pnpm test` — 346 passing
- [ ] `npx tsc -p tsconfig.json --noEmit` — clean
- [ ] `pnpm test:e2e` — 20 passing
- [ ] At 390×844: one `.hero-rune-band`, zero `canvas.hero-rune-canvas`, band's box clears the activity feed's, no console errors
- [ ] At 1280×900: one `canvas.hero-rune-canvas`, zero `.hero-rune-band`, no console errors, wave visually unchanged from `main`
- [ ] `grep -rn "runeGrid\|heroRuneShimmer\|heroBackground\|profile.svg" src/ e2e/` returns nothing
