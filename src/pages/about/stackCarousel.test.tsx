// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import StackCarousel, { STACK_GROUPS } from './stackCarousel'
import { STACK_LOGOS } from './stackLogos'

// happy-dom has neither observer, and the marquee hook constructs both.
class ObserverStub {
  constructor(public cb: (entries: unknown[]) => void) {}
  observe() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', ObserverStub)
vi.stubGlobal('ResizeObserver', ObserverStub)

afterEach(cleanup)

const rosterItems = STACK_GROUPS.flatMap(g => g.items)

describe('StackCarousel roster', () => {
  it('names every item exactly once per track half', () => {
    const { container } = render(<StackCarousel />)
    const names = [...container.querySelectorAll('.stack-item-name')]
      .map(n => n.textContent)
    expect(names).toHaveLength(rosterItems.length * 2)
    expect(names.slice(0, rosterItems.length)).toEqual(rosterItems.map(i => i.name))
  })

  it('labels every group', () => {
    const { container } = render(<StackCarousel />)
    const labels = [...container.querySelectorAll('.stack-group-label')]
      .map(n => n.textContent)
    expect(labels.slice(0, STACK_GROUPS.length)).toEqual(STACK_GROUPS.map(g => g.label))
  })

  // Every slug in the roster must resolve, or the item silently renders as a
  // nameless empty box. A typo'd slug is the likeliest way to break this file.
  it('resolves every declared slug to a generated glyph', () => {
    for (const item of rosterItems) {
      if (item.slug) expect(STACK_LOGOS[item.slug], item.name).toBeDefined()
    }
  })
})

describe('StackCarousel glyphs', () => {
  it('draws the generated path for an item with a mark', () => {
    const logo = STACK_LOGOS.nomad
    expect(logo).toBeDefined()
    const { container } = render(<StackCarousel />)
    const nomad = container.querySelector('[data-slug="nomad"] path')
    expect(nomad?.getAttribute('d')).toBe(logo?.path)
  })

  it('tints from the brand hex rather than a hardcoded colour', () => {
    const logo = STACK_LOGOS.nomad
    expect(logo).toBeDefined()
    const { container } = render(<StackCarousel />)
    const nomad = container.querySelector<HTMLElement>('[data-slug="nomad"]')
    expect(nomad?.style.getPropertyValue('--stack-brand')).toBe(logo?.hex)
  })

  // HAProxy and Loki publish no mark that reads at glyph size, so they are
  // set as type. Rendering an empty <svg> for them would leave a hole in the
  // row; the wordmark class is what the stylesheet keys the type treatment on.
  it('sets wordmark brands as type instead of an empty glyph', () => {
    const { container } = render(<StackCarousel />)
    const haproxy = [...container.querySelectorAll('.stack-item')]
      .find(el => el.textContent?.includes('HAProxy'))
    expect(haproxy?.classList.contains('stack-item--wordmark')).toBe(true)
    expect(haproxy?.querySelector('svg')).toBeNull()
  })
})

describe('StackCarousel accessibility', () => {
  it('gives the scroller an accessible name', () => {
    const { container } = render(<StackCarousel />)
    expect(container.querySelector('.stack-carousel')?.getAttribute('aria-label'))
      .toBeTruthy()
  })

  // The track is duplicated so the marquee can wrap seamlessly. Announcing
  // the second copy would read the whole stack twice to a screen reader.
  it('hides the duplicated half from assistive tech', () => {
    const { container } = render(<StackCarousel />)
    const [first, second] = container.querySelectorAll('.stack-carousel-half')
    expect(container.querySelectorAll('.stack-carousel-half')).toHaveLength(2)
    expect(first?.hasAttribute('aria-hidden')).toBe(false)
    expect(second?.getAttribute('aria-hidden')).toBe('true')
  })

  // Decorative duplicate glyphs would otherwise be announced as images.
  it('marks each glyph as presentational', () => {
    const { container } = render(<StackCarousel />)
    const svgs = [...container.querySelectorAll('.stack-item svg')]
    expect(svgs.length).toBeGreaterThan(0)
    expect(svgs.every(s => s.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})
