// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Same defect as queryState.tsx, and the most visible instance of it: the hero
// decided "is this an error?" with `!isLoading && data == null`, so every retry
// after a failure — during which SWR reports isLoading — swapped the error
// panel back out for the empty stats block. Traced against a backend failing
// after 2.5s, the panel vanished for the whole 2.5s of each retry:
//
//      9684ms  -[hero-error]  +[hero-stats] +[hero-activity]
//     12193ms  -[hero-stats] -[hero-activity]  +[hero-error]
//
// The gap is the fetch duration, so this is a full-size flash rather than the
// 7ms an instant failure produces.

const swrResult = { data: undefined as unknown, error: null as unknown, isLoading: false }
vi.mock('swr', () => ({ default: () => swrResult }))
vi.mock('./heroRuneCanvas', () => ({ default: () => null }))
vi.mock('../ui/recentActivity', () => ({ default: () => <div data-testid="activity" /> }))

import Hero from './hero'

const payload = {
  data: {
    delegated: [{ delegatedUsd: 10, delegators: 2 }],
    historicDelegations: [{ delegatedUsd: 5, delegators: 1 }],
  },
}

const renderHero = (state: Partial<typeof swrResult>) => {
  Object.assign(swrResult, { data: undefined, error: null, isLoading: false }, state)
  return render(<Hero />)
}

const errorPanel = () => document.querySelector('.hero-error')
const stats = () => document.querySelector('.hero-stats')

afterEach(cleanup)

describe('Hero error precedence', () => {
  it('shows the stats skeleton on the very first load, not an error', () => {
    renderHero({ isLoading: true })

    expect(stats()).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })

  it('keeps the error panel while a retry is in flight', () => {
    renderHero({ isLoading: true, error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
    expect(stats()).toBeNull()
  })

  it('shows the error panel once a fetch has settled with no data', () => {
    renderHero({ error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
  })

  it('keeps the stats on screen when a background refresh fails', () => {
    renderHero({ data: payload, error: new Error('Failed to fetch') })

    expect(stats()).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })
})
