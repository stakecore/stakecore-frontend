// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Chain } from '~/enums'

// This page hand-rolls the same loading/error/empty ladder QueryState owns for
// the FSP routes, so it had the same defect and needs the same guarantee: a
// retry after a failure must not tear the error panel down, and a failed
// background refresh must not blank a page that is already good. See
// queryState.test.tsx for the browser trace that found it.

const swrResult = { data: undefined as unknown, error: null as unknown, isLoading: false }
vi.mock('swr', () => ({ default: () => swrResult }))
vi.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}))
vi.mock('spinners-react', () => ({ SpinnerCircular: () => <div data-testid="spinner" /> }))

// Heavy children — this test is about which branch renders, not what they draw.
vi.mock('../info', () => ({ default: () => <div data-testid="info" /> }))
vi.mock('./statistics', () => ({ default: () => <div data-testid="stats" /> }))
vi.mock('../unavailabilityBanner', () => ({ default: () => null }))
vi.mock('../validatorPicker', () => ({ default: () => null }))

import ValidatorPage from './page'

const validator = {
  base: { validatorNodeId: 'NodeID-1', featured: true },
  specs: [],
  summary: {},
  delegation: { validatorLink: { url: 'u', hash: 'h' } },
  graphics: {},
}

const renderPage = (state: Partial<typeof swrResult>) => {
  Object.assign(swrResult, { data: undefined, error: null, isLoading: false }, state)
  return render(
    <ValidatorPage
      chain={Chain.FLARE}
      swrKey="k"
      title="Flare Validator"
      suptitle="sup"
      dataAccess={{ getPageData: vi.fn() }}
      Description={() => <div />}
      OfficialDelegate={() => <div />}
    />,
  )
}

const errorPanel = () => document.querySelector('.error-container')

afterEach(cleanup)

describe('ValidatorPage state ladder', () => {
  it('shows the spinner on the very first load', () => {
    renderPage({ isLoading: true })

    expect(screen.getByTestId('spinner')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })

  it('keeps the error panel while a retry is in flight', () => {
    renderPage({ isLoading: true, error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
    expect(screen.queryByTestId('spinner')).toBeNull()
  })

  it('keeps rendering the loaded validator when a background refresh fails', () => {
    renderPage({ data: [validator], error: new Error('Failed to fetch') })

    expect(screen.getByTestId('info')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })

  it('still shows the error panel when nothing has ever loaded', () => {
    renderPage({ error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
  })

  it('still shows the empty state for a successful response with no validators', () => {
    renderPage({ data: [] })

    expect(screen.getByText('No validators available')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })
})
