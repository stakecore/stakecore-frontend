// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest'
import { hostOf, newsData, sortedPosts, type NewsPost } from './news'

const CATEGORIES = ['Release', 'Network', 'Incident']

describe('hostOf', () => {
  it('reduces an absolute URL to its hostname', () => {
    expect(hostOf('https://fasset.stakecore.org')).toBe('fasset.stakecore.org')
    expect(hostOf('https://fasset.stakecore.org/legend?x=1')).toBe('fasset.stakecore.org')
  })

  // Runs during render, where a throw unmounts the whole route. The failure
  // mode has to be an ugly label, never an exception.
  it('returns the input unchanged when it will not parse', () => {
    expect(() => hostOf('not a url')).not.toThrow()
    expect(hostOf('not a url')).toBe('not a url')
    expect(hostOf('')).toBe('')
  })
})

describe('newsData', () => {
  it('lists at least one post', () => {
    expect(newsData.length).toBeGreaterThan(0)
  })

  it('dates every post as an ISO calendar day', () => {
    for (const { date } of newsData) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(new Date(date).getTime())).toBe(false)
    }
  })

  it('gives every post a unique id', () => {
    const ids = newsData.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only known categories', () => {
    for (const { category } of newsData) {
      expect(CATEGORIES).toContain(category)
    }
  })

  it('points every link at an absolute https URL', () => {
    const hrefs = newsData.flatMap(p => (p.links ?? []).map(l => l.href))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(new URL(href).protocol).toBe('https:')
    }
  })
})

describe('sortedPosts', () => {
  const post = (id: string, date: string): NewsPost => ({
    id, date, category: 'Release', title: id, body: 'x',
  })

  // Seeded rather than run against newsData: a one-post array cannot detect a
  // broken comparator, so testing the sort against live data alone would be a
  // test that cannot fail.
  it('returns posts newest first', () => {
    const out = sortedPosts([
      post('b', '2026-07-02'),
      post('c', '2025-12-31'),
      post('a', '2026-08-20'),
    ])
    expect(out.map(p => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate its input', () => {
    const input = [post('b', '2026-07-02'), post('a', '2026-08-20')]
    sortedPosts(input)
    expect(input.map(p => p.id)).toEqual(['b', 'a'])
  })

  it('defaults to the real feed', () => {
    expect(sortedPosts().map(p => p.id)).toEqual(sortedPosts(newsData).map(p => p.id))
  })
})
