// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import WhatWeBuild from './whatWeBuild'
import { hostOf, productsData } from '~/utils/data/products'

afterEach(cleanup)

describe('WhatWeBuild', () => {
  it('names every product under an h3', () => {
    render(<WhatWeBuild />)
    for (const { title } of productsData) {
      const heading = screen.getByRole('heading', { name: title })
      // The level is the assertion worth making: the section's own h2
      // precedes these, and the e2e axe scan of /about gates on
      // heading-order. getByRole already throws if the heading is absent.
      expect(heading.tagName).toBe('H3')
    }
  })

  it('labels each canonical link with its hostname', () => {
    render(<WhatWeBuild />)
    for (const { href } of productsData) {
      const link = screen.getByRole('link', { name: hostOf(href) })
      expect(link.getAttribute('href')).toBe(href)
    }
  })

  // "Coston2 testnet" is unique today and stops being unique the moment a
  // second product ships a testnet. The accessible name has to carry the
  // product so the link list never goes ambiguous.
  it('names the product in every secondary deployment link', () => {
    render(<WhatWeBuild />)
    for (const { title, alsoAt } of productsData) {
      for (const { label, href } of alsoAt ?? []) {
        const link = screen.getByRole('link', { name: `${title} on ${label}` })
        expect(link.getAttribute('href')).toBe(href)
      }
    }
  })

  // Hand-maintained and growing with every entry added: a target="_blank"
  // without rel="noopener noreferrer" is exactly the omission that survives
  // review indefinitely.
  it('opens every outbound link safely', () => {
    const { container } = render(<WhatWeBuild />)
    const links = [...container.querySelectorAll('a')]
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link.getAttribute('href')?.startsWith('https://')).toBe(true)
    }
  })
})
