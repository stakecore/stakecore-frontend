// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import StackCarousel, { STACK_GROUPS, STACK_ROWS } from './stackCarousel'
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
    const halves = [...container.querySelectorAll('.stack-carousel-half')]
    // Two rows, each duplicated: halves are [row0, row0clone, row1, row1clone].
    expect(halves).toHaveLength(STACK_ROWS.length * 2)

    for (const [i, half] of halves.entries()) {
      const expected = STACK_ROWS[Math.floor(i / 2)]
        ?.flatMap(g => g.items.map(item => item.name)) ?? []
      const names = [...half.querySelectorAll('.stack-item-name')].map(n => n.textContent)
      expect(names).toEqual(expected)
    }
  })

  it('renders the whole roster across the two rows', () => {
    const { container } = render(<StackCarousel />)
    const names = [...container.querySelectorAll('.stack-item-name')]
      .map(n => n.textContent)
    expect(names).toHaveLength(rosterItems.length * 2)
    expect(new Set(names)).toEqual(new Set(rosterItems.map(i => i.name)))
  })

  it('labels every group once per half', () => {
    const { container } = render(<StackCarousel />)
    const labels = [...container.querySelectorAll('.stack-group-label')]
      .map(n => n.textContent)
    for (const group of STACK_GROUPS) {
      expect(labels.filter(l => l === group.label)).toHaveLength(2)
    }
  })

  // Every slug in the roster must resolve, or the item silently renders as a
  // nameless empty box. A typo'd slug is the likeliest way to break this file.
  it('resolves every declared slug to a generated glyph', () => {
    for (const item of rosterItems) {
      if (item.slug) expect(STACK_LOGOS[item.slug], item.name).toBeDefined()
    }
  })
})

describe('StackCarousel rows', () => {
  it('splits the groups across two scrollers', () => {
    const { container } = render(<StackCarousel />)
    expect(container.querySelectorAll('.stack-carousel')).toHaveLength(2)
  })

  it('puts each group in the row its roster assigns it to', () => {
    const { container } = render(<StackCarousel />)
    const rows = [...container.querySelectorAll('.stack-carousel')]
    rows.forEach((row, i) => {
      const labels = [...row.querySelectorAll('.stack-group-label')]
        .map(n => n.textContent)
      // Each row renders its groups twice, so compare the leading pass.
      const expected = STACK_ROWS[i]?.map(g => g.label) ?? []
      expect(labels.slice(0, expected.length)).toEqual(expected)
    })
  })

  it('duplicates the track within each row, not across them', () => {
    const { container } = render(<StackCarousel />)
    for (const row of container.querySelectorAll('.stack-carousel')) {
      expect(row.querySelectorAll('.stack-carousel-half')).toHaveLength(2)
    }
  })

  // Two scroll regions in the same page need distinguishable names, or a
  // screen-reader landmark list shows the same entry twice.
  it('names the two rows differently', () => {
    const { container } = render(<StackCarousel />)
    const names = [...container.querySelectorAll('.stack-carousel')]
      .map(r => r.getAttribute('aria-label'))
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
  })

  // The rows exist to move in opposite directions; if the roster ever loses
  // one, the split silently becomes a single row again.
  it('keeps every roster item across the two rows', () => {
    expect(STACK_ROWS.flat()).toEqual(STACK_GROUPS)
    expect(STACK_ROWS).toHaveLength(2)
    for (const row of STACK_ROWS) expect(row.length).toBeGreaterThan(0)
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

  // HAProxy publishes no mark that reads at glyph size, so it is set as type.
  // Rendering an empty <svg> for it would leave a hole in the row; the
  // wordmark class is what the stylesheet keys the type treatment on.
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
    // Each row carries a leading half and an inert clone, so across both rows
    // the pattern must alternate rather than, say, hiding a whole row.
    for (const row of container.querySelectorAll('.stack-carousel')) {
      const [first, second] = row.querySelectorAll('.stack-carousel-half')
      expect(row.querySelectorAll('.stack-carousel-half')).toHaveLength(2)
      expect(first?.hasAttribute('aria-hidden')).toBe(false)
      expect(second?.getAttribute('aria-hidden')).toBe('true')
    }
  })

  // Decorative duplicate glyphs would otherwise be announced as images.
  it('marks each glyph as presentational', () => {
    const { container } = render(<StackCarousel />)
    const svgs = [...container.querySelectorAll('.stack-item svg')]
    expect(svgs.length).toBeGreaterThan(0)
    expect(svgs.every(s => s.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})
