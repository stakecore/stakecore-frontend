// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import InfoComponent from './info'
import type { ISummary } from './types'

// The summary card is a label above a value. Two of its four rows are bounded
// ranges, and they used to render as one opaque string — "25.0 to 93.0" — so
// the reader had to infer that the numbers were a min and a max, and the unit
// was missing entirely because the asset sits in a different row of the same
// card. The bounds are named now, and the unit rides along.

const summaryOf = (o: Partial<ISummary> = {}): ISummary => ({
  asset: 'FLR',
  apy: '7.00%',
  delegation: { min: '25.0', max: '93.0', unit: 'FLR' },
  lockup: { min: '14', max: '149', unit: 'days' },
  ...o,
})

const renderInfo = (o: Partial<ISummary> = {}) =>
  render(<InfoComponent summary={summaryOf(o)} specs={[]} />)

// Each row is a .single-info holding <p>label</p> + <h3>value</h3>. Throws
// rather than asserting non-null, so a change to that structure fails here
// with a readable message instead of a null dereference three lines later.
const valueUnder = (label: string): HTMLElement => {
  const value = screen.getByText(label).closest('.single-info')?.querySelector('h3')
  if (value == null) throw new Error(`no <h3> value rendered under "${label}"`)
  return value
}

afterEach(cleanup)

describe('summary card ranges', () => {
  it('names the bounds and carries the unit once, at the end', () => {
    renderInfo()

    // Normalised, because the labels and numbers are separate elements.
    expect(valueUnder('Delegation Amount').textContent?.replace(/\s+/g, ' ').trim())
      .toBe('Min 25.0 Max 93.0 FLR')
  })

  it('does the same for a range whose unit is a word', () => {
    renderInfo()

    expect(valueUnder('Lockup Time').textContent?.replace(/\s+/g, ' ').trim())
      .toBe('Min 14 Max 149 days')
  })

  it('marks up the bound names so they can be de-emphasised', () => {
    renderInfo()

    const bounds = valueUnder('Delegation Amount').querySelectorAll('.single-info-bound')
    expect([...bounds].map(b => b.textContent)).toEqual(['Min', 'Max'])
  })

  it('keeps each bound in its own box, so a wrap cannot split a label from its number', () => {
    renderInfo()

    // The narrow summary column wraps these values. Laid out as one inline
    // run, "Min 50.0k Max 4.45M FLR" broke after "Max" on the real
    // /flare/validator page, stranding the figure a line away from the word
    // naming it. Each bound is its own element so the break lands between
    // them instead.
    const groups = valueUnder('Delegation Amount').querySelectorAll('.single-info-bound-group')
    expect([...groups].map(g => g.textContent?.replace(/\s+/g, ' ').trim()))
      .toEqual(['Min 25.0', 'Max 93.0 FLR'])
  })

  it('renders a plain-string value untouched, with no bound scaffolding', () => {
    // What the FSP routes send: they have no bounds at all.
    renderInfo({ delegation: 'No Limit', lockup: 'No Limit' })

    const value = valueUnder('Delegation Amount')
    expect(value.textContent).toBe('No Limit')
    expect(value.querySelectorAll('.single-info-bound')).toHaveLength(0)
  })

  it('renders the Unavailable fallback as plain text too', () => {
    renderInfo({ delegation: 'Unavailable' })

    expect(valueUnder('Delegation Amount').textContent).toBe('Unavailable')
  })

  it('leaves the unbounded rows alone', () => {
    renderInfo()

    expect(valueUnder('Asset').textContent).toBe('FLR')
    expect(valueUnder('APY').textContent).toBe('7.00%')
  })
})
