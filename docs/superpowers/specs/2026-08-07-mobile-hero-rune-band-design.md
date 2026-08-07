# The mark in a band of its own, below the md breakpoint

Date: 2026-08-07

Supersedes the mobile half of
[2026-08-07-mobile-hero-background-design.md](2026-08-07-mobile-hero-background-design.md).
The desktop half of that spec still stands.

## Goal

Stop rendering anything behind the mobile hero's content. Move the StakeCore
mark into a band of its own below the activity feed, rendered as a filled panel
with the mark knocked out of it. Static, no canvas, no animation. Desktop
(≥768px) is untouched.

## Why the shipped design failed

The previous spec put a canvas-2D ASCII shimmer behind the whole mobile hero.
Two complaints, both correct:

**It read as noise behind the text.** Measured on the shipped build at 390×844:
the hero's content spans y 88–663 and the mark's ink spans y 286–569. The mark
was entirely inside the content band, because centring a mark in a 100vh canvas
puts it exactly where a mobile hero's content is densest. There is no clear
space to centre into — the content occupies 68% of the viewport height.

**The motion was distracting.** 5fps behind text on a small screen.

A survey of nine comparable sites (Kiln, Figment, Chorus One, P2P.org,
Everstake, Blockdaemon, Luganodes, Rocket Pool, StakeWise) found **none of them
animate anything behind hero text**. Where a pattern sits behind text at all it
is a continuous low-contrast lattice on a gradient (Figment, Blockdaemon);
otherwise the graphic gets its own band — above the headline (P2P) or below the
CTAs (Luganodes, Rocket Pool). Placing decoration under content and hoping it
doesn't collide is not a pattern the field uses.

## The mark is not thin

Worth recording, because it inverted the design brief. `profile.svg` is three
strokes at `stroke-width: 38` in a 340-wide viewBox — 11% of the mark's width,
which at a 280px mark is a 31px stroke. Rendered natively it is a bold, solid
shape.

What made every previous attempt look thin was the ASCII density ramp. A 31px
stroke at 10px cells is ~3 cells, and the ramp then spends the outer ones on
`.` and `,`. Rendering the identical geometry at the identical cell size with
one heavy character per covered cell produces a legible mark with no other
change. Pushing the stroke past native (38 → 72) as a positive shape *overshoots*
— the curves merge. The weight was never the problem; the renderer was
discarding it.

The chosen design uses stroke 72 anyway, but as a **cut** rather than a stroke,
where heavier means a wider aperture rather than a fatter line.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Placement | Its own band, below the activity feed, in normal flow | The content leaves no clear space to sit behind. Matches how comparable sites place their graphic. |
| Motion | None | Half the complaint. Also makes `prefers-reduced-motion` a non-question. |
| Treatment | Filled panel, mark knocked out | The panel carries the weight, so the mark's line-drawing nature stops mattering at small size. |
| Panel opacity | 18% white | Reviewed at 18 / 30 / 45 in situ. At 30 the band becomes the brightest block on the page; at 45 it pulls focus off the stats. 18 sits below the stat values in the page's weight order. |
| Knockout technique | Mark painted in the page background colour | The page background is `#000`, so this is visually identical to a true knockout and avoids `mask-composite`, whose Safari support is uneven. Revisit if the light theme lands. |
| Geometry source | One shared module | Two renderers of the same mark otherwise means two definitions that can drift — the exact defect the last review raised about `RAMP`. |

## Architecture

### `runeMark.ts` — new, the mark's single definition

```ts
export const RUNE_VIEWBOX = '170 180 340 380'
export const RUNE_ASPECT = 340 / 380
export const RUNE_STROKE_NATIVE = 38
export const RUNE_STROKE_HEAVY = 72
export const RUNE_PATHS = [
  'M 200 208 L 410 208',
  'M 200 208 C 340 295, 340 445, 200 530',
  'M 480 208 C 340 295, 340 445, 480 530',
]
export function runeSvgMarkup(strokeWidth: number): string
```

`runeSvgMarkup` returns a complete SVG document string — used by
`heroRuneCanvas.tsx` to build the data URI it rasterizes. `heroRuneBand.tsx`
renders `RUNE_PATHS` as JSX directly. Both read the same paths, so there is one
definition.

The `feTurbulence` / `feDisplacementMap` rough-edge filter lives here too, since
both renderers need it. It is load-bearing: without it the curves go slick and
the mark loses its hand-cut quality.

### `heroRuneBand.tsx` — new, the mobile band

An inline `<svg>`, `aria-hidden`, no props, no effects, no state. Structure: a
rounded rect filled `rgba(255,255,255,0.18)`, then the three paths stroked in
`var(--body-background)` at `RUNE_STROKE_HEAVY` on top of it.

| Property | Value |
| --- | --- |
| Band height | 190px |
| Panel | `width: 100%` of the hero container's content box, `border-radius: $radius-md` (8px) |
| Panel fill | `rgba(255, 255, 255, 0.18)` |
| Mark height | 140px of the 190px band, centred |
| Mark stroke | `RUNE_STROKE_HEAVY` (72), rough filter applied |
| Margins | `8px` above, `24px` below |

