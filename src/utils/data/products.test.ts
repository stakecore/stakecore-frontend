// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest'
import { hostOf, productsData } from './products'

describe('hostOf', () => {
  it('reduces an absolute URL to its hostname', () => {
    expect(hostOf('https://fasset.stakecore.org')).toBe('fasset.stakecore.org')
    expect(hostOf('https://fasset.stakecore.org/legend?x=1')).toBe('fasset.stakecore.org')
  })

  // This runs during render, where a throw unmounts the whole route. The
  // failure mode has to be an ugly label, never an exception.
  it('returns the input unchanged when it will not parse', () => {
    expect(() => hostOf('not a url')).not.toThrow()
    expect(hostOf('not a url')).toBe('not a url')
    expect(hostOf('')).toBe('')
  })
})

describe('productsData', () => {
  const everyHref = productsData.flatMap(p => [p.href, ...(p.alsoAt ?? []).map(d => d.href)])

  it('lists at least one product', () => {
    expect(productsData.length).toBeGreaterThan(0)
  })

  it('points every link at an absolute https URL', () => {
    expect(everyHref.length).toBeGreaterThan(0)
    for (const href of everyHref) {
      expect(new URL(href).protocol).toBe('https:')
    }
  })

  it('gives every product a unique id', () => {
    const ids = productsData.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
