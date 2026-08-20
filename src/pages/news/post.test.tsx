// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Post from './post'
import type { NewsPost } from '~/utils/data/news'

afterEach(cleanup)

const base: NewsPost = {
  id: 'example',
  date: '2026-08-20',
  category: 'Release',
  title: 'Example Post',
  body: 'Body copy for the example post.',
}

describe('Post', () => {
  it('renders the title as an h2', () => {
    render(<Post post={base} />)
    // The page's own h1 precedes these, and the e2e axe scan of /news gates
    // on heading-order.
    expect(screen.getByRole('heading', { name: 'Example Post' }).tagName).toBe('H2')
  })

  it('carries the raw ISO date in dateTime while displaying the human form', () => {
    const { container } = render(<Post post={base} />)
    const time = container.querySelector('time')
    expect(time?.getAttribute('dateTime')).toBe('2026-08-20')
    expect(time?.textContent).toBe('20 Aug 2026')
  })

  it('renders the category as a chip', () => {
    const { container } = render(<Post post={base} />)
    // getByText would throw on absence, so asserting its truthiness proves
    // nothing; assert the text landed in the element the styles target.
    expect(container.querySelector('.news-post-category')?.textContent).toBe('Release')
  })

  it('labels an unlabelled link with its hostname, and a labelled one with its label', () => {
    render(<Post post={{
      ...base,
      links: [
        { href: 'https://fasset.stakecore.org' },
        { label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' },
      ],
    }} />)
    expect(screen.getByRole('link', { name: 'fasset.stakecore.org' })
      .getAttribute('href')).toBe('https://fasset.stakecore.org')
    expect(screen.getByRole('link', { name: 'Coston2 testnet' })
      .getAttribute('href')).toBe('https://fasset-coston2.stakecore.org')
  })

  // Hand-maintained and growing with every post: a target="_blank" without
  // rel="noopener noreferrer" is exactly the omission that survives review.
  it('opens every outbound link safely', () => {
    const { container } = render(<Post post={{
      ...base,
      links: [
        { href: 'https://fasset.stakecore.org' },
        { label: 'Coston2 testnet', href: 'https://fasset-coston2.stakecore.org' },
      ],
    }} />)
    const links = [...container.querySelectorAll('a')]
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link.getAttribute('href')?.startsWith('https://')).toBe(true)
    }
  })

  it('renders a thumbnail with an empty alt when one is given', () => {
    const { container } = render(<Post post={{ ...base, thumbnail: '/art.svg' }} />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('/art.svg')
    // Decorative: the body already describes the artwork in words, so
    // descriptive alt text would assert something the drawing does not convey.
    expect(img?.getAttribute('alt')).toBe('')
  })

  it('renders no image and no link row when the post has neither', () => {
    const { container } = render(<Post post={base} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.news-post-links')).toBeNull()
  })
})
