# A lighter hero background below the md breakpoint

Date: 2026-08-07

## Goal

Replace the full-viewport WebGL ASCII wave on phones with a rune-local ASCII
shimmer: the animated-glyph character survives, the dense field behind the
wordmark does not. Desktop (≥768px) is untouched.

## Why the current design fails on phones

`heroRuneCanvas.tsx` renders a full-viewport fragment shader. Its mobile branch
sets `cellSize = 6` against desktop's `10`, so the *smallest* screen gets the
*densest* grid — more rune-silhouette samples, but also the busiest field.

Two problems, both real:

**Visually busy.** At 390×844 the grid is 9,165 cells of animated ASCII sitting
directly behind the wordmark, tagline and stat values. The rune it is supposed
to be painting is ~49% of the screen width and is lost inside the wave: the
inside/outside distinction is a tint step from `#6B6B6B` to white at 0.3 canvas
opacity, which at 6px cells does not resolve into a recognisable mark.

**Expensive.** The shader runs per *fragment*, not per cell. At 390×844 on a
3× device that is 1170×2532 = 2.96M fragments per frame, and the RAF loop is
gated at 80ms, so ~37M fragments/second — sustained, for a decorative
background. On top of that, every phone pays for WebGL2 context creation, two
shader compiles, a program link, and a glyph-atlas rasterization at mount.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope | Mobile-only variant | Desktop has the room for the field and it reads correctly there. |
| Switch mechanism | Mount by breakpoint, not branch inside one component | A phone must never construct the WebGL context. Per-frame tuning cannot remove that cost. |
| Breakpoint | `(max-width: 767.98px)` | Exactly `t.down(md)`. `768px` would leave a 0.02px band where CSS and JS disagree. |
| Motion | ~5fps, RAF with a time gate | Keeps the existing IntersectionObserver + `visibilitychange` suspension, which `setInterval` would lose. |
| Reduced motion | One static paint | Not a separate design — it is this design with the loop never started. |

## Architecture

Four pieces, three new.

### `heroRuneCanvas.tsx` — unchanged, now the ≥768px path only

No behavioural change. One simplification falls out: `cellSize` becomes a
constant `10`, and `setup()` no longer re-checks `window.innerWidth < 768` on
resize. That check existed to catch a breakpoint crossing mid-session; the
chooser now handles that by unmounting the component.

### `heroRuneShimmer.tsx` — new, the <768px path

Canvas 2D. Same box as today: absolutely positioned, `100vh`, `aria-hidden`,
behind the vertical gradient mask that dissolves it into the page.

Per resize: rasterize `profile.svg` into an `rw × rh` alpha mask, exactly as the
WebGL path does before uploading it as a texture.

Per frame: for each cell in the rune box with mask alpha > 0.06, pick a ramp
glyph from `alpha * (0.58 + 0.42 * sin(dist * 0.5 - phase))` and `fillText` it.
Cells outside the mask are never touched. `clearRect` is scoped to the rune box;
a resize that moves the box clears the whole canvas first.

There is no inside/outside tint split any more — every glyph drawn *is* the mark.

Lifecycle mirrors the existing component, minus the GL teardown: a `destroyed`
flag guarding the async rasterize against use-after-cleanup (the strict-mode
double-mount hazard is unchanged), an IntersectionObserver and a
`visibilitychange` listener gating the loop, and a ResizeObserver on the canvas
rather than a window `resize` listener so iOS Safari's URL-bar collapse is
caught.

### `heroBackground.tsx` — new, the chooser

Subscribes to `window.matchMedia?.('(max-width: 767.98px)')` via
`useSyncExternalStore` and renders `HeroRuneShimmer` or `HeroRuneCanvas`.
`hero.tsx` renders this instead of `HeroRuneCanvas` directly.

### `runeGrid.ts` — new, pure

`runeBox(cols, rows, frac)` and `glyphIndex(alpha, dist, phase)`. No DOM, so it
is unit-testable in the repo's normal style. SVG→mask rasterization stays in the
components, since it genuinely needs a canvas.

## Parameters

| | Today (mobile) | Proposed |
| --- | --- | --- |
| Cell size | 6 CSS px | 10 CSS px |
| Rune size | 55% of the shorter grid axis (≈49% of width) | width-driven: `rw = round(cols × 0.72)`, `rh = round(rw / 0.894)`, clamped to `rows` |
| Frame gate | 80ms (12.5fps) | 200ms (5fps) |
| Canvas opacity | 0.3 | 0.36 |
| DPR | raw `devicePixelRatio` | capped at 2 |

Rune sizing changes because today's formula takes a fraction of the *shorter*
grid axis, which on a phone is always the width. With the field gone the mark is
the only thing on the canvas and earns the space. It stays centred — no vertical
bias.

The DPR cap is memory, not sharpness: a 100vh × 100vw backing store at 3× is
~12 MB, at 2× ~5.3 MB, and the difference is invisible at 0.36 opacity behind a
gradient mask.

Measured glyph counts, rasterizing the real `profile.svg` at the proposed box
size:

| Viewport | Today: cells in grid | Proposed: cells in box | Proposed: cells with a glyph |
| --- | --- | --- | --- |
| 360×800 | 8,040 | 754 | 304 |
| 390×844 | 9,165 | 868 | 339 |
| 430×932 | 11,232 | 1,085 | 407 |

At 390×844 that is 339 `fillText` calls at 5fps — ~1,700 glyph draws/second,
against ~37M fragments/second today, and no WebGL context at all.

## Testing

- **`runeGrid.test.ts`** — the pure math. `runeBox` clamping when the mark would
  exceed the available rows; `glyphIndex` staying inside the ramp at extreme
  alpha and phase values. That last one is the off-by-one that returns
  `undefined` under `noUncheckedIndexedAccess` and silently paints nothing.
- **`heroBackground.test.tsx`** — mocked `matchMedia`: the shimmer renders below
  the breakpoint, the WebGL canvas above it, and the two swap when the query
  flips. Needs its own `afterEach(cleanup)`; there is no global setup file.
- **One mobile-viewport e2e spec** on `/` — Pixel 5 viewport, asserting the
  shimmer canvas mounts, the WebGL canvas does not, and no console errors. One
  added test, not a second Playwright project.
- **No test of the painting itself.** happy-dom has no 2D context, so a test
  could only assert that methods were called on a stub. `heroRuneCanvas` is
  untested today for the same reason.

## Out of scope

- Any change to the ≥768px WebGL field beyond dropping the now-dead mobile
  branch of its `cellSize`.
- Running the full e2e suite at a mobile viewport. That is real coverage, but it
  roughly doubles e2e runtime against a live backend.
- The desktop rune sizing formula. It is only being changed for the new mobile
  component.

## Success criteria

1. No WebGL context is created below 768px. The mobile e2e spec asserts which
   canvas element mounts; since `HeroRuneCanvas` is the only caller of
   `getContext('webgl2')` on this route, its absence from the DOM is the
   guarantee.
2. The StakeCore mark is recognisable on a phone, which it is not today.
3. `prefers-reduced-motion: reduce` yields a single static paint, no RAF loop.
4. Crossing the breakpoint mid-session swaps cleanly, releasing the WebGL context.
5. `pnpm test`, `pnpm lint`, `npx tsc -p tsconfig.json --noEmit`, and `pnpm test:e2e`
   all pass.
