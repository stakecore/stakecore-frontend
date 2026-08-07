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
