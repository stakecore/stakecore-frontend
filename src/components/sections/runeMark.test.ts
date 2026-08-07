// This module is pure string and number data with no DOM access, so it runs in
// Vitest's default node environment. No environment directive is needed.

import { describe, it, expect } from 'vitest'
import {
  RUNE_ASPECT,
  RUNE_FILTER_REGION_HEAVY,
  RUNE_FILTER_REGION_NATIVE,
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

  // The native region must stay pinned to the source asset's exact values
  // (see the dedicated test below), while the heavy region is sized for a
  // much wider stroke. Deriving one from the other — or unifying them —
  // would either clip the band's mark or change the desktop rasterization,
  // so the two are independent literals and this test guards against a
  // future "simplification" that merges them.
  it('keeps the two filter regions distinct, because unifying them would clip one renderer or the other', () => {
    expect(RUNE_FILTER_REGION_HEAVY).not.toEqual(RUNE_FILTER_REGION_NATIVE)
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

  it('matches the source asset\'s filter region, so the canvas swap stays a no-op', () => {
    expect(runeSvgMarkup(RUNE_STROKE_NATIVE)).toContain('x="-5%" y="-5%" width="110%" height="110%"')
  })

  it('produces markup that closes every tag it opens', () => {
    const svg = runeSvgMarkup(RUNE_STROKE_NATIVE)
    expect(svg.startsWith('<svg ')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    // One <path .../> per stroke, plus the two filter primitives, all self-closed.
    expect((svg.match(/<path /g) ?? []).length).toBe(RUNE_PATHS.length)
    for (const tag of ['defs', 'filter', 'g', 'svg']) {
      expect((svg.match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length)
        .toBe((svg.match(new RegExp(`</${tag}>`, 'g')) ?? []).length)
    }
  })
})
