// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { RAMP, runeBox, glyphIndex, glyphAt } from './runeGrid'

describe('runeBox', () => {
  it('sizes off the width and centres the box', () => {
    // A 390x844 viewport at 10px cells is a 39x85 grid.
    expect(runeBox(39, 85, 0.72)).toEqual({ rw: 28, rh: 31, x0: 6, y0: 27 })
  })

  it('clamps to the available rows when the mark would overflow', () => {
    // A landscape phone: plenty of columns, almost no rows.
    const box = runeBox(200, 12, 0.72)
    expect(box.rh).toBe(12)
    expect(box.rw).toBe(11)
    expect(box.y0).toBe(0)
  })

  it('floors rw/rh at 1 for a degenerate zero-sized grid', () => {
    // A canvas that measures 0 in either dimension (e.g. mid-layout-thrash)
    // must still produce a box a caller can rasterize into — 0x0 would make
    // getImageData(0, 0, 0, 0) throw IndexSizeError from inside img.onload.
    const box = runeBox(0, 0, 0.72)
    expect(box.rw).toBeGreaterThan(0)
    expect(box.rh).toBeGreaterThan(0)
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
