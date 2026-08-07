// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import HeroRuneBand from './heroRuneBand'
import { RUNE_FILTER_REGION_HEAVY, RUNE_PATHS, RUNE_ROUGH, RUNE_STROKE_HEAVY, RUNE_VIEWBOX_BAND } from './runeMark'

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

  it('uses the widened band viewBox, not the native one, so the heavy stroke is not clipped', () => {
    const { container } = render(<HeroRuneBand />)
    const svg = container.querySelector('.hero-rune-band__mark')
    expect(svg?.getAttribute('viewBox')).toBe(RUNE_VIEWBOX_BAND)
  })

  it('shares RUNE_ROUGH\'s displacement parameters with the native renderer', () => {
    const { container } = render(<HeroRuneBand />)
    const turbulence = container.querySelector('feTurbulence')
    const displacement = container.querySelector('feDisplacementMap')
    expect(turbulence?.getAttribute('baseFrequency')).toBe(String(RUNE_ROUGH.baseFrequency))
    expect(turbulence?.getAttribute('numOctaves')).toBe(String(RUNE_ROUGH.numOctaves))
    expect(turbulence?.getAttribute('seed')).toBe(String(RUNE_ROUGH.seed))
    expect(displacement?.getAttribute('scale')).toBe(String(RUNE_ROUGH.scale))
  })

  // This is the regression test for the clipped-into-a-rectangle finding: the
  // band used to reuse the native region (sized for stroke 38) with a stroke
  // of 72, slicing every terminal flat. It must use its own, wider region.
  it('uses the heavy filter region sized for its heavier stroke, not the native one', () => {
    const { container } = render(<HeroRuneBand />)
    const filter = container.querySelector('filter')
    expect(filter?.getAttribute('x')).toBe(RUNE_FILTER_REGION_HEAVY.x)
    expect(filter?.getAttribute('y')).toBe(RUNE_FILTER_REGION_HEAVY.y)
    expect(filter?.getAttribute('width')).toBe(RUNE_FILTER_REGION_HEAVY.width)
    expect(filter?.getAttribute('height')).toBe(RUNE_FILTER_REGION_HEAVY.height)
  })
})
