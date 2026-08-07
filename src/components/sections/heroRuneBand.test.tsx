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
