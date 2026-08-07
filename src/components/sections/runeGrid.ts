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
  // Floor both at 1: a degenerate (0-sized) grid would otherwise produce a
  // 0x0 box, and a caller that rasterizes into it (heroRuneShimmer.tsx) would
  // call getImageData(0, 0, 0, 0), which throws IndexSizeError from inside an
  // img.onload — an uncaught exception with no try/catch above it.
  rw = Math.max(1, rw)
  rh = Math.max(1, rh)
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