The 8px radius matches the activity cards, so the band reads as part of the same
system. It does not read as a third activity card despite sitting under two of
them, because the cards are outlined and near-black while this is filled —
checked in situ before committing to it.

### `useBelowMd.ts` — new hook, replaces `heroBackground.tsx`

`heroBackground.tsx` existed to choose between two components rendering in the
same DOM position. They no longer do: the desktop canvas is an absolutely
positioned background at the top of the section, the mobile band is in normal
flow at the end. So the chooser becomes a hook and `hero.tsx` branches twice:

```tsx
{!belowMd && <HeroRuneCanvas />}
…
{belowMd && <HeroRuneBand />}
```

The hook keeps everything `heroBackground.tsx` got right: `useSyncExternalStore`
over `window.matchMedia?.('(max-width: 767.98px)')`, module-scope `subscribe` and
`getSnapshot` (stable identity, primitive snapshot), and a desktop fallback when
`matchMedia` is absent. The breakpoint literal is exactly `t.down(md)`; a rounded
`768px` leaves a 0.02px band where the stylesheet and the JS disagree.

### `heroRuneCanvas.tsx` — one mechanical change

Its rasterization source becomes `runeSvgMarkup(RUNE_STROKE_NATIVE)` as a data
URI instead of the imported `profile.svg`. Behaviour is unchanged — same
geometry, same stroke, same filter. `RAMP` stays in this file, which is now its
only consumer.

### Deletions

- `heroRuneShimmer.tsx` — the whole canvas lifecycle goes with it: the rasterize
  promise, the `destroyed` guard, IntersectionObserver, `visibilitychange`,
  ResizeObserver, DPR capping.
- `heroBackground.tsx` and `heroBackground.test.tsx` — replaced by the hook and
  its test.
- `runeGrid.ts` and `runeGrid.test.ts` — `runeBox`, `glyphIndex` and `glyphAt`
  have no consumers once the shimmer goes. `SVG_ASPECT` moves to `runeMark.ts`
  renamed `RUNE_ASPECT` (still used by `heroRuneCanvas.tsx` to size its rune
  texture); `RAMP` moves back into `heroRuneCanvas.tsx`.
- `src/assets/images/about/profile.svg` — no consumers once the canvas builds its
  own source. It is referenced nowhere else in the app.

This removes roughly two of the five tasks from the previous plan. That is the
intended outcome rather than a regret: the shimmer solved a problem we no longer
have.

## Testing

- **`useBelowMd.test.tsx`** — ports the existing `heroBackground` coverage: the
  exact query string, `true`/`false` snapshots, re-render on a `change` event,
  unsubscribe on unmount, and the missing-`matchMedia` fallback. Uses
  `Object.defineProperty` with a saved descriptor, not `vi.spyOn` — the storage
  suites document spies silently ceasing to apply once another test has touched
  the same global.
- **`heroRuneBand.test.tsx`** — renders, is `aria-hidden`, and draws its paths
  from `RUNE_PATHS` rather than hardcoded strings. That last assertion is the one
  that matters: it is what keeps the two renderers from drifting.
- **`runeMark.test.ts`** — `runeSvgMarkup(n)` contains all three paths and the
  stroke width it was given.
- **`e2e/mobile.spec.ts`** — updated: at a Pixel 5 viewport the home route
  renders `.hero-rune-band` and **no** `canvas.hero-rune-canvas`.
- **`e2e/routes.spec.ts`** — the existing desktop assertion is updated to the
  mirror image: `canvas.hero-rune-canvas` present, `.hero-rune-band` absent.
- **No test of the desktop canvas's painting.** Headless Chromium in this
  devcontainer exposes no WebGL under any swiftshader flag, so `getContext('webgl2')`
  returns null and the e2e specs only ever reach that component's
  `WebGL2 unavailable` warn path. Changes to it need a real browser.

## Out of scope

- Any change to the ≥768px WebGL field beyond swapping its rasterization source.
- Restructuring the mobile hero. The competitor survey found StakeCore is the
  outlier in leading with a 32px wordmark rather than a headline, in having no
  CTA in the hero, and in floating its stats rather than carding them. That is a
  larger piece of work and a separate decision.
- The light theme. The knockout is painted in the background colour, which is
  correct only while that colour is `#000`.

## Success criteria

1. Nothing renders behind the mobile hero's content — no canvas, no absolutely
   positioned decoration, below 768px.
2. No WebGL context is created below 768px, verified by the mobile e2e spec
   asserting the canvas element is absent.
3. Desktop at ≥768px is visually identical to before.
4. The mark reads clearly at 390px width, in its own band, with nothing
   overlapping it. Verified by a screenshot of the real build at 390×844 — the
   band's bounding box must not intersect the activity feed's, and this is the
   check the previous design skipped.
5. `pnpm test`, `npx tsc -p tsconfig.json --noEmit` and `pnpm test:e2e` all pass.
